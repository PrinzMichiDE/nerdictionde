import { NextRequest, NextResponse } from "next/server";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { searchIGDB, getIGDBGameBySteamId } from "@/lib/igdb";
import { parseSteamUrl } from "@/lib/steam";
import { parseAmazonUrl, scrapeAmazonProduct } from "@/lib/amazon";
import { searchHardware, detectHardwareType, createHardware } from "@/lib/hardware";
import { uploadImage } from "@/lib/blob";
import { calculatePublicationDate } from "@/lib/date-utils";
import { requireAdminAuth } from "@/lib/auth";
import { repairJson } from "@/lib/review-generation";

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

    // If category is explicitly set, prioritize that category's search methods
    if (requestedCategory === "amazon") {
      const amazonAsin = parseAmazonUrl(input);
      // Use the input as URL for scraping
      data = await scrapeAmazonProduct(input.startsWith("http") ? input : `https://www.amazon.de/dp/${amazonAsin || input}`);
      category = "amazon";
    } else if (requestedCategory === "hardware") {
      const hardwareType = detectHardwareType(input);
      const hardwareResults = await searchHardware(input);
      if (hardwareResults && hardwareResults.length > 0) {
        data = hardwareResults[0];
        category = "hardware";
      } else {
        // Hardware type detected but not found - create placeholder
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
      // Game category or auto-detect (default behavior)
      const steamId = parseSteamUrl(input);
      if (steamId) {
        data = await getIGDBGameBySteamId(steamId);
        category = "game";
      } else {
        // Try IGDB search for games
        const results = await searchIGDB(input);
        if (results && results.length > 0) {
          data = results[0];
          category = "game";
        }
      }
    }

    // Fallback: If no category was requested and no data found, try auto-detection
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
        // Try hardware detection
        const hardwareType = detectHardwareType(input);
        if (hardwareType) {
          const hardwareResults = await searchHardware(input);
          if (hardwareResults && hardwareResults.length > 0) {
            data = hardwareResults[0];
            category = "hardware";
          } else {
            data = {
              name: input,
              type: hardwareType,
              description: null,
              specs: null,
              images: [],
            };
            category = "hardware";
          }
        }
      }
    }

    if (!data) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const prompt = `
      Schreibe eine EXTREM AUSFÜHRLICHE professionelle ${category}-Review für "${data.name}" in Deutsch UND Englisch.
      
      ANFORDERUNGEN AN DEN INHALT:
      1. Der Text muss MASSIV DETAILLIERT sein (Ziel: 1200-1500 Wörter pro Sprache).
      2. Nutze eine tiefgehende journalistische Struktur mit aussagekräftigen H2- und H3-Überschriften.
      3. Füge am Anfang jedes Berichts ein "Inhaltsverzeichnis" (Table of Contents) in Markdown-Listenform ein, das auf die Überschriften verweist (nutze Anker-Links wie [Überschrift](#überschrift)).
      4. Gehe extrem tief ins Detail:
         ${category === "game" ? `
         - Gameplay & Mechaniken: Analysiere das Core-Loop, die Steuerung und die Lernkurve.
         - Grafik & Technik: Details zu Engine, Beleuchtung, Texturen und Performance auf verschiedenen Plattformen.
         - Story & Welt: Deep Dive in Lore, Charakterentwicklung und Atmosphäre.
         - Sound & Musik: Wirkung des Sounddesigns und der Kompositionen.
         - Fazit: Eine differenzierte Zusammenfassung mit Zielgruppenempfehlung.
         ` : `
         - Design & Ergonomie: Haptik, Materialien und tägliche Nutzung.
         - Technische Leistung: Benchmarks, Hitzeentwicklung, Lautstärke und Effizienz.
         - Features & Software: Integration, Treibersoftware und Zusatzfunktionen.
         - Preis-Leistung: Einordnung im aktuellen Marktvergleich.
         - Fazit: Für wen lohnt sich der Kauf?
         `}
      5. BILD-INTEGRATION:
         Integriere im Fließtext an passenden Stellen (ca. alle 3-4 Absätze) Bild-Platzhalter im Format:
         ![[IMAGE_1]]
         ![[IMAGE_2]]
         ![[IMAGE_3]]
         Nutze bis zu 5 verschiedene Platzhalter (IMAGE_1 bis IMAGE_5). Platziere sie dort, wo ein Screenshot oder Produktfoto den Text sinnvoll ergänzen würde.
      
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
          "minimum": { "os": "...", "cpu": "...", "ram": "...", "gpu": "...", "dx": "...", "storage": "..." },
          "recommended": { "os": "...", "cpu": "...", "ram": "...", "gpu": "...", "dx": "...", "storage": "..." }
        }
      }
      
      Kontext: ${data.summary || data.description || "N/A"}
      ${category === "game" ? `Genres: ${data.genres?.map((g: any) => g.name).join(", ") || "N/A"}` : ""}
      ${category === "amazon" ? `Preis: ${data.price || "N/A"}\nSpecs: ${JSON.stringify(data.specs || {})}` : ""}
      ${category === "hardware" ? `Typ: ${data.type || "N/A"}\nHersteller: ${data.manufacturer || "N/A"}\nModell: ${data.model || "N/A"}\nSpecs: ${JSON.stringify(data.specs || {})}` : ""}
    `;

    const aiResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    let contentRaw = aiResponse.choices[0].message.content || "{}";
    
    // Extract JSON block if it's surrounded by other text
    const jsonMatch = contentRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      contentRaw = jsonMatch[0];
    }
    
    // Fallback: Strip markdown code blocks if the AI included them
    if (contentRaw.startsWith("```json")) {
      contentRaw = contentRaw.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (contentRaw.startsWith("```")) {
      contentRaw = contentRaw.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    let result;
    try {
      result = JSON.parse(contentRaw);
    } catch (parseError: any) {
      result = repairJson(contentRaw, parseError, data.name);
    }
    const pubDate = calculatePublicationDate(data.first_release_date);

    // Process metadata
    const developers = data.involved_companies?.filter((c: any) => c.developer).map((c: any) => c.company.name) || [];
    const publishers = data.involved_companies?.filter((c: any) => c.publisher).map((c: any) => c.company.name) || [];
    
    const gameMetadata = category === "game" ? {
        developers,
        publishers,
        platforms: data.platforms?.map((p: any) => p.name) || [],
        genres: data.genres?.map((g: any) => g.name) || [],
        gameModes: data.game_modes?.map((m: any) => m.name) || [],
        perspectives: data.player_perspectives?.map((p: any) => p.name) || [],
        engines: data.engines?.map((e: any) => e.name) || [],
        releaseDate: data.first_release_date,
        igdbScore: data.rating,
        criticScore: data.aggregated_rating,
    } : null;

    // Sync image to Vercel Blob if available
    let imageUrls = [];
    
    if (category === "game") {
      // 1. Sync Cover
      if (data.cover?.url) {
          const url = data.cover.url.startsWith("//") ? "https:" + data.cover.url : data.cover.url;
          const highResCoverUrl = url.replace("t_thumb", "t_720p"); // Use 720p for cover instead of thumb
          const syncedUrl = await uploadImage(
              highResCoverUrl, 
              `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-cover.jpg`
          );
          imageUrls.push(syncedUrl);
      }

      // 2. Sync Screenshots (if available)
      if (data.screenshots && data.screenshots.length > 0) {
          const screenshotsToSync = data.screenshots.slice(0, 5); // Max 5 more images
          for (let i = 0; i < screenshotsToSync.length; i++) {
              const s = screenshotsToSync[i];
              const url = s.url.startsWith("//") ? "https:" + s.url : s.url;
              const highResUrl = url.replace("t_thumb", "t_1080p"); // Use 1080p for internal images
              try {
                  const syncedUrl = await uploadImage(
                      highResUrl,
                      `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-screen-${i+1}.jpg`
                  );
                  imageUrls.push(syncedUrl);
              } catch (err) {
                  console.error("Failed to sync screenshot:", err);
              }
          }
      }
    } else if (category === "hardware" && data.images && data.images.length > 0) {
      // Sync hardware images
      for (let i = 0; i < Math.min(data.images.length, 5); i++) {
        try {
          const imageUrl = data.images[i];
          const syncedUrl = await uploadImage(
            imageUrl,
            `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-hardware-${i+1}.jpg`
          );
          imageUrls.push(syncedUrl);
        } catch (err) {
          console.error("Failed to sync hardware image:", err);
        }
      }
    } else if (category === "amazon" && data.cover?.url) {
      // Sync Amazon product image
      try {
        const syncedUrl = await uploadImage(
          data.cover.url,
          `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-amazon.jpg`
        );
        imageUrls.push(syncedUrl);
      } catch (err) {
        console.error("Failed to sync Amazon image:", err);
      }
    }

    // Create hardware entry if it's hardware and doesn't exist yet
    let hardwareId = null;
    if (category === "hardware" && data.id) {
      hardwareId = data.id;
    } else if (category === "hardware" && !data.id) {
      // Create new hardware entry
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

