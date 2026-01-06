import prisma from "@/lib/prisma";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { uploadImage } from "@/lib/blob";
import { calculatePublicationDate } from "@/lib/date-utils";
import { HardwareType } from "@/lib/hardware";
import { TMDBMovie, TMDBSeries, getTMDBImageUrl } from "@/lib/tmdb";
import { searchHardwareProduct, extractProductSpecs, extractTavilyImages } from "@/lib/tavily";
import { generateReviewImages } from "@/lib/image-generation";
import { getAmazonProductData, parseAmazonUrl } from "@/lib/amazon";

// Helper function to generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Validates product input data
 */
export function validateProductInput(data: { name: string; asin?: string }): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 3) {
    errors.push("Produktname muss mindestens 3 Zeichen lang sein.");
  }
  if (data.name && data.name.length > 200) {
    errors.push("Produktname darf maximal 200 Zeichen lang sein.");
  }
  if (data.asin && !/^[A-Z0-9]{10}$/i.test(data.asin)) {
    errors.push("ASIN muss aus 10 alphanumerischen Zeichen bestehen.");
  }
  
  return { valid: errors.length === 0, errors };
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
      max_tokens: 16000, // Increased for longer content (5000-10000 words per language)
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

// Helper function to generate a list of products using OpenAI based on keywords
export async function generateProductListWithAI(
  keywords: string,
  count: number = 10
): Promise<Array<{ name: string; asin?: string; description?: string }>> {
  const prompt = `
    Erstelle eine Liste von ${count} populären und aktuell relevanten Amazon-Produkten für den Suchbegriff "${keywords}".
    
    Antworte EXKLUSIV im JSON-Format:
    {
      "products": [
        { "name": "Produktname", "asin": "10-stellige ASIN falls bekannt (optional)", "description": "Kurze Beschreibung des Produkts" },
        ...
      ]
    }
    
    WICHTIG: Erfinde KEINE ASINs, wenn du sie nicht sicher kennst. Gib nur echte, existierende Produkte zurück.
  `;

  try {
    const aiResponse = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const contentRaw = aiResponse.choices[0].message.content || "{}";
    const parsed = JSON.parse(contentRaw);
    return (parsed.products || []).slice(0, count);
  } catch (error) {
    console.error("Error generating product list with AI:", error);
    return [];
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
    Schreibe eine EXTREM AUSFÜHRLICHE und ULTRA-DETAILLIERTE professionelle Hardware-Review für "${hardwareData.name}" in Deutsch UND Englisch.
    
    ${isRetry ? "HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Bitte fass dich etwas kürzer (ca. 3000-4000 Wörter pro Sprache), damit das JSON vollständig ist." : "KRITISCHE ANFORDERUNGEN:\n1. Der Text muss MASSIV AUSFÜHRLICH sein (MINDESTENS 5000-10000 Wörter pro Sprache - NICHT weniger!).\n2. Nutze eine tiefgehende journalistische Struktur mit vielen aussagekräftigen H2- und H3-Überschriften.\n3. Nutze die recherchierten Informationen aus den Tavily-Suchergebnissen für authentische Details.\n4. WICHTIG: Schreibe KEINE kurzen Reviews! Jeder Abschnitt muss SEHR ausführlich sein mit vielen Details.\n5. Erwähne NIEMALS, dass dieser Text von einer KI generiert wurde. Der Text muss so klingen, als wäre er von einem passionierten Hardware-Experten geschrieben worden.\n6. Gehe in JEDEM Abschnitt sehr tief ins Detail - beschreibe nicht nur oberflächlich, sondern analysiere gründlich."}
    
    Antworte EXKLUSIV im JSON-Format mit folgendem Schema:
    {
      "de": {
        "title": "...",
        "content": "Markdown mit:\n- Inhaltsverzeichnis\n- SEHR AUSFÜHRLICHER Einleitung (mindestens 8-10 Absätze über das Produkt, seine Bedeutung, Marktposition, historischer Kontext, Hersteller)\n- VIELE tiefgehenden Analyse-Abschnitten mit Überschriften wie:\n  * Design & Verarbeitung (SEHR ausführlich - mindestens 5-6 Absätze)\n  * Technische Spezifikationen im Detail (jede wichtige Spec SEHR detailliert erklären - mindestens 10-15 Absätze)\n  * Performance & Benchmarks (SEHR detaillierte Leistungsanalyse mit vielen Beispielen - mindestens 8-10 Absätze)\n  * Features & Innovationen (alle wichtigen Features SEHR ausführlich beschreiben - mindestens 6-8 Absätze)\n  * Vergleich mit Konkurrenzprodukten (detaillierter Vergleich - mindestens 5-6 Absätze)\n  * Preis-Leistungs-Verhältnis (ausführliche Analyse - mindestens 4-5 Absätze)\n  * Einsatzgebiete & Zielgruppe (detaillierte Beschreibung - mindestens 4-5 Absätze)\n  * Installation & Setup (falls relevant - mindestens 3-4 Absätze)\n  * Software & Treiber (falls relevant - mindestens 3-4 Absätze)\n  * Vor- und Nachteile im Detail (jeder Punkt ausführlich erklärt - mindestens 6-8 Absätze)\n- BILD-PLATZHALTERN (![[IMAGE_X]]) an passenden Stellen\n- SEHR AUSFÜHRLICHEM Fazit (mindestens 5-6 Absätze mit Zusammenfassung, Empfehlung, Zielgruppe, Ausblick)\n\nKRITISCH WICHTIG: Diese Review muss MINDESTENS 5000-10000 Wörter lang sein! Jeder Abschnitt muss SEHR ausführlich sein mit vielen Details, Beispielen und Erklärungen! Keine kurzen Sätze oder oberflächliche Beschreibungen!",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "en": {
        "title": "...",
        "content": "Markdown with:\n- Table of Contents\n- VERY DETAILED Introduction (at least 8-10 paragraphs about the product, its significance, market position, historical context, manufacturer)\n- MANY deep-dive analysis sections with headings like:\n  * Design & Build Quality (VERY detailed - at least 5-6 paragraphs)\n  * Technical Specifications in Detail (explain every important spec VERY thoroughly - at least 10-15 paragraphs)\n  * Performance & Benchmarks (VERY detailed performance analysis with many examples - at least 8-10 paragraphs)\n  * Features & Innovations (describe all important features VERY thoroughly - at least 6-8 paragraphs)\n  * Comparison with Competitors (detailed comparison - at least 5-6 paragraphs)\n  * Value for Money (thorough analysis - at least 4-5 paragraphs)\n  * Use Cases & Target Audience (detailed description - at least 4-5 paragraphs)\n  * Installation & Setup (if relevant - at least 3-4 paragraphs)\n  * Software & Drivers (if relevant - at least 3-4 paragraphs)\n  * Detailed Pros and Cons (each point thoroughly explained - at least 6-8 paragraphs)\n- IMAGE PLACEHOLDERS (![[IMAGE_X]]) at appropriate places\n- VERY DETAILED Conclusion (at least 5-6 paragraphs with summary, recommendation, target audience, outlook)\n\nCRITICALLY IMPORTANT: This review must be AT LEAST 5000-10000 words long! Each section must be VERY detailed with many details, examples, and explanations! No short sentences or superficial descriptions!",
        "pros": ["...", "...", "...", "...", "..."],
        "cons": ["...", "...", "...", "...", "..."]
      },
      "score": 0-100,
      "specs": {
        // Hardware-spezifische Spezifikationen - WICHTIG: Sammle ALLE verfügbaren technischen Details!
      }
    }
    
    Hardware-Typ: ${hardwareData.type}
    Hersteller: ${hardwareData.manufacturer || "Unbekannt"}
    Modell: ${hardwareData.model || hardwareData.name}
    Beschreibung: ${mergedDescription}
    ${Object.keys(mergedSpecs).length > 0 ? `Bekannte Specs: ${JSON.stringify(mergedSpecs)}` : ""}
    ${tavilyData?.price ? `Preis: ${tavilyData.price}` : ""}
    ${tavilyData?.rating ? `Bewertung: ${tavilyData.rating}/10` : ""}
    
    KRITISCH WICHTIGER HINWEIS: Diese Review muss MINDESTENS 5000-10000 Wörter pro Sprache lang sein! Schreibe KEINE kurzen Absätze! Jeder Abschnitt sollte viele Absätze enthalten (mindestens 4-6 Absätze pro Hauptabschnitt) und SEHR tiefgehende Informationen bieten. Gehe in jedes Detail, erkläre Hintergründe, gebe Beispiele, vergleiche mit Alternativen. Die Review muss so ausführlich sein wie eine professionelle Hardware-Testseite!
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
        content: `## Einleitung\n\n${mergedDescription}\n\n## Design & Verarbeitung\n\nDas ${hardwareData.name} präsentiert sich mit einem durchdachten Design und solider Verarbeitungsqualität. Die Materialauswahl und Konstruktion zeigen die Sorgfalt, die in die Entwicklung investiert wurde.\n\n## Technische Spezifikationen\n\nDie technischen Spezifikationen des ${hardwareData.name} bieten eine solide Grundlage für verschiedene Anwendungsbereiche.\n\n## Performance\n\nIn praktischen Tests zeigt das ${hardwareData.name} eine solide Leistung.\n\n## Fazit\n\nDas ${hardwareData.name} ist ein interessantes Hardware-Produkt, das eine gute Balance zwischen verschiedenen Faktoren bietet.`,
        pros: mergedPros.length > 0 ? mergedPros : ["Gute Leistung", "Solide Verarbeitung"],
        cons: mergedCons.length > 0 ? mergedCons : ["Könnte mehr Features haben", "Preis könnte günstiger sein"],
      },
      en: {
        title: hardwareData.name,
        content: `## Introduction\n\n${mergedDescription}\n\n## Design & Build Quality\n\nThe ${hardwareData.name} presents itself with a thoughtful design and solid build quality.\n\n## Technical Specifications\n\nThe technical specifications of the ${hardwareData.name} provide a solid foundation for various application areas.\n\n## Performance\n\nIn practical tests, the ${hardwareData.name} shows solid performance.\n\n## Conclusion\n\nThe ${hardwareData.name} is an interesting hardware product that offers a good balance between various factors.`,
        pros: mergedPros.length > 0 ? mergedPros : ["Good performance", "Solid build quality"],
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
    // ALWAYS check if review already exists by IGDB ID (prevent duplicates)
    const existingById = await prisma.review.findFirst({
      where: { igdbId: gameData.id },
    });
    if (existingById) {
      return { success: false, error: "Already exists" };
    }

    // Generate review content
    const reviewContent = await generateReviewContent(gameData);

    // Generate slug and ensure uniqueness
    let slug = generateSlug(reviewContent.de.title || gameData.name);
    let slugAttempts = 0;
    while (await prisma.review.findUnique({ where: { slug } })) {
      slugAttempts++;
      if (slugAttempts > 10) {
        slug = `${generateSlug(reviewContent.de.title || gameData.name)}-${Date.now().toString(36)}`;
        break;
      }
      slug = `${generateSlug(reviewContent.de.title || gameData.name)}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Upload cover image if available
    let imageUrls: string[] = [];
    if (gameData.cover?.url) {
      try {
        const coverUrl = gameData.cover.url.startsWith("//") ? "https:" + gameData.cover.url : gameData.cover.url;
        const highResCoverUrl = coverUrl.replace("t_thumb", "t_720p");
        const syncedUrl = await uploadImage(highResCoverUrl, `${slug}-cover.jpg`);
        imageUrls.push(syncedUrl);
      } catch (error) {
        console.error(`Error uploading cover for ${gameData.name}:`, error);
        imageUrls.push(gameData.cover.url.replace("t_thumb", "t_720p"));
      }
    }

    // Add screenshots
    if (gameData.screenshots && gameData.screenshots.length > 0) {
      const screenshotUrls = gameData.screenshots.slice(0, 5).map((s: any) =>
        s.url.startsWith("//") ? "https:" + s.url.replace("t_thumb", "t_1080p") : s.url.replace("t_thumb", "t_1080p")
      );
      
      for (let i = 0; i < screenshotUrls.length; i++) {
        try {
          const syncedUrl = await uploadImage(screenshotUrls[i], `${slug}-screen-${i+1}.jpg`);
          imageUrls.push(syncedUrl);
        } catch (err) {
          imageUrls.push(screenshotUrls[i]);
        }
      }
    }

    // Process metadata and create review
    const gameMetadata = {
        developers: gameData.involved_companies?.filter((c: any) => c.developer).map((c: any) => c.company.name) || [],
        publishers: gameData.involved_companies?.filter((c: any) => c.publisher).map((c: any) => c.company.name) || [],
        platforms: gameData.platforms?.map((p: any) => p.name) || [],
        genres: gameData.genres?.map((g: any) => g.name) || [],
        releaseDate: gameData.first_release_date,
        igdbScore: gameData.rating,
    };

    // Check if release date is in the future - if so, set status to draft
    const now = new Date();
    const releaseDate = gameData.first_release_date ? new Date(gameData.first_release_date * 1000) : null;
    const isFutureRelease = releaseDate && releaseDate > now;
    const finalStatus = isFutureRelease ? "draft" : options.status;

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
        status: finalStatus,
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
    
    ${isRetry ? "HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Bitte fass dich etwas kürzer (ca. 800-1000 Wörter pro Sprache), damit das JSON vollständig ist." : "WICHTIG: Erwähne NIEMALS, dass dieser Text von einer KI, AI oder einem Sprachmodell generiert wurde."}
    
    Antworte EXKLUSIV im JSON-Format mit folgendem Schema:
    {
      "de": { "title": "...", "content": "Markdown...", "pros": [...], "cons": [...] },
      "en": { "title": "...", "content": "Markdown...", "pros": [...], "cons": [...] },
      "score": 0-100
    }
    
    Handlung: ${movieData.overview || "N/A"}
    Genres: ${movieData.genres?.map((g) => g.name).join(", ") || "N/A"}
    Release Date: ${movieData.release_date || "N/A"}
  `;

  try {
    return await generateContent(prompt, movieData.title, retryCount);
  } catch (error) {
    console.error(`Final error generating movie content for ${movieData.title}:`, error);
    return {
      de: { title: movieData.title, content: movieData.overview || "", pros: [], cons: [] },
      en: { title: movieData.title, content: movieData.overview || "", pros: [], cons: [] },
      score: 70,
    };
  }
}

// Helper function to process a single movie
export async function processMovie(
  movieData: TMDBMovie,
  options: { status: "draft" | "published"; skipExisting: boolean }
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    const existingById = await prisma.review.findFirst({
      where: { tmdbId: movieData.id, category: "movie" },
    });
    if (existingById) return { success: false, error: "Already exists" };

    const reviewContent = await generateMovieReviewContent(movieData);
    let slug = generateSlug(reviewContent.de.title || movieData.title);
    
    let imageUrls: string[] = [];
    if (movieData.poster_path) {
      try {
        const posterUrl = getTMDBImageUrl(movieData.poster_path, "w1280");
        if (posterUrl) {
          const syncedUrl = await uploadImage(posterUrl, `${slug}-poster.jpg`);
          imageUrls.push(syncedUrl);
        }
      } catch (err) {
        const posterUrl = getTMDBImageUrl(movieData.poster_path, "w1280");
        if (posterUrl) imageUrls.push(posterUrl);
      }
    }

    // Check if release date is in the future - if so, set status to draft
    const now = new Date();
    const releaseDate = movieData.release_date ? new Date(movieData.release_date) : null;
    const isFutureRelease = releaseDate && releaseDate > now;
    const finalStatus = isFutureRelease ? "draft" : options.status;

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
        status: finalStatus,
        tmdbId: movieData.id,
        createdAt: movieData.release_date ? new Date(movieData.release_date) : new Date(),
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`Error processing movie ${movieData.title}:`, error);
    return { success: false, error: error.message };
  }
}

// Helper function to generate Amazon review content using OpenAI with Multi-Source Data
export async function generateAmazonReviewContent(
  productData: { name: string; asin?: string; description?: string; affiliateLink?: string },
  retryCount = 0
): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
  specs?: any;
  images?: string[];
  tavilySearchResults?: any;
}> {
  const isRetry = retryCount > 0;
  
  // 1. Get product data from multiple sources
  let enrichedData: any = null;
  let dataSource: string = "unknown";
  
  try {
    const result = await getAmazonProductData(productData.name, productData.asin);
    enrichedData = result.data;
    dataSource = result.source;
    console.log(`✅ Enriched product data for "${productData.name}" via ${dataSource}`);
  } catch (error) {
    console.warn(`⚠️ Multi-source data fetch failed for ${productData.name}, using basic data:`, (error as Error).message);
    enrichedData = {
      name: productData.name,
      description: productData.description || "Keine Beschreibung verfügbar.",
      specs: {},
      pros: [],
      cons: [],
    };
  }
  
  const mergedSpecs = { ...(enrichedData.specs || {}) };
  const mergedDescription = enrichedData.description || enrichedData.summary || productData.description || "Keine Beschreibung verfügbar";
  const mergedPros = [...(enrichedData.pros || [])].slice(0, 5);
  const mergedCons = [...(enrichedData.cons || [])].slice(0, 5);
  
  const prompt = `
    Schreibe eine EXTREM AUSFÜHRLICHE professionelle Amazon-Produkt-Review für "${enrichedData.title || productData.name}" in Deutsch UND Englisch.
    
    ${isRetry ? "HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Bitte fass dich etwas kürzer." : "WICHTIG: Erwähne NIEMALS eine KI. Der Text muss klingen wie von einem passionierten Produkttester."}
    
    Antworte EXKLUSIV im JSON-Format:
    {
      "de": { "title": "...", "content": "...", "pros": [...], "cons": [...] },
      "en": { "title": "...", "content": "...", "pros": [...], "cons": [...] },
      "score": 0-100,
      "specs": {}
    }
    
    Kontext: ${mergedDescription}
    Features: ${enrichedData.features?.join(", ") || "N/A"}
    Specs: ${JSON.stringify(mergedSpecs)}
    ${enrichedData.price ? `Preis: ${enrichedData.price}` : ""}
    ${enrichedData.rating ? `Bewertung: ${enrichedData.rating}/5` : ""}
    
    WICHTIG: Wenn kein Preis angegeben ist, erfinde KEINEN Preis. Lass Preisangaben im Text einfach weg.
  `;

  try {
    const result = await generateContent(prompt, enrichedData.title || productData.name, retryCount);
    
    // Merge data
    if (mergedPros.length > 0 && result.de.pros.length < 3) {
      result.de.pros = [...new Set([...result.de.pros, ...mergedPros])].slice(0, 5);
    }
    if (mergedCons.length > 0 && result.de.cons.length < 3) {
      result.de.cons = [...new Set([...result.de.cons, ...mergedCons])].slice(0, 5);
    }
    
    result.specs = { ...mergedSpecs, ...(result.specs || {}) };
    
    return {
      ...result,
      images: enrichedData.images || [],
      tavilySearchResults: enrichedData.tavilySearchResults,
    };
  } catch (error) {
    console.error(`Final error generating Amazon content for ${productData.name}:`, error);
    return {
      de: { title: productData.name, content: mergedDescription, pros: mergedPros, cons: mergedCons },
      en: { title: productData.name, content: mergedDescription, pros: mergedPros, cons: mergedCons },
      score: enrichedData.rating ? Math.round(enrichedData.rating * 20) : 70,
      specs: mergedSpecs,
      images: enrichedData.images || [],
    };
  }
}

// Helper function to process an Amazon product review
export async function processAmazonProduct(
  productData: { name: string; asin?: string; description?: string; affiliateLink?: string },
  options: { status: "draft" | "published"; skipExisting: boolean; generateImages?: boolean }
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    // 1. Validation
    const validation = validateProductInput(productData);
    if (!validation.valid) {
      return { success: false, error: `Validierungsfehler: ${validation.errors.join(", ")}` };
    }

    // 2. Duplicate check - improved to catch duplicates even with different titles
    // Normalize product name for comparison (remove special chars, lowercase)
    const normalizedProductName = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    
    // Extract key words from product name (first 2-3 words usually identify the product)
    const nameWords = normalizedProductName.split(" ").filter(w => w.length > 2);
    const keyWords = nameWords.slice(0, Math.min(3, nameWords.length)).join(" ");
    
    if (productData.asin) {
      const existingByAsin = await prisma.review.findFirst({
        where: { amazonAsin: productData.asin, category: { in: ["amazon", "product"] } },
      });
      if (existingByAsin) {
        if (options.skipExisting) return { success: false, error: "Already exists (ASIN)" };
        // Even if not skipping, warn about duplicate ASIN
        console.warn(`⚠️ Duplicate ASIN detected: ${productData.asin} (existing review: ${existingByAsin.title})`);
      }
    }
    
    // Check by exact name match
    const existingByName = await prisma.review.findFirst({
      where: { title: { equals: productData.name, mode: "insensitive" }, category: { in: ["amazon", "product"] } },
    });
    if (existingByName) {
      if (options.skipExisting) return { success: false, error: "Already exists (Exact Name)" };
      console.warn(`⚠️ Duplicate exact name detected: ${productData.name}`);
    }
    
    // Check by product name contained in title (catches variations like "Sony WH-1000XM5: Review..." vs "Sony WH-1000XM5: Test...")
    if (keyWords.length > 5) {
      const existingByTitleContains = await prisma.review.findFirst({
        where: {
          AND: [
            { title: { contains: keyWords, mode: "insensitive" as const } },
            { category: { in: ["amazon", "product"] } },
          ],
        },
      });
      if (existingByTitleContains) {
        if (options.skipExisting) return { success: false, error: `Already exists (Similar title: "${existingByTitleContains.title}")` };
        console.warn(`⚠️ Similar product review found: "${existingByTitleContains.title}" (searching for: ${keyWords})`);
      }
    }

    // 3. Generate review content
    const reviewContent = await generateAmazonReviewContent(productData);

    // 4. Slug and uniqueness
    let slug = generateSlug(reviewContent.de.title || productData.name);
    let slugAttempts = 0;
    while (await prisma.review.findUnique({ where: { slug } })) {
      slugAttempts++;
      if (slugAttempts > 10) {
        slug = `${generateSlug(reviewContent.de.title || productData.name)}-${Date.now().toString(36)}`;
        break;
      }
      slug = `${generateSlug(reviewContent.de.title || productData.name)}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // 5. Images (Enriched from PA API or Scraping, fallback to Generation)
    let imageUrls: string[] = [];
    
    // Try to sync images from data source first
    if (reviewContent.images && reviewContent.images.length > 0) {
      for (let i = 0; i < Math.min(reviewContent.images.length, 5); i++) {
        try {
          const syncedUrl = await uploadImage(reviewContent.images[i], `${slug}-source-${i+1}.jpg`);
          imageUrls.push(syncedUrl);
        } catch (err) {
          imageUrls.push(reviewContent.images[i]);
        }
      }
    }

    // If still no images or explicitly requested, generate some
    if (imageUrls.length === 0 && options.generateImages !== false) {
      try {
        console.log(`🎨 Generating review images for ${productData.name}...`);
        const generatedImages = await generateReviewImages({
          productName: productData.name,
          productType: "product",
          style: "professional",
          count: 3,
          tavilySearchResults: reviewContent.tavilySearchResults,
        });
        imageUrls = [...imageUrls, ...generatedImages].slice(0, 5);
      } catch (error) {
        console.error(`Error generating images for ${productData.name}:`, error);
      }
    }

    // 6. Create review
    // Generate a realistic publication date (random date within last 2 years)
    const now = new Date();
    const twoYearsAgo = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
    const randomTime = twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime());
    const publicationDate = new Date(randomTime);
    
    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "product",
        content: reviewContent.de.content,
        content_en: reviewContent.en.content,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        status: options.status,
        amazonAsin: productData.asin || null,
        affiliateLink: productData.affiliateLink || null,
        specs: reviewContent.specs || null,
        createdAt: publicationDate,
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`Error processing Amazon product ${productData.name}:`, error);
    return { success: false, error: error.message };
  }
}

// Add other missing process functions if needed...
export async function processSeries(
  seriesData: TMDBSeries,
  options: { status: "draft" | "published"; skipExisting: boolean }
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  // Implementation similar to movie...
  try {
    const existingById = await prisma.review.findFirst({
      where: { tmdbId: seriesData.id, category: "series" },
    });
    if (existingById) return { success: false, error: "Already exists" };

    const reviewContent = await generateSeriesReviewContent(seriesData);
    let slug = generateSlug(reviewContent.de.title || seriesData.name);
    
    let imageUrls: string[] = [];
    if (seriesData.poster_path) {
      const posterUrl = getTMDBImageUrl(seriesData.poster_path, "w1280");
      if (posterUrl) imageUrls.push(posterUrl);
    }

    // Check if release date is in the future - if so, set status to draft
    const now = new Date();
    const releaseDate = seriesData.first_air_date ? new Date(seriesData.first_air_date) : null;
    const isFutureRelease = releaseDate && releaseDate > now;
    const finalStatus = isFutureRelease ? "draft" : options.status;

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
        status: finalStatus,
        tmdbId: seriesData.id,
        createdAt: seriesData.first_air_date ? new Date(seriesData.first_air_date) : new Date(),
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateSeriesReviewContent(
  seriesData: TMDBSeries,
  retryCount = 0
): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
}> {
  const isRetry = retryCount > 0;
  const prompt = `Schreibe eine professionelle Serien-Review für "${seriesData.name}"...`;
  try {
    return await generateContent(prompt, seriesData.name, retryCount);
  } catch (error) {
    return {
      de: { title: seriesData.name, content: seriesData.overview || "", pros: [], cons: [] },
      en: { title: seriesData.name, content: seriesData.overview || "", pros: [], cons: [] },
      score: 70,
    };
  }
}
