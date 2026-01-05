import { NextRequest, NextResponse } from "next/server";
import { scrapeHardwareDealz } from "@/lib/hardwaredealz-scraper";
import { requireAdminAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import openai, { OPENAI_MODEL } from "@/lib/openai";

export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const category = (url.searchParams.get("category") as "desktop" | "laptop") || "desktop";

  try {
    const builds = await scrapeHardwareDealz(category);
    return NextResponse.json(builds);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateAIContent(buildData: any) {
  try {
    const componentList = buildData.components.map((c: any) => `${c.type}: ${c.name}`).join(", ");
    const typeLabel = buildData.type === "laptop" ? "Gaming Laptop" : "Gaming PC";
    
    const prompt = `
      Du bist ein Hardware-Experte für Gaming-Hardware. Ich habe ein ${typeLabel}-Setup von Nerdiction für ${buildData.pricePoint}€ zusammengestellt.
      Komponenten: ${componentList}
      
      Aufgabe:
      1. Erstelle eine packende, SEO-optimierte Beschreibung (ca. 3-4 Sätze, max 300 Zeichen) für dieses Gerät.
      2. Erstelle für JEDE Komponente eine kurze Erklärung (max 150 Zeichen), warum diese Komponente für dieses Budget gewählt wurde.
      3. Erstelle 4-5 ausführliche Abschnitte für die Sektion "Hardware im Detail". 
         Jeder Abschnitt sollte einen Titel (z.B. "Der Prozessor", "Die Grafikkarte", "Gaming Performance", "Das Display" bei Laptops) und einen ausführlichen Text (3-5 Sätze) haben.
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
        const typeSuffix = buildData.type === "laptop" ? "-laptop" : "";
        const slug = buildData.slug || `bester-${buildData.pricePoint}-euro-gaming-pc${typeSuffix}`;
        const totalPrice = buildData.components.reduce((acc: number, comp: any) => acc + (comp.price || 0), 0);

        let aiContent = null;
        if (useAI) {
          aiContent = await generateAIContent(buildData);
        }

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
                type: buildData.type || "desktop"
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
          buildDataToSave.type = buildData.type || "desktop";
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

