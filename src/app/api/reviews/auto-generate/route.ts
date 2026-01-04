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
  generateAmazonReviewContent,
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
    let category: "game" | "hardware" | "amazon" | "product" = requestedCategory || "game";

    // Search logic
    if (requestedCategory === "product" || requestedCategory === "amazon") {
      // For product category, treat input as product name directly
      if (requestedCategory === "product") {
        data = { name: input };
        category = "product";
      } else {
        // Legacy amazon support
        const amazonAsin = parseAmazonUrl(input);
        data = await scrapeAmazonProduct(input.startsWith("http") ? input : `https://www.amazon.de/dp/${amazonAsin || input}`);
        category = "amazon";
      }
    } else if (requestedCategory === "hardware") {
      const hardwareType = detectHardwareType(input);
      const hardwareResults = await searchHardware(input);
      if (hardwareResults && hardwareResults.length > 0) {
        data = hardwareResults[0];
        category = "hardware";
      } else {
        data = {
          name: input,
          type: hardwareType || "gpu",
          description: null,
          specs: null,
          images: [],
        };
        category = "hardware";
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
        category = "amazon";
        data = await scrapeAmazonProduct(input.startsWith("http") ? input : `https://www.amazon.de/dp/${amazonAsin}`);
      } else {
        const hardwareType = detectHardwareType(input);
        if (hardwareType) {
          const hardwareResults = await searchHardware(input);
          if (hardwareResults && hardwareResults.length > 0) {
            data = hardwareResults[0];
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
    if (category === "game") {
      result = await generateReviewContent(data);
    } else if (category === "hardware") {
      result = await generateHardwareReviewContent({
        name: data.name,
        type: data.type as HardwareType,
        manufacturer: data.manufacturer || undefined,
        model: data.model || undefined,
        description: data.description || undefined,
        specs: data.specs || undefined,
      });
    } else if (category === "product") {
      // Use generateAmazonReviewContent for product reviews
      result = await generateAmazonReviewContent({
        name: data.name,
        asin: data.asin,
        description: data.description,
        affiliateLink: data.affiliateLink,
      });
    } else {
      // Amazon (legacy) or other - use generateContent directly
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
      `;
      result = await generateContent(prompt, data.name);
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
    } else if (category === "hardware" && data.images && data.images.length > 0) {
      for (let i = 0; i < Math.min(data.images.length, 5); i++) {
        try {
          const syncedUrl = await uploadImage(data.images[i], `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-hardware-${i+1}.jpg`);
          imageUrls.push(syncedUrl);
        } catch (err) {}
      }
    } else if ((category === "amazon" || category === "product") && data.cover?.url) {
      try {
        const syncedUrl = await uploadImage(data.cover.url, `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-product.jpg`);
        imageUrls.push(syncedUrl);
      } catch (err) {}
    }

    // Create hardware entry if needed
    let hardwareId = null;
    if (category === "hardware") {
      if (data.id) {
        hardwareId = data.id;
      } else {
        const newHardware = await createHardware({
          name: data.name,
          type: data.type,
          manufacturer: data.manufacturer,
          model: data.model,
          description: data.description,
          specs: data.specs,
          images: imageUrls,
          releaseDate: data.releaseDate,
          msrp: data.msrp,
        });
        hardwareId = newHardware.id;
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
      amazonAsin: (category === "amazon" || category === "product") ? data.asin : null,
      hardwareId: category === "hardware" ? hardwareId : null,
      images: imageUrls,
      createdAt: pubDate,
    });
  } catch (error: any) {
    console.error("Auto-generate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
