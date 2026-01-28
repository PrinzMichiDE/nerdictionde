import { NextRequest, NextResponse } from "next/server";
import { scrapeHardwareDealz } from "@/lib/hardwaredealz-scraper";
import { requireAdminAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { processHardware } from "@/app/api/reviews/bulk-create-hardware/route";

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

    // Collect all unique component names for review generation
    const componentNames = new Set<string>();

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

          // Collect component name for review generation (skip empty names)
          if (comp.name && comp.name.trim()) {
            componentNames.add(comp.name.trim());
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

        // Find existing build - MUST use findFirst (not findUnique) because pricePoint alone is no longer unique
        // The unique constraint is now on [pricePoint, type] compound key
        const existingBuild = await prisma.pCBuild.findFirst({
          where: { 
            pricePoint: buildData.pricePoint,
            ...(hasTypeField ? { type: buildData.type || "desktop" } : {})
          },
        });

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

    // Generate reviews for all imported components (without duplicates)
    let reviewResults = {
      attempted: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
    };

    if (componentNames.size > 0) {
      console.log(`🔄 Starting review generation for ${componentNames.size} unique components...`);
      
      // Check which components already have reviews to avoid duplicates
      const componentNamesArray = Array.from(componentNames);
      
      // Check for existing hardware with reviews
      const existingHardware = await prisma.hardware.findMany({
        where: {
          name: { in: componentNamesArray },
        },
        include: {
          reviews: {
            select: { id: true },
            take: 1, // We only need to know if at least one review exists
          },
        },
      });

      // Create a set of hardware names that already have reviews
      const hardwareWithReviews = new Set(
        existingHardware
          .filter((h) => h.reviews && h.reviews.length > 0)
          .map((h) => h.name.toLowerCase())
      );

      // Also check reviews by title to catch duplicates
      const existingReviews = await prisma.review.findMany({
        where: {
          title: { in: componentNamesArray },
          category: "hardware",
        },
        select: { title: true },
      });

      const reviewsByTitle = new Set(
        existingReviews.map((r) => r.title.toLowerCase())
      );

      // Filter out components that already have reviews
      const componentsToProcess = componentNamesArray.filter((name) => {
        const nameLower = name.toLowerCase();
        return !hardwareWithReviews.has(nameLower) && !reviewsByTitle.has(nameLower);
      });

      console.log(`📊 Found ${componentsToProcess.length} components without reviews (${componentNames.size - componentsToProcess.length} already have reviews)`);

      if (componentsToProcess.length > 0) {
        // Process reviews in batches to avoid overwhelming the system
        const batchSize = 3;
        const delayBetweenBatches = 3000;

        for (let i = 0; i < componentsToProcess.length; i += batchSize) {
          const batch = componentsToProcess.slice(i, i + batchSize);
          
          const batchPromises = batch.map((componentName) =>
            processHardware(componentName, {
              status: "published",
              skipExisting: true,
              generateImages: true,
            })
          );

          const batchResults = await Promise.allSettled(batchPromises);

          batchResults.forEach((result) => {
            reviewResults.attempted++;
            if (result.status === "fulfilled") {
              const processResult = result.value;
              if (processResult.success) {
                reviewResults.successful++;
              } else if (processResult.error === "Review already exists") {
                reviewResults.skipped++;
              } else {
                reviewResults.failed++;
              }
            } else {
              reviewResults.failed++;
            }
          });

          // Delay between batches (except for the last batch)
          if (i + batchSize < componentsToProcess.length) {
            await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
          }
        }

        console.log(`✅ Review generation completed: ${reviewResults.successful} successful, ${reviewResults.failed} failed, ${reviewResults.skipped} skipped`);
      }
    }

    return NextResponse.json({
      message: `Import abgeschlossen. ${results.created} erstellt, ${results.updated} aktualisiert, ${results.failed} fehlgeschlagen. Reviews: ${reviewResults.successful} erstellt, ${reviewResults.failed} fehlgeschlagen, ${reviewResults.skipped} übersprungen.`,
      results,
      reviewResults: {
        attempted: reviewResults.attempted,
        successful: reviewResults.successful,
        failed: reviewResults.failed,
        skipped: reviewResults.skipped,
        totalComponents: componentNames.size,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

