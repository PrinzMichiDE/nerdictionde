import prisma from "@/lib/prisma";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { uploadImage } from "@/lib/blob";
import { calculatePublicationDate } from "@/lib/date-utils";
import { HardwareType } from "@/lib/hardware";
import { TMDBMovie, TMDBSeries, getTMDBImageUrl } from "@/lib/tmdb";

// Helper function to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Helper function to repair common JSON issues from AI responses
export function repairJson(contentRaw: string, parseError: any, itemName: string): any {
  console.error(`JSON parsing error for ${itemName}:`, parseError.message);
  console.error(`Raw content length: ${contentRaw.length}`);
  
  // Try to repair common JSON issues
  let repaired = contentRaw.trim();
  
  // Try -1: Fix literal newlines in strings
  repaired = repaired.replace(/"([^"]*)"/g, (match) => {
    return match.replace(/\n/g, "\\n");
  });

  const closeStructures = (str: string) => {
    let work = str.trim();
    
    // 1. Handle unterminated string first
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < work.length; i++) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (work[i] === '\\') {
        escaped = true;
        continue;
      }
      if (work[i] === '"') {
        inString = !inString;
      }
    }
    
    if (inString) {
      // If we are mid-string, just close it
      work += '"';
    }

    // 2. Close brackets and braces in correct order
    let stack: string[] = [];
    inString = false;
    escaped = false;
    
    for (let i = 0; i < work.length; i++) {
      const char = work[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (!inString) {
        if (char === '{' || char === '[') {
          stack.push(char);
        } else if (char === '}') {
          if (stack.length > 0 && stack[stack.length - 1] === '{') {
            stack.pop();
          }
        } else if (char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === '[') {
            stack.pop();
          }
        }
      }
    }

    while (stack.length > 0) {
      const last = stack.pop();
      if (last === '{') work += '}';
      if (last === '[') work += ']';
    }
    
    return work;
  };

  // Try 1: Fix trailing commas
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Try 2: Fix unterminated strings and missing closers
  if (parseError.message.includes("Unterminated string") || parseError.message.includes("Unexpected end") || !repaired.endsWith('}')) {
    const errorPosMatch = parseError.message.match(/position (\d+)/);
    const errorPos = errorPosMatch ? parseInt(errorPosMatch[1]) : repaired.length;
    
    // If we have an error position, we can try to truncate and close there
    if (errorPos < repaired.length) {
      repaired = closeStructures(repaired.substring(0, errorPos));
    } else {
      repaired = closeStructures(repaired);
    }
  }
  
  // Try 3: Fix "Expected ',' or '}'" errors
  if (parseError.message.includes("Expected ','")) {
    const errorPosMatch = parseError.message.match(/position (\d+)/);
    if (errorPosMatch) {
      const errorPos = parseInt(errorPosMatch[1]);
      const beforeError = repaired.substring(Math.max(0, errorPos - 100), errorPos);
      const afterError = repaired.substring(errorPos, Math.min(repaired.length, errorPos + 100));
      
      if (afterError.match(/^\s*[}\]]/)) {
        const lastChar = beforeError.trim().slice(-1);
        if (lastChar && !lastChar.match(/[,{\[\s"']/)) {
          repaired = repaired.substring(0, errorPos) + ',' + repaired.substring(errorPos);
        }
      }
    }
  }
  
  // Try 4: Fix "Expected double-quoted property name"
  if (parseError.message.includes("double-quoted property name")) {
    repaired = repaired.replace(/([{,]\s*)"([^"]*)"([^"]*)"\s*:/g, '$1"$2\\"$3":');
  }
  
  // Try 5: Remove control characters
  repaired = repaired.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Try parsing the repaired JSON
  try {
    const parsed = JSON.parse(repaired);
    if (parsed.de && parsed.en && (parsed.score || parsed.de.content)) {
      console.log(`Successfully repaired JSON for ${itemName}`);
      return parsed;
    } else {
      throw new Error("Missing required fields after repair");
    }
  } catch (repairError: any) {
    // Repair failed, try one more aggressive repair attempt
    console.error(`JSON repair failed for ${itemName}, attempting aggressive repair`);
    
    // Try aggressive repair: truncate at the last known good position
    const errorPosMatch = (repairError.message || parseError.message).match(/position (\d+)/);
    const errorPos = errorPosMatch ? parseInt(errorPosMatch[1]) : repaired.length;
    
    let lastGoodPos = 0;
    let stack: string[] = [];
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < Math.min(errorPos, repaired.length); i++) {
      const char = repaired[i];
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '"') { inString = !inString; continue; }
      if (!inString) {
        if (char === '{' || char === '[') {
          stack.push(char);
        } else if (char === '}') {
          if (stack.length > 0 && stack[stack.length - 1] === '{') {
            stack.pop();
            if (stack.length === 1 && stack[0] === '{') lastGoodPos = i + 1; // After a top-level property
          }
        } else if (char === ']') {
          if (stack.length > 0 && stack[stack.length - 1] === '[') {
            stack.pop();
          }
        }
      }
    }

    if (lastGoodPos > 0) {
      let aggressive = repaired.substring(0, lastGoodPos);
      if (!aggressive.trim().endsWith('}')) aggressive += '}';
      
      try {
        const parsed = JSON.parse(aggressive);
        if (parsed.de && parsed.en && (parsed.score || parsed.de.content)) {
          console.log(`Successfully repaired JSON for ${itemName} using aggressive repair`);
          return parsed;
        }
      } catch (e) {}
    }

    // Final fallback: just close everything from where it broke
    try {
      const finalTry = closeStructures(repaired.substring(0, errorPos));
      const parsed = JSON.parse(finalTry);
      if (parsed.de && parsed.en) {
        console.log(`Successfully repaired JSON for ${itemName} using final fallback`);
        return parsed;
      }
    } catch (e) {
      console.error(`Final fallback failed for ${itemName}:`, (e as Error).message);
      // Log first and last 100 chars of attempted JSON for debugging
      console.error(`Repair attempt start: ${repaired.substring(0, 100)}...`);
      console.error(`Repair attempt end: ...${repaired.substring(repaired.length - 100)}`);
    }

    throw parseError;
  }
}

// Helper function to generate any content using OpenAI with built-in auto-repair
export async function generateContent(
  prompt: string, 
  itemName: string,
  retryCount = 0
): Promise<any> {
  try {
    const aiResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    let contentRaw = aiResponse.choices[0].message.content || "{}";
    
    // Extract JSON block
    const jsonMatch = contentRaw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      contentRaw = jsonMatch[0];
    }
    
    if (contentRaw.startsWith("```json")) {
      contentRaw = contentRaw.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (contentRaw.startsWith("```")) {
      contentRaw = contentRaw.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const parsed = JSON.parse(contentRaw);
      if (!parsed.de || !parsed.de.content || !parsed.en || !parsed.en.content) {
        throw new Error("Missing essential content fields");
      }
      return parsed;
    } catch (parseError: any) {
      const repaired = repairJson(contentRaw, parseError, itemName);
      
      if ((!repaired.en || !repaired.en.content) && retryCount < 1) {
        console.log(`Repaired JSON for ${itemName} is still missing content. Retrying...`);
        return generateContent(prompt + "\n\nHINWEIS: Dein letzter Versuch wurde abgeschnitten. Bitte fass dich etwas kürzer, damit das JSON vollständig ist.", itemName, retryCount + 1);
      }
      
      return repaired;
    }
  } catch (error) {
    if (retryCount < 1) {
      console.error(`Error in generation for ${itemName}, retrying...`, error);
      return generateContent(prompt, itemName, retryCount + 1);
    }
    throw error;
  }
}

// Helper function to generate review content using OpenAI with built-in auto-repair
export async function generateReviewContent(gameData: any, retryCount = 0): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
  specs?: any;
}> {
  const isRetry = retryCount > 0;
  
  const prompt = `
    Schreibe eine professionelle Game-Review für "${gameData.name}" in Deutsch UND Englisch.
    
    ${isRetry ? "HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Bitte fass dich etwas kürzer (ca. 800-1000 Wörter pro Sprache), damit das JSON vollständig ist." : "WICHTIG: Erwähne NIEMALS, dass dieser Text von einer KI, AI oder einem Sprachmodell generiert wurde. Der Text muss so klingen, als wäre er von einem passionierten Experten von Nerdiction geschrieben worden. Nutze einen professionellen, enthusiastischen, aber objektiven Tonfall."}
    
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
    
    Kontext: ${gameData.summary || "N/A"}
    Genres: ${gameData.genres?.map((g: any) => g.name).join(", ") || "N/A"}
    Release Date: ${gameData.first_release_date ? new Date(gameData.first_release_date * 1000).toLocaleDateString("de-DE") : "N/A"}
  `;

  try {
    return await generateContent(prompt, gameData.name, retryCount);
  } catch (error) {
    console.error(`Final error generating content for ${gameData.name}:`, error);
    return {
      de: {
        title: gameData.name,
        content: `## Einleitung\n\n${gameData.summary || "Keine Beschreibung verfügbar."}\n\n## Fazit\n\nEin interessantes Spiel, das es wert ist, genauer betrachtet zu werden.`,
        pros: ["Gute Grafik", "Interessante Mechaniken"],
        cons: ["Könnte mehr Inhalt haben"],
      },
      en: {
        title: gameData.name,
        content: `## Introduction\n\n${gameData.summary || "No description available."}\n\n## Conclusion\n\nAn interesting game worth taking a closer look at.`,
        pros: ["Good graphics", "Interesting mechanics"],
        cons: ["Could have more content"],
      },
      score: 70,
    };
  }
}

// Helper function to generate hardware review content using OpenAI with built-in auto-repair
export async function generateHardwareReviewContent(
  hardwareData: { name: string; type: HardwareType; manufacturer?: string; model?: string; description?: string; specs?: any },
  retryCount = 0
): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
  specs?: any;
}> {
  const isRetry = retryCount > 0;
  
  const prompt = `
    Schreibe eine EXTREM AUSFÜHRLICHE professionelle Hardware-Review für "${hardwareData.name}" in Deutsch UND Englisch.
    
    ${isRetry ? "HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Bitte fass dich etwas kürzer (ca. 800-1000 Wörter pro Sprache), damit das JSON vollständig ist." : "ANFORDERUNGEN AN DEN INHALT:\n1. Der Text muss MASSIV DETAILLIERT sein (Ziel: 1200-1500 Wörter pro Sprache).\n2. Nutze eine tiefgehende journalistische Struktur mit aussagekräftigen H2- und H3-Überschriften."}
    
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
        // Hardware-spezifische Spezifikationen
      }
    }
    
    Hardware-Typ: ${hardwareData.type}
    Hersteller: ${hardwareData.manufacturer || "Unbekannt"}
    Modell: ${hardwareData.model || hardwareData.name}
    Beschreibung: ${hardwareData.description || "Keine Beschreibung verfügbar"}
    ${hardwareData.specs ? `Bekannte Specs: ${JSON.stringify(hardwareData.specs)}` : ""}
  `;

  try {
    return await generateContent(prompt, hardwareData.name, retryCount);
  } catch (error) {
    console.error(`Final error generating hardware content for ${hardwareData.name}:`, error);
    return {
      de: {
        title: hardwareData.name,
        content: `## Einleitung\n\n${hardwareData.description || "Keine Beschreibung verfügbar."}\n\n## Fazit\n\nEin interessantes Hardware-Produkt.`,
        pros: ["Gute Leistung", "Solide Verarbeitung"],
        cons: ["Könnte mehr Features haben"],
      },
      en: {
        title: hardwareData.name,
        content: `## Introduction\n\n${hardwareData.description || "No description available."}\n\n## Conclusion\n\nAn interesting hardware product.`,
        pros: ["Good performance", "Solid build quality"],
        cons: ["Could have more features"],
      },
      score: 70,
      specs: hardwareData.specs || null,
    };
  }
}

// Helper function to process a single game
export async function processGame(
  gameData: any,
  options: { status: "draft" | "published"; skipExisting: boolean }
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    // Check if review already exists by IGDB ID
    if (options.skipExisting) {
      const existing = await prisma.review.findFirst({
        where: { igdbId: gameData.id },
      });
      if (existing) {
        return { success: false, error: "Already exists" };
      }
    }

    // Generate review content
    const reviewContent = await generateReviewContent(gameData);

    // Generate slug
    let slug = generateSlug(reviewContent.de.title || gameData.name);
    const existingSlug = await prisma.review.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Upload cover image if available
    let imageUrls: string[] = [];
    if (gameData.cover?.url) {
      try {
        const coverUrl = gameData.cover.url.startsWith("//")
          ? "https:" + gameData.cover.url
          : gameData.cover.url;
        const highResCoverUrl = coverUrl.replace("t_thumb", "t_720p");
        const syncedUrl = await uploadImage(
          highResCoverUrl,
          `${slug}-cover.jpg`
        );
        imageUrls.push(syncedUrl);
      } catch (error) {
        console.error(`Error uploading cover for ${gameData.name}:`, error);
        // Fallback to original URL (tried highres first)
        imageUrls.push(
          gameData.cover.url.startsWith("//")
            ? "https:" + gameData.cover.url.replace("t_thumb", "t_720p")
            : gameData.cover.url.replace("t_thumb", "t_720p")
        );
      }
    }

    // Add screenshots if available
    if (gameData.screenshots && gameData.screenshots.length > 0) {
      const screenshotUrls = gameData.screenshots
        .slice(0, 5)
        .map((s: any) =>
          s.url.startsWith("//")
            ? "https:" + s.url.replace("t_thumb", "t_1080p")
            : s.url.replace("t_thumb", "t_1080p")
        );
      
      // Upload screenshots too for better consistency
      for (let i = 0; i < screenshotUrls.length; i++) {
        try {
          const syncedUrl = await uploadImage(
            screenshotUrls[i],
            `${slug}-screen-${i+1}.jpg`
          );
          imageUrls.push(syncedUrl);
        } catch (err) {
          imageUrls.push(screenshotUrls[i]);
        }
      }
    }

    // Extract YouTube video IDs from IGDB videos
    // IGDB videos have a video_id field that contains YouTube video IDs
    // We prioritize trailers (usually named "Trailer" or contain "trailer" in name)
    const youtubeVideos: string[] = [];
    if (gameData.videos && Array.isArray(gameData.videos) && gameData.videos.length > 0) {
      // Sort videos: trailers first, then others
      const sortedVideos = [...gameData.videos].sort((a: any, b: any) => {
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        const aIsTrailer = aName.includes("trailer");
        const bIsTrailer = bName.includes("trailer");
        
        if (aIsTrailer && !bIsTrailer) return -1;
        if (!aIsTrailer && bIsTrailer) return 1;
        return 0;
      });

      // Extract video IDs (limit to 5 videos max)
      for (const video of sortedVideos.slice(0, 5)) {
        if (video.video_id && typeof video.video_id === "string" && video.video_id.trim()) {
          // IGDB video_id is already the YouTube video ID
          // Validate it looks like a YouTube video ID (11 characters, alphanumeric + dashes/underscores)
          const videoId = video.video_id.trim();
          if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            youtubeVideos.push(videoId);
          }
        }
      }
    }

    // Process metadata
    const developers = gameData.involved_companies?.filter((c: any) => c.developer).map((c: any) => c.company.name) || [];
    const publishers = gameData.involved_companies?.filter((c: any) => c.publisher).map((c: any) => c.company.name) || [];
    
    const gameMetadata = {
        developers,
        publishers,
        platforms: gameData.platforms?.map((p: any) => p.name) || [],
        genres: gameData.genres?.map((g: any) => g.name) || [],
        gameModes: gameData.game_modes?.map((m: any) => m.name) || [],
        perspectives: gameData.player_perspectives?.map((p: any) => p.name) || [],
        engines: gameData.engines?.map((e: any) => e.name) || [],
        releaseDate: gameData.first_release_date,
        igdbScore: gameData.rating,
        criticScore: gameData.aggregated_rating,
    };

    // Create review
    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "game",
        content: reviewContent.de.content,
        content_en: reviewContent.en.content,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        youtubeVideos: youtubeVideos,
        status: options.status,
        igdbId: gameData.id,
        specs: reviewContent.specs || null,
        metadata: gameMetadata,
        createdAt: calculatePublicationDate(gameData.first_release_date),
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`Error processing game ${gameData.name}:`, error);
    return { success: false, error: error.message };
  }
}

// Helper function to generate movie review content using OpenAI
export async function generateMovieReviewContent(
  movieData: TMDBMovie,
  retryCount = 0
): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
}> {
  const isRetry = retryCount > 0;
  
  const prompt = `
    Schreibe eine professionelle Film-Review für "${movieData.title}" (Originaltitel: "${movieData.original_title}") in Deutsch UND Englisch.
    
    ${isRetry ? "HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Bitte fass dich etwas kürzer (ca. 800-1000 Wörter pro Sprache), damit das JSON vollständig ist." : "WICHTIG: Erwähne NIEMALS, dass dieser Text von einer KI, AI oder einem Sprachmodell generiert wurde. Der Text muss so klingen, als wäre er von einem passionierten Filmexperten von Nerdiction geschrieben worden. Nutze einen professionellen, enthusiastischen, aber objektiven Tonfall."}
    
    Antworte EXKLUSIV im JSON-Format mit folgendem Schema:
    {
      "de": {
        "title": "...",
        "content": "Markdown mit Inhaltsverzeichnis, ausführlicher Einleitung, mehreren tiefgehenden Analyse-Abschnitten mit Überschriften (z.B. Handlung, Charaktere, Regie, Kamera, Musik, etc.), BILD-PLATZHALTERN (![[IMAGE_X]]) und Fazit...",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "en": {
        "title": "...",
        "content": "Markdown with Table of Contents, detailed intro, several deep-dive analysis sections with headings (e.g., Plot, Characters, Direction, Cinematography, Music, etc.), IMAGE PLACEHOLDERS (![[IMAGE_X]]) and conclusion...",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "score": 0-100
    }
    
    Handlung: ${movieData.overview || "N/A"}
    Genres: ${movieData.genres?.map((g) => g.name).join(", ") || movieData.genre_ids?.join(", ") || "N/A"}
    Release Date: ${movieData.release_date || "N/A"}
    Laufzeit: ${movieData.runtime ? `${movieData.runtime} Minuten` : "N/A"}
    Produktionsfirmen: ${movieData.production_companies?.map((c) => c.name).join(", ") || "N/A"}
    Bewertung: ${movieData.vote_average ? `${movieData.vote_average}/10` : "N/A"}
  `;

  try {
    return await generateContent(prompt, movieData.title, retryCount);
  } catch (error) {
    console.error(`Final error generating movie content for ${movieData.title}:`, error);
    return {
      de: {
        title: movieData.title,
        content: `## Einleitung\n\n${movieData.overview || "Keine Beschreibung verfügbar."}\n\n## Fazit\n\nEin interessanter Film, der es wert ist, genauer betrachtet zu werden.`,
        pros: ["Gute Handlung", "Starke Schauspieler"],
        cons: ["Könnte mehr Tiefe haben"],
      },
      en: {
        title: movieData.title,
        content: `## Introduction\n\n${movieData.overview || "No description available."}\n\n## Conclusion\n\nAn interesting movie worth taking a closer look at.`,
        pros: ["Good plot", "Strong acting"],
        cons: ["Could have more depth"],
      },
      score: Math.round((movieData.vote_average || 5) * 10),
    };
  }
}

// Helper function to generate series review content using OpenAI
export async function generateSeriesReviewContent(
  seriesData: TMDBSeries,
  retryCount = 0
): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
}> {
  const isRetry = retryCount > 0;
  
  const prompt = `
    Schreibe eine professionelle Serien-Review für "${seriesData.name}" (Originaltitel: "${seriesData.original_name}") in Deutsch UND Englisch.
    
    ${isRetry ? "HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Bitte fass dich etwas kürzer (ca. 800-1000 Wörter pro Sprache), damit das JSON vollständig ist." : "WICHTIG: Erwähne NIEMALS, dass dieser Text von einer KI, AI oder einem Sprachmodell generiert wurde. Der Text muss so klingen, als wäre er von einem passionierten Serienexperten von Nerdiction geschrieben worden. Nutze einen professionellen, enthusiastischen, aber objektiven Tonfall."}
    
    Antworte EXKLUSIV im JSON-Format mit folgendem Schema:
    {
      "de": {
        "title": "...",
        "content": "Markdown mit Inhaltsverzeichnis, ausführlicher Einleitung, mehreren tiefgehenden Analyse-Abschnitten mit Überschriften (z.B. Handlung, Charaktere, Regie, Kamera, Musik, Serienstruktur, etc.), BILD-PLATZHALTERN (![[IMAGE_X]]) und Fazit...",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "en": {
        "title": "...",
        "content": "Markdown with Table of Contents, detailed intro, several deep-dive analysis sections with headings (e.g., Plot, Characters, Direction, Cinematography, Music, Series Structure, etc.), IMAGE PLACEHOLDERS (![[IMAGE_X]]) and conclusion...",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "score": 0-100
    }
    
    Handlung: ${seriesData.overview || "N/A"}
    Genres: ${seriesData.genres?.map((g) => g.name).join(", ") || seriesData.genre_ids?.join(", ") || "N/A"}
    Erste Ausstrahlung: ${seriesData.first_air_date || "N/A"}
    Staffeln: ${seriesData.number_of_seasons || "N/A"}
    Episoden: ${seriesData.number_of_episodes || "N/A"}
    Produktionsfirmen: ${seriesData.production_companies?.map((c) => c.name).join(", ") || "N/A"}
    Bewertung: ${seriesData.vote_average ? `${seriesData.vote_average}/10` : "N/A"}
  `;

  try {
    return await generateContent(prompt, seriesData.name, retryCount);
  } catch (error) {
    console.error(`Final error generating series content for ${seriesData.name}:`, error);
    return {
      de: {
        title: seriesData.name,
        content: `## Einleitung\n\n${seriesData.overview || "Keine Beschreibung verfügbar."}\n\n## Fazit\n\nEine interessante Serie, die es wert ist, genauer betrachtet zu werden.`,
        pros: ["Gute Handlung", "Starke Charaktere"],
        cons: ["Könnte mehr Tiefe haben"],
      },
      en: {
        title: seriesData.name,
        content: `## Introduction\n\n${seriesData.overview || "No description available."}\n\n## Conclusion\n\nAn interesting series worth taking a closer look at.`,
        pros: ["Good plot", "Strong characters"],
        cons: ["Could have more depth"],
      },
      score: Math.round((seriesData.vote_average || 5) * 10),
    };
  }
}

// Helper function to process a single movie
export async function processMovie(
  movieData: TMDBMovie,
  options: { status: "draft" | "published"; skipExisting: boolean }
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    // Check if review already exists by TMDB ID
    if (options.skipExisting) {
      const existing = await prisma.review.findFirst({
        where: { tmdbId: movieData.id, category: "movie" },
      });
      if (existing) {
        return { success: false, error: "Already exists" };
      }
    }

    // Generate review content
    const reviewContent = await generateMovieReviewContent(movieData);

    // Generate slug
    let slug = generateSlug(reviewContent.de.title || movieData.title);
    const existingSlug = await prisma.review.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Upload poster image if available
    let imageUrls: string[] = [];
    if (movieData.poster_path) {
      try {
        const posterUrl = getTMDBImageUrl(movieData.poster_path, "w1280");
        if (posterUrl) {
          const syncedUrl = await uploadImage(posterUrl, `${slug}-poster.jpg`);
          imageUrls.push(syncedUrl);
        }
      } catch (error) {
        console.error(`Error uploading poster for ${movieData.title}:`, error);
        const posterUrl = getTMDBImageUrl(movieData.poster_path, "w1280");
        if (posterUrl) {
          imageUrls.push(posterUrl);
        }
      }
    }

    // Add backdrop images if available
    if (movieData.images?.backdrops && movieData.images.backdrops.length > 0) {
      const backdropUrls = movieData.images.backdrops
        .slice(0, 5)
        .map((img) => getTMDBImageUrl(img.file_path, "w1280"))
        .filter((url): url is string => url !== null);
      
      for (let i = 0; i < backdropUrls.length; i++) {
        try {
          const syncedUrl = await uploadImage(
            backdropUrls[i],
            `${slug}-backdrop-${i+1}.jpg`
          );
          imageUrls.push(syncedUrl);
        } catch (err) {
          imageUrls.push(backdropUrls[i]);
        }
      }
    }

    // Extract YouTube video IDs from TMDB videos
    const youtubeVideos: string[] = [];
    if (movieData.videos?.results && Array.isArray(movieData.videos.results)) {
      // Filter YouTube videos and prioritize trailers
      const youtubeVids = movieData.videos.results.filter(
        (v) => v.site === "YouTube" && v.key
      );
      
      // Sort: trailers first
      const sortedVideos = [...youtubeVids].sort((a, b) => {
        const aIsTrailer = a.type === "Trailer" || a.name.toLowerCase().includes("trailer");
        const bIsTrailer = b.type === "Trailer" || b.name.toLowerCase().includes("trailer");
        if (aIsTrailer && !bIsTrailer) return -1;
        if (!aIsTrailer && bIsTrailer) return 1;
        return 0;
      });

      // Extract video IDs (limit to 5 videos max)
      for (const video of sortedVideos.slice(0, 5)) {
        if (video.key && /^[a-zA-Z0-9_-]{11}$/.test(video.key)) {
          youtubeVideos.push(video.key);
        }
      }
    }

    // Process metadata
    const movieMetadata = {
      genres: movieData.genres?.map((g) => g.name) || [],
      production_companies: movieData.production_companies?.map((c) => c.name) || [],
      production_countries: movieData.production_countries?.map((c) => c.name) || [],
      spoken_languages: movieData.spoken_languages?.map((l) => l.name) || [],
      release_date: movieData.release_date,
      runtime: movieData.runtime,
      tmdb_score: movieData.vote_average,
      vote_count: movieData.vote_count,
      popularity: movieData.popularity,
    };

    // Calculate publication date from release date
    const releaseDate = movieData.release_date 
      ? new Date(movieData.release_date).getTime() / 1000 
      : null;

    // Create review
    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "movie",
        content: reviewContent.de.content,
        content_en: reviewContent.en.content,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        youtubeVideos: youtubeVideos,
        status: options.status,
        tmdbId: movieData.id,
        metadata: movieMetadata,
        createdAt: releaseDate ? calculatePublicationDate(releaseDate) : new Date(),
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`Error processing movie ${movieData.title}:`, error);
    return { success: false, error: error.message };
  }
}

// Helper function to process a single series
export async function processSeries(
  seriesData: TMDBSeries,
  options: { status: "draft" | "published"; skipExisting: boolean }
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    // Check if review already exists by TMDB ID
    if (options.skipExisting) {
      const existing = await prisma.review.findFirst({
        where: { tmdbId: seriesData.id, category: "series" },
      });
      if (existing) {
        return { success: false, error: "Already exists" };
      }
    }

    // Generate review content
    const reviewContent = await generateSeriesReviewContent(seriesData);

    // Generate slug
    let slug = generateSlug(reviewContent.de.title || seriesData.name);
    const existingSlug = await prisma.review.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Upload poster image if available
    let imageUrls: string[] = [];
    if (seriesData.poster_path) {
      try {
        const posterUrl = getTMDBImageUrl(seriesData.poster_path, "w1280");
        if (posterUrl) {
          const syncedUrl = await uploadImage(posterUrl, `${slug}-poster.jpg`);
          imageUrls.push(syncedUrl);
        }
      } catch (error) {
        console.error(`Error uploading poster for ${seriesData.name}:`, error);
        const posterUrl = getTMDBImageUrl(seriesData.poster_path, "w1280");
        if (posterUrl) {
          imageUrls.push(posterUrl);
        }
      }
    }

    // Add backdrop images if available
    if (seriesData.images?.backdrops && seriesData.images.backdrops.length > 0) {
      const backdropUrls = seriesData.images.backdrops
        .slice(0, 5)
        .map((img) => getTMDBImageUrl(img.file_path, "w1280"))
        .filter((url): url is string => url !== null);
      
      for (let i = 0; i < backdropUrls.length; i++) {
        try {
          const syncedUrl = await uploadImage(
            backdropUrls[i],
            `${slug}-backdrop-${i+1}.jpg`
          );
          imageUrls.push(syncedUrl);
        } catch (err) {
          imageUrls.push(backdropUrls[i]);
        }
      }
    }

    // Extract YouTube video IDs from TMDB videos
    const youtubeVideos: string[] = [];
    if (seriesData.videos?.results && Array.isArray(seriesData.videos.results)) {
      // Filter YouTube videos and prioritize trailers
      const youtubeVids = seriesData.videos.results.filter(
        (v) => v.site === "YouTube" && v.key
      );
      
      // Sort: trailers first
      const sortedVideos = [...youtubeVids].sort((a, b) => {
        const aIsTrailer = a.type === "Trailer" || a.name.toLowerCase().includes("trailer");
        const bIsTrailer = b.type === "Trailer" || b.name.toLowerCase().includes("trailer");
        if (aIsTrailer && !bIsTrailer) return -1;
        if (!aIsTrailer && bIsTrailer) return 1;
        return 0;
      });

      // Extract video IDs (limit to 5 videos max)
      for (const video of sortedVideos.slice(0, 5)) {
        if (video.key && /^[a-zA-Z0-9_-]{11}$/.test(video.key)) {
          youtubeVideos.push(video.key);
        }
      }
    }

    // Process metadata
    const seriesMetadata = {
      genres: seriesData.genres?.map((g) => g.name) || [],
      production_companies: seriesData.production_companies?.map((c) => c.name) || [],
      production_countries: seriesData.production_countries?.map((c) => c.name) || [],
      spoken_languages: seriesData.spoken_languages?.map((l) => l.name) || [],
      first_air_date: seriesData.first_air_date,
      number_of_seasons: seriesData.number_of_seasons,
      number_of_episodes: seriesData.number_of_episodes,
      tmdb_score: seriesData.vote_average,
      vote_count: seriesData.vote_count,
      popularity: seriesData.popularity,
    };

    // Calculate publication date from first air date
    const releaseDate = seriesData.first_air_date 
      ? new Date(seriesData.first_air_date).getTime() / 1000 
      : null;

    // Create review
    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "series",
        content: reviewContent.de.content,
        content_en: reviewContent.en.content,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        youtubeVideos: youtubeVideos,
        status: options.status,
        tmdbId: seriesData.id,
        metadata: seriesMetadata,
        createdAt: releaseDate ? calculatePublicationDate(releaseDate) : new Date(),
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`Error processing series ${seriesData.name}:`, error);
    return { success: false, error: error.message };
  }
}
