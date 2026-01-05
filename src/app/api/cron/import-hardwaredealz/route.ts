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
    
    const categories: Array<"desktop" | "laptop"> = ["desktop", "laptop"];
    const allResults = {
      created: 0,
      updated: 0,
      failed: 0,
    };

    for (const category of categories) {
      console.log(`Scraping category: ${category}`);
      const builds = await scrapeHardwareDealz(category);
      
      if (!builds || builds.length === 0) {
        console.log(`Keine ${category} Builds zum Importieren gefunden.`);
        continue;
      }

      for (const buildData of builds) {
        try {
          const typeSuffix = category === "laptop" ? "-laptop" : "";
          const slug = `bester-${buildData.pricePoint}-euro-gaming-pc${typeSuffix}`;
          const totalPrice = buildData.components.reduce((acc: number, comp: any) => acc + (comp.price || 0), 0);

          // AI Content Generation
          const aiContent = await generateAIContent(buildData);
          const description = aiContent?.description || buildData.description;

          const componentsData = buildData.components.map((comp: any, index: number) => {
            let affiliateLink = comp.affiliateLink;
            
            // Force Amazon search link if not already a direct Amazon link
            const isAmazonDirect = affiliateLink && (affiliateLink.includes("amazon.de/dp/") || affiliateLink.includes("amzn.to"));
            
            if (!isAmazonDirect) {
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

          // Safer way to handle the 'type' and 'image' field if Prisma hasn't synchronized yet
          const hasTypeField = (prisma as any)._baseClient?._dmmf?.modelMap?.PCBuild?.fields?.some((f: any) => f.name === "type");
          const hasImageField = (prisma as any)._baseClient?._dmmf?.modelMap?.PCBuild?.fields?.some((f: any) => f.name === "image");

          // Find existing build
          let existingBuild = null;
          if (hasTypeField) {
            existingBuild = await (prisma.pCBuild as any).findUnique({
              where: { 
                pricePoint_type: {
                  pricePoint: buildData.pricePoint,
                  type: category
                }
              },
            });
          } else {
            existingBuild = await prisma.pCBuild.findUnique({
              where: { pricePoint: buildData.pricePoint },
            });
          }

          const buildDataToSave: any = {
            title: buildData.title,
            description,
            totalPrice,
            updatedAt: new Date(),
            lastScrapedAt: new Date(),
            metadata: aiContent?.detailSections ? { detailSections: aiContent.detailSections } : undefined,
            components: {
              create: componentsData,
            },
          };

          if (hasTypeField) {
            buildDataToSave.type = category;
          }

          if (buildData.image && hasImageField) {
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
            allResults.updated++;
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
            allResults.created++;
          }

          // Delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Failed to import build for ${buildData.pricePoint}€ ${category}:`, error);
          allResults.failed++;
        }
      }
    }

    return NextResponse.json({
      message: `Cron Import abgeschlossen. ${allResults.created} erstellt, ${allResults.updated} aktualisiert, ${allResults.failed} fehlgeschlagen.`,
      results: allResults,
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
      Du bist ein Hardware-Experte für Gaming-PCs. Ich habe ein PC-Setup von Nerdiction für ${buildData.pricePoint}€ zusammengestellt.
      Komponenten: ${componentList}
      
      Aufgabe:
      1. Erstelle eine packende, SEO-optimierte Beschreibung (ca. 3-4 Sätze, max 300 Zeichen) für diesen PC.
      2. Erstelle für JEDE Komponente eine kurze Erklärung (max 150 Zeichen), warum diese Komponente für dieses Budget gewählt wurde.
      3. Erstelle 4-5 ausführliche Abschnitte für die Sektion "Der Gaming PC im Detail". 
         Jeder Abschnitt sollte einen Titel (z.B. "Der Prozessor", "Die Grafikkarte", "Gaming Performance") und einen ausführlichen Text (3-5 Sätze) haben.
         Gehe auf die Leistung, die Synergie der Teile und die Zielgruppe ein.
      
      Antworte NUR im JSON-Format:
      {
        "description": "...",
        "componentExplanations": {
          "Name der Komponente": "Erklärung...",
          ...
        },
        "detailSections": [
          { "title": "Titel", "content": "Ausführlicher Text..." },
          ...
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    let contentString = response.choices[0].message.content || "{}";
    
    // Improved robust cleaning of markdown code blocks and invisible characters
    contentString = contentString.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
    
    // Find the first { and last } to extract only the JSON object
    const firstBrace = contentString.indexOf("{");
    const lastBrace = contentString.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      contentString = contentString.substring(firstBrace, lastBrace + 1);
    }

    const content = JSON.parse(contentString);
    return content;
  } catch (error) {
    console.error("AI Content Generation failed in Cron:", error);
    return null;
  }
}

