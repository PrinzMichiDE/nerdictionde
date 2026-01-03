import { NextRequest, NextResponse } from "next/server";
import { createHardware, detectHardwareType, HardwareType } from "@/lib/hardware";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { uploadImage } from "@/lib/blob";
import prisma from "@/lib/prisma";
import { calculatePublicationDate } from "@/lib/date-utils";

interface BulkCreateHardwareOptions {
  hardwareNames: string[]; // List of hardware names to create reviews for
  batchSize?: number;
  delayBetweenBatches?: number;
  status?: "draft" | "published";
  skipExisting?: boolean;
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Helper function to generate review content using OpenAI
async function generateHardwareReviewContent(
  hardwareData: { name: string; type: HardwareType; manufacturer?: string; model?: string; description?: string; specs?: any }
): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
  specs?: any;
}> {
  const prompt = `
    Schreibe eine EXTREM AUSFÜHRLICHE professionelle Hardware-Review für "${hardwareData.name}" in Deutsch UND Englisch.
    
    ANFORDERUNGEN AN DEN INHALT:
    1. Der Text muss MASSIV DETAILLIERT sein (Ziel: 1200-1500 Wörter pro Sprache).
    2. Nutze eine tiefgehende journalistische Struktur mit aussagekräftigen H2- und H3-Überschriften.
    3. Füge am Anfang jedes Berichts ein "Inhaltsverzeichnis" (Table of Contents) in Markdown-Listenform ein, das auf die Überschriften verweist (nutze Anker-Links wie [Überschrift](#überschrift)).
    4. Gehe extrem tief ins Detail:
       - Design & Ergonomie: Haptik, Materialien und tägliche Nutzung.
       - Technische Leistung: Benchmarks, Hitzeentwicklung, Lautstärke und Effizienz.
       - Features & Software: Integration, Treibersoftware und Zusatzfunktionen.
       - Preis-Leistung: Einordnung im aktuellen Marktvergleich.
       - Fazit: Für wen lohnt sich der Kauf?
    5. BILD-INTEGRATION:
       Integriere im Fließtext an passenden Stellen (ca. alle 3-4 Absätze) Bild-Platzhalter im Format:
       ![[IMAGE_1]]
       ![[IMAGE_2]]
       ![[IMAGE_3]]
       Nutze bis zu 5 verschiedene Platzhalter (IMAGE_1 bis IMAGE_5). Platziere sie dort, wo ein Produktfoto den Text sinnvoll ergänzen würde.
    
    WICHTIG: Erwähne NIEMALS, dass dieser Text von einer KI, AI oder einem Sprachmodell generiert wurde. Der Text muss so klingen, als wäre er von einem passionierten Experten von Nerdiction geschrieben worden. Nutze einen professionellen, journalistischen, enthusiastischen, aber objektiven Tonfall.
    
    Antworte EXKLUSIV im JSON-Format mit folgendem Schema:
    {
      "de": {
        "title": "...",
        "content": "Markdown mit Inhaltsverzeichnis, ausführlicher Einleitung, mehreren tiefgehenden Analyse-Abschnitten mit Überschriften, BILD-PLATZHALTERN (![[IMAGE_X]]) und Fazit...",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "en": {
        "title": "...",
        "content": "Markdown with Table of Contents, detailed intro, several deep-dive analysis sections with headings, IMAGE PLACEHOLDERS (![[IMAGE_X]]) and conclusion...",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "score": 0-100,
      "specs": {
        // Hardware-spezifische Spezifikationen basierend auf dem Typ
      }
    }
    
    Hardware-Typ: ${hardwareData.type}
    Hersteller: ${hardwareData.manufacturer || "Unbekannt"}
    Modell: ${hardwareData.model || hardwareData.name}
    Beschreibung: ${hardwareData.description || "Keine Beschreibung verfügbar"}
    ${hardwareData.specs ? `Bekannte Specs: ${JSON.stringify(hardwareData.specs)}` : ""}
  `;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    let contentRaw = aiResponse.choices[0].message.content || "{}";
    
    // Fallback: Strip markdown code blocks if the AI included them
    if (contentRaw.startsWith("```json")) {
      contentRaw = contentRaw.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (contentRaw.startsWith("```")) {
      contentRaw = contentRaw.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    return JSON.parse(contentRaw);
  } catch (error) {
    console.error(`Error generating content for ${hardwareData.name}:`, error);
    // Return fallback content
    return {
      de: {
        title: hardwareData.name,
        content: `## Einleitung\n\n${hardwareData.description || "Keine Beschreibung verfügbar."}\n\n## Fazit\n\nEin interessantes Hardware-Produkt, das es wert ist, genauer betrachtet zu werden.`,
        pros: ["Gute Leistung", "Solide Verarbeitung", "Gute Features", "Guter Preis", "Zuverlässig"],
        cons: ["Könnte mehr Features haben", "Design könnte moderner sein", "Leicht laut", "Hoher Stromverbrauch", "Begrenzte Kompatibilität"],
      },
      en: {
        title: hardwareData.name,
        content: `## Introduction\n\n${hardwareData.description || "No description available."}\n\n## Conclusion\n\nAn interesting hardware product worth taking a closer look at.`,
        pros: ["Good performance", "Solid build quality", "Great features", "Good value", "Reliable"],
        cons: ["Could have more features", "Design could be more modern", "Slightly noisy", "High power consumption", "Limited compatibility"],
      },
      score: 70,
      specs: hardwareData.specs || null,
    };
  }
}

// Helper function to extract manufacturer and model from hardware name
function parseHardwareName(name: string): { manufacturer?: string; model?: string } {
  const parts = name.trim().split(/\s+/);
  
  // Common manufacturers
  const manufacturers = [
    "NVIDIA", "AMD", "Intel", "ASUS", "MSI", "Gigabyte", "EVGA", "Zotac", 
    "Sony", "Microsoft", "Nintendo", "Razer", "Logitech", "Corsair",
    "Samsung", "Western Digital", "Seagate", "Crucial", "Kingston",
    "Cooler Master", "Noctua", "be quiet!", "Fractal Design", "Lian Li"
  ];
  
  let manufacturer: string | undefined;
  let model: string | undefined;
  
  // Try to find manufacturer at the start
  for (const mfr of manufacturers) {
    if (name.toUpperCase().startsWith(mfr.toUpperCase())) {
      manufacturer = mfr;
      model = name.substring(mfr.length).trim();
      break;
    }
  }
  
  // If no manufacturer found, try common patterns
  if (!manufacturer) {
    // RTX/GTX pattern (NVIDIA)
    if (name.match(/RTX|GTX/i)) {
      manufacturer = "NVIDIA";
      model = name;
    }
    // Ryzen pattern (AMD)
    else if (name.match(/Ryzen|Radeon/i)) {
      manufacturer = "AMD";
      model = name;
    }
    // Core i pattern (Intel)
    else if (name.match(/Core i|Xeon|Pentium|Celeron/i)) {
      manufacturer = "Intel";
      model = name;
    }
    // PlayStation/Xbox pattern
    else if (name.match(/PlayStation|PS\d|Xbox/i)) {
      manufacturer = name.match(/PlayStation|PS\d/i) ? "Sony" : "Microsoft";
      model = name;
    }
    else {
      model = name;
    }
  }
  
  return { manufacturer, model };
}

// Helper function to process a single hardware item
async function processHardware(
  hardwareName: string,
  options: { status: "draft" | "published"; skipExisting: boolean }
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    // Detect hardware type
    const hardwareType = detectHardwareType(hardwareName) || "gpu";
    
    // Parse manufacturer and model
    const { manufacturer, model } = parseHardwareName(hardwareName);
    
    // Check if hardware already exists
    let hardware = await prisma.hardware.findFirst({
      where: {
        OR: [
          { name: { equals: hardwareName, mode: "insensitive" } },
          { model: { equals: model || hardwareName, mode: "insensitive" } },
        ],
      },
    });
    
    // Check if review already exists for this hardware
    if (options.skipExisting && hardware) {
      const existingReview = await prisma.review.findFirst({
        where: { hardwareId: hardware.id },
      });
      if (existingReview) {
        return { success: false, error: "Review already exists" };
      }
    }
    
    // Create hardware entry if it doesn't exist
    if (!hardware) {
      hardware = await createHardware({
        name: hardwareName,
        type: hardwareType,
        manufacturer,
        model: model || hardwareName,
        images: [],
      });
    }
    
    // Generate review content
    const reviewContent = await generateHardwareReviewContent({
      name: hardware.name,
      type: hardware.type as HardwareType,
      manufacturer: hardware.manufacturer || undefined,
      model: hardware.model || undefined,
      description: hardware.description || undefined,
      specs: hardware.specs || undefined,
    });
    
    // Generate slug
    let slug = generateSlug(reviewContent.de.title);
    const existingSlug = await prisma.review.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }
    
    // Upload images if available (hardware might have images)
    let imageUrls: string[] = [];
    if (hardware.images && hardware.images.length > 0) {
      for (let i = 0; i < Math.min(hardware.images.length, 5); i++) {
        try {
          const syncedUrl = await uploadImage(
            hardware.images[i],
            `${slug}-hardware-${i+1}.jpg`
          );
          imageUrls.push(syncedUrl);
        } catch (err) {
          // If upload fails, use original URL
          imageUrls.push(hardware.images[i]);
        }
      }
    }
    
    // Create review
    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "hardware",
        content: reviewContent.de.content,
        content_en: reviewContent.en.content,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        youtubeVideos: [],
        status: options.status,
        hardwareId: hardware.id,
        specs: reviewContent.specs || hardware.specs || null,
        createdAt: hardware.releaseDate || new Date(),
      },
    });
    
    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`Error processing hardware ${hardwareName}:`, error);
    return { success: false, error: error.message };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: BulkCreateHardwareOptions = await req.json();
    
    if (!body.hardwareNames || !Array.isArray(body.hardwareNames) || body.hardwareNames.length === 0) {
      return NextResponse.json(
        { error: "hardwareNames array is required" },
        { status: 400 }
      );
    }
    
    const {
      hardwareNames,
      batchSize = 3, // Smaller batch size for hardware (AI generation is slower)
      delayBetweenBatches = 3000, // Longer delay for hardware
      status = "draft",
      skipExisting = true,
    } = body;
    
    const results = {
      total: hardwareNames.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      reviews: [] as Array<{ id: string; title: string; slug: string }>,
      errors: [] as Array<{ hardware: string; error: string }>,
    };
    
    // Process hardware in batches
    for (let i = 0; i < hardwareNames.length; i += batchSize) {
      const batch = hardwareNames.slice(i, i + batchSize);
      
      const batchPromises = batch.map((hardwareName) =>
        processHardware(hardwareName.trim(), { status, skipExisting })
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const hardwareName = batch[index];
        if (result.status === "fulfilled") {
          const processResult = result.value;
          if (processResult.success && processResult.reviewId) {
            results.successful++;
            // Get review to get title and slug
            prisma.review.findUnique({ where: { id: processResult.reviewId } })
              .then((review) => {
                if (review) {
                  results.reviews.push({
                    id: review.id,
                    title: review.title,
                    slug: review.slug,
                  });
                }
              })
              .catch(() => {
                // Fallback if we can't fetch review
                results.reviews.push({
                  id: processResult.reviewId!,
                  title: hardwareName,
                  slug: generateSlug(hardwareName),
                });
              });
          } else if (processResult.error === "Review already exists") {
            results.skipped++;
          } else {
            results.failed++;
            results.errors.push({
              hardware: hardwareName,
              error: processResult.error || "Unknown error",
            });
          }
        } else {
          results.failed++;
          results.errors.push({
            hardware: hardwareName,
            error: result.reason?.message || "Processing failed",
          });
        }
      });
      
      // Delay between batches (except for the last batch)
      if (i + batchSize < hardwareNames.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    // Wait a bit for all review fetches to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return NextResponse.json({
      message: `Bulk hardware creation completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
      results,
    });
  } catch (error: any) {
    console.error("Bulk hardware create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

