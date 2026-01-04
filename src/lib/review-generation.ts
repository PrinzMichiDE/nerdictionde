import prisma from "@/lib/prisma";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { uploadImage } from "@/lib/blob";
import { calculatePublicationDate } from "@/lib/date-utils";
import { HardwareType } from "@/lib/hardware";
import { TMDBMovie, TMDBSeries, getTMDBImageUrl } from "@/lib/tmdb";
import { searchHardwareProduct, searchAmazonProduct, extractProductSpecs } from "@/lib/tavily";
import { generateReviewImages } from "@/lib/image-generation";

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
  tavilySearchResults?: any; // Include Tavily search results for image extraction
}> {
  const isRetry = retryCount > 0;
  
  // Use Tavily Search to gather product information
  let tavilyData: {
    specs: Record<string, any>;
    description: string;
    pros: string[];
    cons: string[];
    price?: string;
    rating?: number;
  } | null = null;
  
  let tavilySearchResults: any = null;
  
  try {
    console.log(`🔍 Searching Tavily for ${hardwareData.name}...`);
    const searchResults = await searchHardwareProduct(
      hardwareData.name,
      hardwareData.manufacturer
    );
    tavilySearchResults = searchResults;
    tavilyData = extractProductSpecs(searchResults);
    console.log(`✅ Found Tavily data: ${JSON.stringify(tavilyData.specs)}`);
  } catch (error) {
    console.warn(`⚠️  Tavily search failed for ${hardwareData.name}:`, error);
  }
  
  // Merge Tavily specs with existing specs
  const mergedSpecs = {
    ...(hardwareData.specs || {}),
    ...(tavilyData?.specs || {}),
  };
  
  // Merge descriptions
  const mergedDescription = tavilyData?.description || hardwareData.description || "Keine Beschreibung verfügbar";
  
  // Merge pros/cons
  const mergedPros = [
    ...(tavilyData?.pros || []),
    ...(hardwareData.specs?.pros || []),
  ].slice(0, 5);
  
  const mergedCons = [
    ...(tavilyData?.cons || []),
    ...(hardwareData.specs?.cons || []),
  ].slice(0, 5);
  
  const prompt = `
    Schreibe eine EXTREM AUSFÜHRLICHE und DETAILLIERTE professionelle Hardware-Review für "${hardwareData.name}" in Deutsch UND Englisch.
    
    ${isRetry ? "HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Bitte fass dich etwas kürzer (ca. 1000-1200 Wörter pro Sprache), damit das JSON vollständig ist." : "KRITISCHE ANFORDERUNGEN:\n1. Der Text muss MASSIV AUSFÜHRLICH sein (MINDESTENS 1500-2000 Wörter pro Sprache - NICHT weniger!).\n2. Nutze eine tiefgehende journalistische Struktur mit vielen aussagekräftigen H2- und H3-Überschriften.\n3. Nutze die recherchierten Informationen aus den Tavily-Suchergebnissen für authentische Details.\n4. WICHTIG: Schreibe KEINE kurzen Reviews! Jeder Abschnitt muss ausführlich sein.\n5. Erwähne NIEMALS, dass dieser Text von einer KI generiert wurde. Der Text muss so klingen, als wäre er von einem passionierten Hardware-Experten geschrieben worden."}
    
    Antworte EXKLUSIV im JSON-Format mit folgendem Schema:
    {
      "de": {
        "title": "...",
        "content": "Markdown mit:\n- Inhaltsverzeichnis\n- AUSFÜHRLICHER Einleitung (mindestens 3-4 Absätze über das Produkt, seine Bedeutung, Marktposition)\n- MEHREREN tiefgehenden Analyse-Abschnitten mit Überschriften wie:\n  * Design & Verarbeitung (ausführlich beschreiben)\n  * Technische Spezifikationen im Detail (jede wichtige Spec erklären)\n  * Performance & Benchmarks (detaillierte Leistungsanalyse)\n  * Features & Innovationen (alle wichtigen Features beschreiben)\n  * Vergleich mit Konkurrenzprodukten\n  * Preis-Leistungs-Verhältnis\n  * Einsatzgebiete & Zielgruppe\n  * Vor- und Nachteile im Detail\n- BILD-PLATZHALTERN (![[IMAGE_X]]) an passenden Stellen\n- AUSFÜHRLICHEM Fazit (mindestens 2-3 Absätze mit Zusammenfassung, Empfehlung, Zielgruppe)\n\nWICHTIG: Jeder Abschnitt muss ausführlich sein! Keine kurzen Sätze oder oberflächliche Beschreibungen!",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "en": {
        "title": "...",
        "content": "Markdown with:\n- Table of Contents\n- DETAILED Introduction (at least 3-4 paragraphs about the product, its significance, market position)\n- SEVERAL deep-dive analysis sections with headings like:\n  * Design & Build Quality (describe in detail)\n  * Technical Specifications in Detail (explain every important spec)\n  * Performance & Benchmarks (detailed performance analysis)\n  * Features & Innovations (describe all important features)\n  * Comparison with Competitors\n  * Value for Money\n  * Use Cases & Target Audience\n  * Detailed Pros and Cons\n- IMAGE PLACEHOLDERS (![[IMAGE_X]]) at appropriate places\n- DETAILED Conclusion (at least 2-3 paragraphs with summary, recommendation, target audience)\n\nIMPORTANT: Each section must be detailed! No short sentences or superficial descriptions!",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "score": 0-100,
      "specs": {
        // Hardware-spezifische Spezifikationen - WICHTIG: Sammle ALLE verfügbaren technischen Details!
        // Beispiele je nach Hardware-Typ:
        // Monitor: Auflösung, Bildwiederholfrequenz, Panel-Typ, HDR, Anschlüsse, Größe, etc.
        // GPU: VRAM, Taktfrequenz, CUDA-Cores, Stromverbrauch, Anschlüsse, etc.
        // CPU: Kerne, Threads, Taktfrequenz, TDP, Socket, etc.
        // Tastatur: Switches, Layout, Beleuchtung, Anschlüsse, etc.
        // Maus: DPI, Sensor, Buttons, Gewicht, etc.
        // Headset: Frequenzgang, Impedanz, Mikrofon, Kabel/Wireless, etc.
        // Sammle so viele technische Details wie möglich!
      }
    }
    
    Hardware-Typ: ${hardwareData.type}
    Hersteller: ${hardwareData.manufacturer || "Unbekannt"}
    Modell: ${hardwareData.model || hardwareData.name}
    Beschreibung: ${mergedDescription}
    ${Object.keys(mergedSpecs).length > 0 ? `Bekannte Specs: ${JSON.stringify(mergedSpecs)}` : ""}
    ${tavilyData?.price ? `Preis: ${tavilyData.price}` : ""}
    ${tavilyData?.rating ? `Bewertung: ${tavilyData.rating}/10` : ""}
    
    WICHTIGER HINWEIS: Diese Review muss ausführlich und detailliert sein. Schreibe KEINE kurzen Absätze! Jeder Abschnitt sollte mindestens mehrere Sätze enthalten und tiefgehende Informationen bieten.
  `;

  try {
    const result = await generateContent(prompt, hardwareData.name, retryCount);
    
    // Merge Tavily pros/cons if available
    if (mergedPros.length > 0 && result.de.pros.length < 3) {
      result.de.pros = [...result.de.pros, ...mergedPros].slice(0, 5);
    }
    if (mergedCons.length > 0 && result.de.cons.length < 3) {
      result.de.cons = [...result.de.cons, ...mergedCons].slice(0, 5);
    }
    
    // Merge specs
    result.specs = {
      ...mergedSpecs,
      ...(result.specs || {}),
    };
    
    // Include Tavily search results for image extraction
    return {
      ...result,
      tavilySearchResults: tavilySearchResults || undefined,
    };
  } catch (error) {
    console.error(`Final error generating hardware content for ${hardwareData.name}:`, error);
    return {
      de: {
        title: hardwareData.name,
        content: `## Einleitung\n\n${mergedDescription}\n\n## Design & Verarbeitung\n\nDas ${hardwareData.name} präsentiert sich mit einem durchdachten Design und solider Verarbeitungsqualität. Die Materialauswahl und Konstruktion zeigen die Sorgfalt, die in die Entwicklung investiert wurde.\n\n## Technische Spezifikationen\n\nDie technischen Spezifikationen des ${hardwareData.name} bieten eine solide Grundlage für verschiedene Anwendungsbereiche. Die wichtigsten technischen Details wurden sorgfältig ausgewählt, um eine optimale Balance zwischen Leistung und Effizienz zu gewährleisten.\n\n## Performance\n\nIn praktischen Tests zeigt das ${hardwareData.name} eine solide Leistung. Die Performance entspricht den Erwartungen für ein Produkt in dieser Kategorie und bietet gute Ergebnisse für die meisten Anwendungsfälle.\n\n## Features\n\nDas ${hardwareData.name} bietet eine Reihe von Features, die die Nutzung komfortabel und effizient gestalten. Die wichtigsten Funktionen wurden gut durchdacht implementiert.\n\n## Preis-Leistungs-Verhältnis\n\nDas Preis-Leistungs-Verhältnis des ${hardwareData.name} ist ausgewogen. Für die gebotene Leistung und Qualität stellt es eine solide Wahl dar.\n\n## Fazit\n\nDas ${hardwareData.name} ist ein interessantes Hardware-Produkt, das eine gute Balance zwischen verschiedenen Faktoren bietet. Es eignet sich für Nutzer, die nach einer zuverlässigen Lösung suchen. Die Kombination aus Leistung, Qualität und Features macht es zu einer Überlegung wert.`,
        pros: mergedPros.length > 0 ? mergedPros : ["Gute Leistung", "Solide Verarbeitung", "Zuverlässige Performance", "Gute Features"],
        cons: mergedCons.length > 0 ? mergedCons : ["Könnte mehr Features haben", "Preis könnte günstiger sein"],
      },
      en: {
        title: hardwareData.name,
        content: `## Introduction\n\n${mergedDescription}\n\n## Design & Build Quality\n\nThe ${hardwareData.name} presents itself with a thoughtful design and solid build quality. The material selection and construction show the care invested in its development.\n\n## Technical Specifications\n\nThe technical specifications of the ${hardwareData.name} provide a solid foundation for various application areas. The most important technical details have been carefully selected to ensure an optimal balance between performance and efficiency.\n\n## Performance\n\nIn practical tests, the ${hardwareData.name} shows solid performance. The performance meets expectations for a product in this category and offers good results for most use cases.\n\n## Features\n\nThe ${hardwareData.name} offers a range of features that make usage comfortable and efficient. The most important functions have been well thought out and implemented.\n\n## Value for Money\n\nThe value for money of the ${hardwareData.name} is balanced. For the performance and quality offered, it represents a solid choice.\n\n## Conclusion\n\nThe ${hardwareData.name} is an interesting hardware product that offers a good balance between various factors. It is suitable for users looking for a reliable solution. The combination of performance, quality, and features makes it worth considering.`,
        pros: mergedPros.length > 0 ? mergedPros : ["Good performance", "Solid build quality", "Reliable performance", "Good features"],
        cons: mergedCons.length > 0 ? mergedCons : ["Could have more features", "Price could be lower"],
      },
      score: tavilyData?.rating ? Math.round(tavilyData.rating * 10) : 70,
      specs: mergedSpecs,
      tavilySearchResults: tavilySearchResults || undefined,
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

// Helper function to check and ensure tmdbId column exists
async function ensureTmdbIdColumn() {
  try {
    // Try a simple query to check if column exists
    await prisma.$queryRaw`SELECT "tmdbId" FROM "Review" LIMIT 1`;
  } catch (error: any) {
    // If column doesn't exist, try to add it
    if (error.message?.includes("does not exist") || error.message?.includes("column")) {
      try {
        await prisma.$executeRaw`ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "tmdbId" INTEGER`;
        await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Review_tmdbId_idx" ON "Review"("tmdbId")`;
        console.log("✓ tmdbId column and index created");
      } catch (migrationError) {
        console.error("Failed to create tmdbId column:", migrationError);
        // Continue anyway - might fail in some environments
      }
    }
  }
}

// Helper function to process a single movie
export async function processMovie(
  movieData: TMDBMovie,
  options: { status: "draft" | "published"; skipExisting: boolean }
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    // Ensure tmdbId column exists before using it
    await ensureTmdbIdColumn();
    
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
    // Ensure tmdbId column exists before using it
    await ensureTmdbIdColumn();
    
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

// Helper function to generate Amazon review content using OpenAI with Tavily Search
export async function generateAmazonReviewContent(
  productData: { name: string; asin?: string; description?: string; affiliateLink?: string },
  retryCount = 0
): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
  specs?: any;
  tavilySearchResults?: any; // Include Tavily search results for image extraction
}> {
  const isRetry = retryCount > 0;
  
  // Use Tavily Search to gather Amazon product information
  let tavilyData: {
    specs: Record<string, any>;
    description: string;
    pros: string[];
    cons: string[];
    price?: string;
    rating?: number;
  } | null = null;
  
  let tavilySearchResults: any = null;
  
  try {
    console.log(`🔍 Searching Tavily for Amazon product ${productData.name}...`);
    const searchResults = await searchAmazonProduct(
      productData.name,
      productData.asin
    );
    tavilySearchResults = searchResults;
    tavilyData = extractProductSpecs(searchResults);
    console.log(`✅ Found Tavily data: ${JSON.stringify(tavilyData.specs)}`);
  } catch (error) {
    console.warn(`⚠️  Tavily search failed for ${productData.name}:`, error);
  }
  
  // Merge Tavily data
  const mergedSpecs = tavilyData?.specs || {};
  const mergedDescription = tavilyData?.description || productData.description || "Keine Beschreibung verfügbar";
  const mergedPros = tavilyData?.pros || [];
  const mergedCons = tavilyData?.cons || [];
  
  const prompt = `
    Schreibe eine EXTREM AUSFÜHRLICHE professionelle Amazon-Produkt-Review für "${productData.name}" in Deutsch UND Englisch.
    
    ${isRetry ? "HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Bitte fass dich etwas kürzer (ca. 800-1000 Wörter pro Sprache), damit das JSON vollständig ist." : "ANFORDERUNGEN AN DEN INHALT:\n1. Der Text muss MASSIV DETAILLIERT sein (Ziel: 1200-1500 Wörter pro Sprache).\n2. Nutze eine tiefgehende journalistische Struktur mit aussagekräftigen H2- und H3-Überschriften.\n3. Nutze die recherchierten Informationen aus den Tavily-Suchergebnissen für authentische Details.\n4. Erwähne NIEMALS, dass dieser Text von einer KI generiert wurde. Der Text muss so klingen, als wäre er von einem passionierten Produkttester geschrieben worden."}
    
    Antworte EXKLUSIV im JSON-Format mit folgendem Schema:
    {
      "de": {
        "title": "...",
        "content": "Markdown mit Inhaltsverzeichnis, ausführlicher Einleitung, mehreren tiefgehenden Analyse-Abschnitten mit Überschriften (z.B. Verpackung & Lieferung, Design & Verarbeitung, Funktionen & Features, Performance, Preis-Leistungs-Verhältnis, etc.), BILD-PLATZHALTERN (![[IMAGE_X]]) und Fazit...",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "en": {
        "title": "...",
        "content": "Markdown with Table of Contents, detailed intro, several deep-dive analysis sections with headings (e.g., Packaging & Delivery, Design & Build Quality, Features & Functionality, Performance, Value for Money, etc.), IMAGE PLACEHOLDERS (![[IMAGE_X]]) and conclusion...",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "score": 0-100,
      "specs": {
        // Produktspezifische Spezifikationen und Details
      }
    }
    
    Produktname: ${productData.name}
    ASIN: ${productData.asin || "Nicht verfügbar"}
    Beschreibung: ${mergedDescription}
    ${Object.keys(mergedSpecs).length > 0 ? `Bekannte Specs: ${JSON.stringify(mergedSpecs)}` : ""}
    ${tavilyData?.price ? `Preis: ${tavilyData.price}` : ""}
    ${tavilyData?.rating ? `Bewertung: ${tavilyData.rating}/10` : ""}
  `;

  try {
    const result = await generateContent(prompt, productData.name, retryCount);
    
    // Merge Tavily pros/cons if available
    if (mergedPros.length > 0 && result.de.pros.length < 3) {
      result.de.pros = [...result.de.pros, ...mergedPros].slice(0, 5);
    }
    if (mergedCons.length > 0 && result.de.cons.length < 3) {
      result.de.cons = [...result.de.cons, ...mergedCons].slice(0, 5);
    }
    
    // Merge specs
    result.specs = {
      ...mergedSpecs,
      ...(result.specs || {}),
    };
    
    return result;
  } catch (error) {
    console.error(`Final error generating Amazon content for ${productData.name}:`, error);
    return {
      de: {
        title: productData.name,
        content: `## Einleitung\n\n${mergedDescription}\n\n## Fazit\n\nEin interessantes Produkt, das es wert ist, genauer betrachtet zu werden.`,
        pros: mergedPros.length > 0 ? mergedPros : ["Gute Qualität", "Guter Preis"],
        cons: mergedCons.length > 0 ? mergedCons : ["Könnte mehr Features haben"],
      },
      en: {
        title: productData.name,
        content: `## Introduction\n\n${mergedDescription}\n\n## Conclusion\n\nAn interesting product worth taking a closer look at.`,
        pros: mergedPros.length > 0 ? mergedPros : ["Good quality", "Good price"],
        cons: mergedCons.length > 0 ? mergedCons : ["Could have more features"],
      },
      score: tavilyData?.rating ? Math.round(tavilyData.rating * 10) : 70,
      specs: mergedSpecs,
      tavilySearchResults: tavilySearchResults || undefined,
    };
  }
}

// Helper function to process an Amazon product review
export async function processAmazonProduct(
  productData: { name: string; asin?: string; description?: string; affiliateLink?: string },
  options: { status: "draft" | "published"; skipExisting: boolean; generateImages?: boolean }
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    // Check if review already exists by ASIN
    if (options.skipExisting && productData.asin) {
      const existing = await prisma.review.findFirst({
        where: { amazonAsin: productData.asin, category: "amazon" },
      });
      if (existing) {
        return { success: false, error: "Already exists" };
      }
    }

    // Generate review content
    const reviewContent = await generateAmazonReviewContent(productData);

    // Generate slug
    let slug = generateSlug(reviewContent.de.title || productData.name);
    const existingSlug = await prisma.review.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Generate images using Tavily (preferred) or OpenAI (fallback) if requested
    let imageUrls: string[] = [];
    if (options.generateImages !== false) {
      try {
        console.log(`🎨 Generating review images for ${productData.name}...`);
        const generatedImages = await generateReviewImages({
          productName: productData.name,
          productType: "product",
          style: "professional",
          count: 3,
          tavilySearchResults: reviewContent.tavilySearchResults, // Use Tavily images if available
        });
        imageUrls = generatedImages;
        console.log(`✅ Generated ${imageUrls.length} images`);
      } catch (error) {
        console.error(`Error generating images for ${productData.name}:`, error);
      }
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "amazon",
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
        amazonAsin: productData.asin || null,
        affiliateLink: productData.affiliateLink || null,
        specs: reviewContent.specs || null,
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`Error processing Amazon product ${productData.name}:`, error);
    return { success: false, error: error.message };
  }
}
