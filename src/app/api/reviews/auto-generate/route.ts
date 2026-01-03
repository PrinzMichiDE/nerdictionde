import { NextRequest, NextResponse } from "next/server";
import { searchIGDB, getIGDBGameBySteamId } from "@/lib/igdb";
import { parseSteamUrl } from "@/lib/steam";
import { parseAmazonUrl, scrapeAmazonProduct } from "@/lib/amazon";
import { searchHardware, detectHardwareType, createHardware, HardwareType } from "@/lib/hardware";
import { uploadImage } from "@/lib/blob";
import { calculatePublicationDate } from "@/lib/date-utils";
import { requireAdminAuth } from "@/lib/auth";
import { 
  generateReviewContent, 
  generateHardwareReviewContent,
  generateContent 
} from "@/lib/review-generation";

export async function POST(req: NextRequest) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { input, category: requestedCategory } = await req.json();

    if (!input) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }

    let data: any = null;
    let category: "game" | "hardware" | "amazon" = requestedCategory || "game";

    // Search logic
    if (requestedCategory === "amazon") {
      try {
        const amazonAsin = parseAmazonUrl(input);
        const amazonUrl = input.startsWith("http") ? input : `https://www.amazon.de/dp/${amazonAsin || input}`;
        data = await scrapeAmazonProduct(amazonUrl);
        if (!data || !data.name) {
          return NextResponse.json({ error: "Amazon-Produkt konnte nicht gefunden werden. Bitte überprüfe die URL oder ASIN." }, { status: 404 });
        }
        category = "amazon";
      } catch (error: any) {
        console.error("Amazon scraping error:", error);
        return NextResponse.json({ error: error.message || "Fehler beim Laden der Amazon-Produktdaten. Bitte versuche es erneut oder gib die Daten manuell ein." }, { status: 500 });
      }
    } else if (requestedCategory === "hardware") {
      try {
        const hardwareType = detectHardwareType(input);
        const hardwareResults = await searchHardware(input);
        if (hardwareResults && hardwareResults.length > 0) {
          const hardware = hardwareResults[0];
          // Map database hardware object to expected format
          data = {
            id: hardware.id,
            name: hardware.name,
            type: hardware.type,
            manufacturer: hardware.manufacturer || null,
            model: hardware.model || null,
            description: hardware.description || hardware.description_en || null,
            specs: hardware.specs,
            images: Array.isArray(hardware.images) ? hardware.images : [],
          };
          category = "hardware";
        } else {
          // No hardware found in database, create new entry with detected type
          data = {
            name: input,
            type: hardwareType || "gpu",
            manufacturer: null,
            model: null,
            description: null,
            specs: null,
            images: [],
          };
          category = "hardware";
        }
      } catch (error: any) {
        console.error("Hardware search error:", error);
        return NextResponse.json({ error: error.message || "Fehler bei der Hardware-Suche. Bitte versuche es erneut." }, { status: 500 });
      }
    } else if (requestedCategory === "game" || !requestedCategory) {
      const steamId = parseSteamUrl(input);
      if (steamId) {
        data = await getIGDBGameBySteamId(steamId);
        category = "game";
      } else {
        const results = await searchIGDB(input);
        if (results && results.length > 0) {
          data = results[0];
          category = "game";
        }
      }
    }

    // Auto-detection fallback
    if (!data && !requestedCategory) {
      const steamId = parseSteamUrl(input);
      const amazonAsin = parseAmazonUrl(input);
      if (steamId) {
        data = await getIGDBGameBySteamId(steamId);
        category = "game";
      } else if (amazonAsin || input.includes("amazon.")) {
        try {
          category = "amazon";
          const amazonUrl = input.startsWith("http") ? input : `https://www.amazon.de/dp/${amazonAsin}`;
          data = await scrapeAmazonProduct(amazonUrl);
          if (!data || !data.name) {
            data = null; // Will trigger "Product not found" error
          }
        } catch (error) {
          console.error("Amazon scraping error in fallback:", error);
          data = null; // Will trigger "Product not found" error
        }
      } else {
        const hardwareType = detectHardwareType(input);
        if (hardwareType) {
          const hardwareResults = await searchHardware(input);
          if (hardwareResults && hardwareResults.length > 0) {
            const hardware = hardwareResults[0];
            // Map database hardware object to expected format
            data = {
              id: hardware.id,
              name: hardware.name,
              type: hardware.type,
              manufacturer: hardware.manufacturer,
              model: hardware.model,
              description: hardware.description || hardware.description_en || null,
              specs: hardware.specs,
              images: Array.isArray(hardware.images) ? hardware.images : [],
            };
            category = "hardware";
          } else {
            data = { name: input, type: hardwareType, description: null, specs: null, images: [] };
            category = "hardware";
          }
        }
      }
    }

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Generate content using centralized helpers (with built-in repair and retries)
    let result;
    try {
      if (category === "game") {
        result = await generateReviewContent(data);
      } else if (category === "hardware") {
        if (!data.name || !data.type) {
          return NextResponse.json({ error: "Hardware-Daten unvollständig. Name und Typ sind erforderlich." }, { status: 400 });
        }
        result = await generateHardwareReviewContent({
          name: data.name,
          type: data.type as HardwareType,
          manufacturer: data.manufacturer || undefined,
          model: data.model || undefined,
          description: data.description || undefined,
          specs: data.specs || undefined,
        });
      } else if (category === "amazon") {
        if (!data.name) {
          return NextResponse.json({ error: "Amazon-Produktdaten unvollständig. Produktname fehlt." }, { status: 400 });
        }
        // Amazon or other - use generateContent directly
        const prompt = `
          Schreibe eine EXTREM AUSFÜHRLICHE professionelle ${category}-Review für "${data.name}" in Deutsch UND Englisch.
          
          ANFORDERUNGEN AN DEN INHALT:
          1. Der Text muss MASSIV DETAILLIERT sein (Ziel: 1200-1500 Wörter pro Sprache).
          2. Nutze eine tiefgehende journalistische Struktur mit aussagekräftigen H2- und H3-Überschriften.
          3. Füge am Anfang jedes Berichts ein "Inhaltsverzeichnis" (Table of Contents) in Markdown-Listenform ein, das auf die Überschriften verweist.
          4. BILD-INTEGRATION: Integriere im Fließtext an passenden Stellen Bild-Platzhalter ![[IMAGE_X]].
          
          WICHTIG: Erwähne NIEMALS eine KI. Antworte EXKLUSIV im JSON-Format:
          {
            "de": { "title": "...", "content": "...", "pros": [...], "cons": [...] },
            "en": { "title": "...", "content": "...", "pros": [...], "cons": [...] },
            "score": 0-100,
            "specs": {}
          }
          
          Kontext: ${data.description || data.summary || "N/A"}
          ${data.price ? `Preis: ${data.price}` : ""}
        `;
        result = await generateContent(prompt, data.name);
      } else {
        return NextResponse.json({ error: `Unbekannte Kategorie: ${category}` }, { status: 400 });
      }
    } catch (error: any) {
      console.error(`Error generating content for ${category}:`, error);
      return NextResponse.json({ 
        error: `Fehler bei der Content-Generierung: ${error.message || "Unbekannter Fehler"}` 
      }, { status: 500 });
    }

    const pubDate = calculatePublicationDate(data.first_release_date);

    // Process metadata for games
    const gameMetadata = category === "game" ? {
        developers: data.involved_companies?.filter((c: any) => c.developer).map((c: any) => c.company.name) || [],
        publishers: data.involved_companies?.filter((c: any) => c.publisher).map((c: any) => c.company.name) || [],
        platforms: data.platforms?.map((p: any) => p.name) || [],
        genres: data.genres?.map((g: any) => g.name) || [],
        gameModes: data.game_modes?.map((m: any) => m.name) || [],
        perspectives: data.player_perspectives?.map((p: any) => p.name) || [],
        engines: data.engines?.map((e: any) => e.name) || [],
        releaseDate: data.first_release_date,
        igdbScore: data.rating,
        criticScore: data.aggregated_rating,
    } : null;

    // Sync image to Vercel Blob
    let imageUrls = [];
    
    if (category === "game") {
      if (data.cover?.url) {
          const url = data.cover.url.startsWith("//") ? "https:" + data.cover.url : data.cover.url;
          const highResCoverUrl = url.replace("t_thumb", "t_720p");
          const syncedUrl = await uploadImage(highResCoverUrl, `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-cover.jpg`);
          imageUrls.push(syncedUrl);
      }
      if (data.screenshots && data.screenshots.length > 0) {
          const screenshotsToSync = data.screenshots.slice(0, 5);
          for (let i = 0; i < screenshotsToSync.length; i++) {
              const s = screenshotsToSync[i];
              const url = s.url.startsWith("//") ? "https:" + s.url : s.url;
              const highResUrl = url.replace("t_thumb", "t_1080p");
              try {
                  const syncedUrl = await uploadImage(highResUrl, `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-screen-${i+1}.jpg`);
                  imageUrls.push(syncedUrl);
              } catch (err) {}
          }
      }
    } else if (category === "hardware" && data.images && Array.isArray(data.images) && data.images.length > 0) {
      for (let i = 0; i < Math.min(data.images.length, 5); i++) {
        try {
          const imageUrl = data.images[i];
          if (imageUrl && typeof imageUrl === "string") {
            const syncedUrl = await uploadImage(imageUrl, `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-hardware-${i+1}.jpg`);
            imageUrls.push(syncedUrl);
          }
        } catch (err) {
          console.error(`Error uploading hardware image ${i + 1}:`, err);
        }
      }
    } else if (category === "amazon" && data.cover && data.cover.url) {
      try {
        const syncedUrl = await uploadImage(data.cover.url, `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-amazon.jpg`);
        imageUrls.push(syncedUrl);
      } catch (err) {
        console.error("Error uploading Amazon image:", err);
      }
    }

    // Create hardware entry if needed
    let hardwareId = null;
    if (category === "hardware") {
      if (data.id) {
        // Hardware already exists in database, use its ID
        hardwareId = data.id;
      } else {
        // Create new hardware entry
        try {
          const newHardware = await createHardware({
            name: data.name,
            type: data.type,
            manufacturer: data.manufacturer,
            model: data.model,
            description: data.description,
            specs: data.specs,
            images: imageUrls.length > 0 ? imageUrls : (Array.isArray(data.images) ? data.images : []),
            releaseDate: data.releaseDate,
            msrp: data.msrp,
          });
          hardwareId = newHardware.id;
        } catch (error) {
          console.error("Error creating hardware entry:", error);
          // Continue without hardware ID - review can still be created
        }
      }
    }

    return NextResponse.json({
      title: result.de.title || data.name,
      title_en: result.en.title || data.name,
      content: result.de.content || "",
      content_en: result.en.content || "",
      pros: result.de.pros || [],
      pros_en: result.en.pros || [],
      cons: result.de.cons || [],
      cons_en: result.en.cons || [],
      score: result.score || 0,
      specs: result.specs || data.specs || null,
      metadata: gameMetadata,
      category,
      igdbId: category === "game" ? data.id : null,
      amazonAsin: category === "amazon" ? data.asin : null,
      hardwareId: category === "hardware" ? hardwareId : null,
      images: imageUrls,
      createdAt: pubDate,
    });
  } catch (error: any) {
    console.error("Auto-generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
