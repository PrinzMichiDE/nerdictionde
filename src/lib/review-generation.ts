import prisma from "@/lib/prisma";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { uploadImage } from "@/lib/blob";
import { calculatePublicationDate } from "@/lib/date-utils";

// Helper function to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Helper function to repair common JSON issues from AI responses
export function repairJson(contentRaw: string, parseError: any, gameName: string): any {
  console.error(`JSON parsing error for ${gameName}:`, parseError.message);
  console.error(`Raw content length: ${contentRaw.length}`);
  
  // Try to repair common JSON issues
  let repaired = contentRaw.trim();
  
  // Try -1: Fix literal newlines in strings
  repaired = repaired.replace(/"([^"]*)"/g, (match) => {
    return match.replace(/\n/g, "\\n");
  });

  const closeStructures = (str: string) => {
    let work = str.trim();
    
    // Count unescaped quotes
    let quoteCount = 0;
    for (let i = 0; i < work.length; i++) {
      if (work[i] === '"' && (i === 0 || work[i-1] !== '\\')) {
        quoteCount++;
      }
    }
    if (quoteCount % 2 !== 0) {
      work += '"';
    }

    // Close brackets and braces in correct order
    let stack: string[] = [];
    let inString = false;
    let escaped = false;
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
      console.log(`Successfully repaired JSON for ${gameName}`);
      return parsed;
    } else {
      throw new Error("Missing required fields after repair");
    }
  } catch (repairError: any) {
    // Repair failed, try one more aggressive repair attempt
    console.error(`JSON repair failed for ${gameName}, attempting aggressive repair`);
    
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
          console.log(`Successfully repaired JSON for ${gameName} using aggressive repair`);
          return parsed;
        }
      } catch (e) {}
    }

    // Final fallback: just close everything from where it broke
    try {
      const finalTry = closeStructures(repaired.substring(0, errorPos));
      const parsed = JSON.parse(finalTry);
      if (parsed.de && parsed.en) {
        console.log(`Successfully repaired JSON for ${gameName} using final fallback`);
        return parsed;
      }
    } catch (e) {}

    throw parseError;
  }
}

// Helper function to generate review content using OpenAI
export async function generateReviewContent(gameData: any): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
  specs?: any;
}> {
  const prompt = `
    Schreibe eine professionelle Game-Review für "${gameData.name}" in Deutsch UND Englisch.
    
    WICHTIG: Erwähne NIEMALS, dass dieser Text von einer KI, AI oder einem Sprachmodell generiert wurde. Der Text muss so klingen, als wäre er von einem passionierten Experten von Nerdiction geschrieben worden. Nutze einen professionellen, enthusiastischen, aber objektiven Tonfall.
    
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
    const aiResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4000, // Increase max tokens to avoid truncation
    });

    let contentRaw = aiResponse.choices[0].message.content || "{}";
    
    // Fallback: Strip markdown code blocks if the AI included them
    if (contentRaw.startsWith("```json")) {
      contentRaw = contentRaw.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (contentRaw.startsWith("```")) {
      contentRaw = contentRaw.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    // Try to parse JSON, with better error handling and repair attempts
    try {
      const parsed = JSON.parse(contentRaw);
      // Ensure all required fields exist
      if (!parsed.de || !parsed.en || !parsed.score) {
        throw new Error("Missing required fields in AI response");
      }
      return parsed;
    } catch (parseError: any) {
      return repairJson(contentRaw, parseError, gameData.name);
    }
  } catch (error) {
    console.error(`Error generating content for ${gameData.name}:`, error);
    // Return fallback content
    return {
        de: {
        title: gameData.name,
        content: `## Einleitung\n\n${gameData.summary || "Keine Beschreibung verfügbar."}\n\n## Fazit\n\nEin interessantes Spiel, das es wert ist, genauer betrachtet zu werden.`,
        pros: ["Gute Grafik", "Interessante Mechaniken", "Gutes Sounddesign", "Stimmige Atmosphäre", "Hoher Wiederspielwert"],
        cons: ["Könnte mehr Inhalt haben", "Kleinere technische Fehler", "Gelegentliche Framerate-Einbrüche", "Hoher Schwierigkeitsgrad", "Lange Ladezeiten"],
      },
      en: {
        title: gameData.name,
        content: `## Introduction\n\n${gameData.summary || "No description available."}\n\n## Conclusion\n\nAn interesting game worth taking a closer look at.`,
        pros: ["Good graphics", "Interesting mechanics", "Great sound design", "Atmospheric world", "High replay value"],
        cons: ["Could have more content", "Minor technical glitches", "Occasional frame drops", "Steep learning curve", "Long loading times"],
      },
      score: 70,
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

