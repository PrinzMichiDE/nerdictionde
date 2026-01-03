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
      console.error(`JSON parsing error for ${gameData.name}:`, parseError.message);
      console.error(`Raw content length: ${contentRaw.length}`);
      
      // Try to repair common JSON issues
      let repaired = contentRaw.trim();
      
      // Try 0: If it's heavily truncated, try to close open quotes and objects
      if (repaired.length > 500 && !repaired.endsWith('}')) {
        // Find last valid key/value structure or just brute force close
        // First, close an open string if necessary
        const lastQuote = repaired.lastIndexOf('"');
        const secondToLastQuote = repaired.lastIndexOf('"', lastQuote - 1);
        const openQuotes = (repaired.match(/"/g) || []).length;
        if (openQuotes % 2 !== 0) {
          repaired += '"';
        }
        
        // Then close all open braces
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
          repaired += '}'.repeat(openBraces - closeBraces);
        }
      }

      // Try 1: Fix trailing commas before closing braces/brackets
      repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
      
      // Try 2: Ensure the JSON is properly closed (again, specifically for standard cases)
      const openBracesCount = (repaired.match(/\{/g) || []).length;
      const closeBracesCount = (repaired.match(/\}/g) || []).length;
      if (openBracesCount > closeBracesCount) {
        repaired += '}'.repeat(openBracesCount - closeBracesCount);
      }
      
      // Try 3: Fix unterminated strings using error position
      if (parseError.message.includes("Unterminated string") || parseError.message.includes("Unexpected end of JSON input")) {
        const errorPosMatch = parseError.message.match(/position (\d+)/);
        const errorPos = errorPosMatch ? parseInt(errorPosMatch[1]) : repaired.length;
        
        // Check if we're inside a string at the error position
        let quoteCount = 0;
        
        // Count quotes before error position to determine if we're inside a string
        for (let i = 0; i < Math.min(errorPos, repaired.length); i++) {
          if (repaired[i] === '"' && (i === 0 || repaired[i - 1] !== '\\')) {
            quoteCount++;
          }
        }
        
        // If odd number of quotes, we're inside a string
        if (quoteCount % 2 !== 0) {
          // Find the opening quote by going backwards from error position
          let openingQuotePos = -1;
          for (let i = Math.min(errorPos - 1, repaired.length - 1); i >= 0 && i > errorPos - 10000; i--) {
            if (repaired[i] === '"' && (i === 0 || repaired[i - 1] !== '\\')) {
              // Check if this is likely an opening quote (after colon, comma, or at start of array element)
              const before = repaired.substring(Math.max(0, i - 20), i);
              if (before.match(/[:]\s*$/) || before.match(/,\s*$/) || before.match(/\[\s*$/)) {
                openingQuotePos = i;
                break;
              }
            }
          }
          
          // If we found an opening quote or we're at/near the end, close the string
          if (openingQuotePos >= 0 || errorPos >= repaired.length - 10) {
            // Close the string at error position
            repaired = repaired.substring(0, errorPos) + '"' + repaired.substring(errorPos);
            
            // Now close any open arrays/brackets
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;
            if (openBrackets > closeBrackets) {
              repaired += ']'.repeat(openBrackets - closeBrackets);
            }
            
            // Close any open braces
            const currentOpenBraces = (repaired.match(/\{/g) || []).length;
            const currentCloseBraces = (repaired.match(/\}/g) || []).length;
            if (currentOpenBraces > currentCloseBraces) {
              repaired += '}'.repeat(currentOpenBraces - currentCloseBraces);
            }
          }
        } else {
          // Not inside a string, but might be missing closing braces/brackets
          const openBraces = (repaired.match(/\{/g) || []).length;
          const closeBraces = (repaired.match(/\}/g) || []).length;
          const openBrackets = (repaired.match(/\[/g) || []).length;
          const closeBrackets = (repaired.match(/\]/g) || []).length;
          
          if (openBrackets > closeBrackets) {
            repaired += ']'.repeat(openBrackets - closeBrackets);
          }
          if (openBraces > closeBraces) {
            repaired += '}'.repeat(openBraces - closeBraces);
          }
        }
      }
      
      // Try 4: Fix "Expected ',' or '}'" errors
      if (parseError.message.includes("Expected ','")) {
        const errorPosMatch = parseError.message.match(/position (\d+)/);
        if (errorPosMatch) {
          const errorPos = parseInt(errorPosMatch[1]);
          const beforeError = repaired.substring(Math.max(0, errorPos - 100), errorPos);
          const afterError = repaired.substring(errorPos, Math.min(repaired.length, errorPos + 100));
          
          // If we see a closing brace/bracket after, might need comma before
          if (afterError.match(/^\s*[}\]]/)) {
            const lastChar = beforeError.trim().slice(-1);
            if (lastChar && !lastChar.match(/[,{\[\s"']/)) {
              repaired = repaired.substring(0, errorPos) + ',' + repaired.substring(errorPos);
            }
          }
        }
      }
      
      // Try 5: Fix "Expected double-quoted property name" - usually means unescaped quote in property name
      if (parseError.message.includes("double-quoted property name")) {
        const errorPosMatch = parseError.message.match(/position (\d+)/);
        if (errorPosMatch) {
          const errorPos = parseInt(errorPosMatch[1]);
          // Look for unescaped quotes in what should be property names
          const beforeError = repaired.substring(Math.max(0, errorPos - 200), errorPos);
          // Try to escape any unescaped quotes in property names
          repaired = repaired.replace(/([{,]\s*)"([^"]*)"([^"]*)"\s*:/g, '$1"$2\\"$3":');
        }
      }
      
      // Try 6: Remove control characters that might break JSON (but preserve \n, \t, etc. in strings)
      // Only remove truly problematic control chars outside of strings
      repaired = repaired.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
      
      // Try parsing the repaired JSON
      try {
        const parsed = JSON.parse(repaired);
        if (parsed.de && parsed.en && parsed.score) {
          console.log(`Successfully repaired JSON for ${gameData.name}`);
          return parsed;
        } else {
          throw new Error("Missing required fields after repair");
        }
      } catch (repairError: any) {
        // Repair failed, try one more aggressive repair attempt
        console.error(`JSON repair failed for ${gameData.name}, attempting aggressive repair`);
        const errorPosMatch = parseError.message.match(/position (\d+)/);
        const errorPos = errorPosMatch ? parseInt(errorPosMatch[1]) : repaired.length;
        
        // Try aggressive repair: find last complete key-value pair and truncate there
        let aggressiveRepair = repaired;
        
        // Find the last complete closing brace/bracket before error
        let lastCompletePos = errorPos;
        let braceDepth = 0;
        let bracketDepth = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < Math.min(errorPos, aggressiveRepair.length); i++) {
          const char = aggressiveRepair[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (inString) continue;
          
          if (char === '{') braceDepth++;
          if (char === '}') {
            braceDepth--;
            if (braceDepth === 0 && bracketDepth === 0) {
              lastCompletePos = i + 1;
            }
          }
          if (char === '[') bracketDepth++;
          if (char === ']') {
            bracketDepth--;
            if (braceDepth === 0 && bracketDepth === 0) {
              lastCompletePos = i + 1;
            }
          }
        }
        
        // If we found a complete structure, truncate and close properly
        if (lastCompletePos < errorPos && lastCompletePos > repaired.length * 0.5) {
          aggressiveRepair = repaired.substring(0, lastCompletePos);
          
          // Ensure it ends properly
          if (!aggressiveRepair.trim().endsWith('}')) {
            // Count remaining open structures
            const remainingOpenBraces = (aggressiveRepair.match(/\{/g) || []).length - (aggressiveRepair.match(/\}/g) || []).length;
            const remainingOpenBrackets = (aggressiveRepair.match(/\[/g) || []).length - (aggressiveRepair.match(/\]/g) || []).length;
            
            // Close arrays first, then objects
            if (remainingOpenBrackets > 0) {
              aggressiveRepair += ']'.repeat(remainingOpenBrackets);
            }
            if (remainingOpenBraces > 0) {
              aggressiveRepair += '}'.repeat(remainingOpenBraces);
            }
          }
          
          // Try parsing the aggressively repaired JSON
          try {
            const parsed = JSON.parse(aggressiveRepair);
            if (parsed.de && parsed.en && parsed.score) {
              console.log(`Successfully repaired JSON for ${gameData.name} using aggressive repair`);
              return parsed;
            }
          } catch (aggressiveError) {
            // Aggressive repair also failed
          }
        }
        
        // Log error details
        if (errorPosMatch) {
          const start = Math.max(0, errorPos - 300);
          const end = Math.min(repaired.length, errorPos + 300);
          console.error(`Original error at position ${errorPos}:`);
          console.error(`Context: ...${repaired.substring(start, end)}...`);
        }
      }
      
      // If all repair attempts fail, throw to trigger fallback
      throw parseError;
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

