import { NextRequest, NextResponse } from "next/server";
import { scrapeHardwareDealz } from "@/lib/hardwaredealz-scraper";
import { requireAdminAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import openai, { OPENAI_MODEL } from "@/lib/openai";

export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const builds = await scrapeHardwareDealz();
    return NextResponse.json(builds);
  } catch (error: any) {
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
      2. Erstelle für jede Komponente eine kurze Erklärung (max 150 Zeichen), warum diese Komponente für dieses Budget gewählt wurde (z.B. Preis-Leistungs-Sieger, Zukunftssicherheit).
      
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
    console.error("AI Content Generation failed:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { builds, useAI = true } = body;

    if (!builds || !Array.isArray(builds)) {
      return NextResponse.json({ error: "Builds array is required" }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
    };

    for (const buildData of builds) {
      try {
        const slug = buildData.slug || `bester-${buildData.pricePoint}-euro-gaming-pc`;
        const totalPrice = buildData.components.reduce((acc: number, comp: any) => acc + (comp.price || 0), 0);

        let aiContent = null;
        if (useAI) {
          aiContent = await generateAIContent(buildData);
        }

        const description = aiContent?.description || buildData.description;

        const componentsData = buildData.components.map((comp: any, index: number) => {
          // Fallback to specific Amazon search link if no affiliate link provided
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

        // Only add image if the field exists in the DB (workaround for migration issues)
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
      } catch (error) {
        console.error(`Failed to import build for ${buildData.pricePoint}€:`, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      message: `Import abgeschlossen. ${results.created} erstellt, ${results.updated} aktualisiert, ${results.failed} fehlgeschlagen.`,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

