import { NextRequest, NextResponse } from "next/server";
import { scrapeHardwareDealz } from "@/lib/hardwaredealz-scraper";
import { checkAdminAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import openai, { OPENAI_MODEL } from "@/lib/openai";

/**
 * Cron Job: Importiert monatlich die aktuellsten Gaming PC Setups von HardwareDealz
 * Läuft am 1. jedes Monats um 3:00 Uhr UTC
 */
export async function GET(req: NextRequest) {
  try {
    // Check for authorization (Vercel Cron Secret OR Admin Auth)
    const authHeader = req.headers.get('authorization');
    const isCronAuth = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isAdminAuth = checkAdminAuth(req);
    
    if (!isCronAuth && !isAdminAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🚀 Starting HardwareDealz Cron Import...");
    const builds = await scrapeHardwareDealz();
    
    if (!builds || builds.length === 0) {
      return NextResponse.json({ message: "Keine Builds zum Importieren gefunden." });
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
    };

    for (const buildData of builds) {
      try {
        const slug = `bester-${buildData.pricePoint}-euro-gaming-pc`;
        const totalPrice = buildData.components.reduce((acc: number, comp: any) => acc + (comp.price || 0), 0);

        // AI Content Generation
        const aiContent = await generateAIContent(buildData);
        const description = aiContent?.description || buildData.description;

        const componentsData = buildData.components.map((comp: any, index: number) => {
          // Fallback to specific Amazon search link
          let affiliateLink = comp.affiliateLink;
          if (!affiliateLink) {
            const encodedName = encodeURIComponent(comp.name);
            affiliateLink = `https://www.amazon.de/s?k=${encodedName}&tag=michelfritzschde-21&linkCode=ll2&linkId=38ed3b9216199de826066e1da9e63e2d&language=de_DE&ref_=as_li_ss_tl`;
          }

          return {
            type: comp.type,
            name: comp.name,
            price: comp.price,
            affiliateLink,
            description: aiContent?.componentExplanations?.[comp.name] || null,
            sortOrder: index,
          };
        });

        // Find existing build by pricePoint
        const existingBuild = await prisma.pCBuild.findUnique({
          where: { pricePoint: buildData.pricePoint },
        });

        const buildDataToSave: any = {
          title: buildData.title,
          description,
          totalPrice,
          updatedAt: new Date(),
          lastScrapedAt: new Date(),
          components: {
            create: componentsData,
          },
        };

        if (buildData.image) {
          buildDataToSave.image = buildData.image;
        }

        if (existingBuild) {
          // Update existing
          await prisma.pCComponent.deleteMany({
            where: { pcBuildId: existingBuild.id },
          });

          await prisma.pCBuild.update({
            where: { id: existingBuild.id },
            data: buildDataToSave,
          });
          results.updated++;
        } else {
          // Create new
          await prisma.pCBuild.create({
            data: {
              ...buildDataToSave,
              pricePoint: buildData.pricePoint,
              slug,
              status: "published",
            },
          });
          results.created++;
        }

        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to import build for ${buildData.pricePoint}€:`, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      message: `Cron Import abgeschlossen. ${results.created} erstellt, ${results.updated} aktualisiert, ${results.failed} fehlgeschlagen.`,
      results,
    });
  } catch (error: any) {
    console.error("Cron HardwareDealz Import Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateAIContent(buildData: any) {
  try {
    const componentList = buildData.components.map((c: any) => `${c.type}: ${c.name}`).join(", ");
    
    const prompt = `
      Du bist ein Hardware-Experte für Gaming-PCs. Ich habe ein PC-Setup von HardwareDealz für ${buildData.pricePoint}€ gescrapt.
      Komponenten: ${componentList}
      
      Aufgabe:
      1. Erstelle eine packende, SEO-optimierte Beschreibung (ca. 3-4 Sätze, max 300 Zeichen) für diesen PC. Erwähne, welche Spiele (z.B. Fortnite, Valorant, AAA-Titel) in welcher Auflösung (FullHD, QHD) flüssig laufen.
      2. Erstelle für jede Komponente eine kurze Erklärung (max 150 Zeichen), warum diese Komponente für dieses Budget gewählt wurde.
      
      Antworte NUR im JSON-Format:
      {
        "description": "...",
        "componentExplanations": {
          "Name der Komponente": "Erklärung...",
          ...
        }
      }
    `;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    let contentString = response.choices[0].message.content || "{}";
    
    // Robust cleaning of markdown code blocks
    if (contentString.includes("```")) {
      contentString = contentString.replace(/```json\n?|```/g, "").trim();
    }

    const content = JSON.parse(contentString);
    return content;
  } catch (error) {
    console.error("AI Content Generation failed in Cron:", error);
    return null;
  }
}

