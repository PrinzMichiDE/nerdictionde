import prisma from "@/lib/prisma";
import openai, { OPENAI_MODEL } from "@/lib/openai";
import { generateAndSaveCommentsForReview } from "@/lib/comment-generation";
import { uploadImage } from "@/lib/blob";
import { calculatePublicationDate } from "@/lib/date-utils";
import { TMDBMovie, TMDBSeries, getTMDBImageUrl, getTMDBMovieById, getTMDBSeriesById } from "@/lib/tmdb";
import { searchGameProduct, buildGameResearchSummary, buildResearchSummary, searchMovieProduct, searchSeriesProduct } from "@/lib/tavily";
import type { TavilySearchResponse } from "@/lib/tavily";
import type { SteamGameInfo } from "@/lib/steam";
import { getIGDBGameById } from "@/lib/igdb";
import {
  extractYouTubeVideoIdsFromIGDB,
  extractYouTubeVideoIdsFromTMDB,
} from "@/lib/youtube-extraction";
import { generateAndAttachTagsForReview } from "@/lib/tag-generation";
import { replaceImagePlaceholders } from "@/lib/image-placeholder";
import { generateSEOMetadata } from "@/lib/seo-generation";

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
    const stack: string[] = [];
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
    const stack: string[] = [];
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
      } catch {}
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

const RETRY_HINT =
  '\n\nHINWEIS: Dein letzter Versuch war leer, abgeschnitten oder ungültig. Antworte AUSSCHLIESSLICH mit einem einzigen vollständigen JSON-Objekt mit allen Feldern des Schemas (de, en, score). Schreibe kürzer (ca. 900-1100 Wörter pro Sprache), damit die Antwort vollständig bleibt. Kein leerer "{}", kein Markdown.';

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
      // The model occasionally answers with a trivial empty object (e.g. "{}"),
      // so there is nothing to repair. Skip straight to a retry with a hint.
      const isTrivial =
        /^\s*(?:null|true|false|\[\]|\{\}|0|-?\d+(?:\.\d+)?)\s*$/.test(contentRaw) ||
        contentRaw.trim().length < 10;

      if (isTrivial) {
        throw new Error(`Empty or trivial AI response for ${itemName}`);
      }

      const repaired = repairJson(contentRaw, parseError, itemName);
      
      if ((!repaired.en || !repaired.en.content) && retryCount < 1) {
        console.log(`Repaired JSON for ${itemName} is still missing content. Retrying...`);
        return generateContent(prompt + RETRY_HINT, itemName, retryCount + 1);
      }
      
      return repaired;
    }
  } catch (error) {
    if (retryCount < 1) {
      console.error(`Error in generation for ${itemName}, retrying...`, error);
      return generateContent(prompt + (retryCount === 0 ? RETRY_HINT : ""), itemName, retryCount + 1);
    }
    throw error;
  }
}

export interface ReviewSection {
  de: string;
  en: string;
  description: string;
}

/**
 * Maps a reference rating on a 0-10 scale to a 0-100 score band.
 * The band is centered on the reference and clamped to [0, 100].
 */
export function computeScoreBand(
  reference10: number
): { min: number; max: number; target: number } {
  const target = Math.round(reference10 * 10);
  return {
    min: Math.max(0, target - 8),
    max: Math.min(100, target + 8),
    target,
  };
}

interface StructuredReviewPromptOptions {
  category: "game" | "movie" | "series";
  itemName: string;
  contextLines: string[];
  sections: ReviewSection[];
  wordTarget: number;
  imageCount: number;
  isRetry: boolean;
  includeSpecs?: boolean;
  referenceRating?: string;
  scoreBand?: { min: number; max: number; target: number };
}

/**
 * Builds a structured, deep-dive review prompt for games, movies and series.
 * Enforces consistent quality: explicit table of contents, deep sections with
 * custom anchors, image placeholders, honest scoring and full DE/EN parity.
 */
export function buildStructuredReviewPrompt(options: StructuredReviewPromptOptions): string {
  const {
    category,
    itemName,
    contextLines,
    sections,
    wordTarget,
    imageCount,
    isRetry,
    includeSpecs,
    referenceRating,
    scoreBand,
  } = options;

  const categoryLabel =
    category === "game" ? "Game-Review" : category === "movie" ? "Film-Review" : "Serien-Review";

  const retryHint = isRetry
    ? `HINWEIS: Dein letzter Versuch wurde wegen Überlänge abgeschnitten. Halte dich strikt an ca. ${wordTarget} Wörter pro Sprache, damit das JSON vollständig bleibt.`
    : "";

  const sectionList = sections
    .map((s, i) => `${i + 1}. "${s.de}" (EN: "${s.en}") – ${s.description}`)
    .join("\n");

  const placeholders = Array.from({ length: Math.min(imageCount, 4) }, (_, i) => `![[IMAGE_${i + 1}]]`).join(" ");

  const specsSchema = includeSpecs
    ? `,
  "specs": {
    "minimum": { "os": "", "cpu": "", "ram": "", "gpu": "", "dx": "", "storage": "" },
    "recommended": { "os": "", "cpu": "", "ram": "", "gpu": "", "dx": "", "storage": "" }
  }`
    : "";

  const scoreGuidance = referenceRating
    ? `Der Score (0-100) muss logisch aus Pros/Cons und Analyse ableitbar sein und in einem plausiblen Verhältnis zur externen Referenzbewertung stehen (${referenceRating}).`
    : `Der Score (0-100) muss logisch aus Pros/Cons und Analyse ableitbar sein.`;

  const bandGuidance = scoreBand
    ? ` Die externen Referenzbewertungen liegen im Mittel bei ${scoreBand.target}/100. Vergebe den Score so, dass er im Bereich ${scoreBand.min}–${scoreBand.max} liegt. Eine Abweichung um mehr als ±5 ist nur erlaubt, wenn deine qualitative Analyse dafür triftige Gründe liefert, die du im Fazit nachvollziehbar begründest.`
    : "";

  return `
Schreibe eine tiefgehende, professionelle und SEO-optimierte ${categoryLabel} für "${itemName}" auf der Website Nerdiction – in DEUTSCH UND ENGLISCH.

${retryHint}

STRUKTUR & TIEFE (QUALITÄTSANFORDERUNGEN):
1. Länge: Etwa ${wordTarget} Wörter pro Sprache. Vollständig ausformulierte Absätze, keine Stichpunkte im Fließtext, keine Platzhaltertexte.
2. Inhaltsverzeichnis: Beginne den Content mit "## Inhaltsverzeichnis" (DE) bzw. "## Table of Contents" (EN) und einer Liste mit Links zu allen Hauptabschnitten, die auf die Anker der Überschriften zeigen.
3. Überschriften: Nutze H2 für Hauptabschnitte und H3 für Unterabschnitte. Gib JEDER Überschrift einen expliziten, eindeutigen Anker im Format "{#slug}" (z. B. "## Story & Erzählung {#story-und-erzaehlung}") und verlinke im Inhaltsverzeichnis exakt auf diese Anker.
4. Abschnitte: Behandle die folgenden Abschnitte in genau dieser Reihenfolge und schreibe jeden Abschnitt SEHR ausführlich (mindestens 4-5 Absätze pro Hauptabschnitt):

${sectionList}

5. Bilder: Platziere an sinnvollen Stellen im Text die Platzhalter ${placeholders} (einzeln, als eigener Absatz). Verwende höchstens ${imageCount} verschiedene Platzhalter.
6. Vor- und Nachteile: Gib exakt 5 Pros und 5 Cons pro Sprache an. Sie müssen konkrete Details aus der Review widerspiegeln und dürfen nicht generisch oder austauschbar sein.
7. Score: ${scoreGuidance}${bandGuidance} Vergebe nicht automatisch 70-80 – differenziere ehrlich.
8. Tonfall: Begeistert, kompetent und objektiv, wie von einem erfahrenen Redakteur. Erwähne NIEMALS, dass der Text von einer KI, einem Sprachmodell oder automatisch generiert wurde.
9. DE/EN-Konsistenz: Die englische Version ist eine vollständige, hochwertige Übersetzung der deutschen Version mit identischer Struktur – keine Auslassungen, keine Zusammenfassungen.
10. FAKTENTREUE: Stütze dich in Handlungs- und Inhaltsabschnitten AUSSCHLIESSLICH auf die unten bereitgestellten Fakten (Zusammenfassung, Storyline, Steam-Daten, Recherche). Erfinde KEINE konkreten Handlungsdetails, Namen, Charaktere, Features, technischen Werte oder Ereignisse, die nicht belegt sind. Fehlen Details, formuliere bewusst allgemein statt zu spekulieren.
11. Format: Antworte AUSSCHLIESSLICH mit gültigem JSON – kein Markdown-Codeblock, kein Text außerhalb des JSON.

JSON-Schema:
{
  "de": {
    "title": "Aussagekräftiger Titel (max. 70 Zeichen, ohne überflüssige Zusätze)",
    "content": "Kompletter Markdown-Content mit Inhaltsverzeichnis, allen Abschnitten, Bild-Platzhaltern und Fazit",
    "pros": ["...", "...", "...", "...", "..."],
    "cons": ["...", "...", "...", "...", "..."]
  },
  "en": {
    "title": "...",
    "content": "...",
    "pros": [...],
    "cons": [...]
  },
  "score": 0-100${specsSchema}
}

FAKTEN UND KONTEXT (nur als Recherche-Basis verwenden, nicht wörtlich kopieren):
${contextLines.join("\n")}
`.trim();
}

const GAME_CATEGORY_LABELS: Record<number, string> = {
  0: "Hauptspiel",
  1: "DLC / Add-on",
  2: "Erweiterung",
  3: "Bundle",
  4: "Standalone-Erweiterung",
  5: "Mod",
  6: "Episode",
  7: "Sammlung",
  8: "Mod",
  9: "Remake",
  10: "Remaster",
  11: "Expanded Game",
  12: "Port",
  13: "Fork",
  14: "Pack",
  15: "Update",
};

const AGE_RATING_LABELS: Record<number, string> = {
  1: "PEGI 3",
  2: "PEGI 7",
  3: "PEGI 12",
  4: "PEGI 16",
  5: "PEGI 18",
  6: "ESRB eC",
  7: "ESRB E",
  8: "ESRB E10+",
  9: "ESRB T",
  10: "ESRB M",
  11: "ESRB AO",
};

/**
 * Computes a plausible target score band from external reference ratings
 * (IGDB community, IGDB critics, Metacritic, Steam %) so the generated score
 * stays calibrated instead of defaulting to 70-80.
 */
export function computeGameScoreBand(
  values: Array<number | null | undefined>
): { min: number; max: number; target: number } | null {
  const valid = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v > 0);
  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  const target = Math.round(avg);
  return {
    target,
    min: Math.max(0, target - 8),
    max: Math.min(100, target + 8),
  };
}

function formatTimeToBeat(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null;
  const hours = Math.round(seconds / 3600);
  if (hours < 1) return `${Math.round(seconds / 60)} Minuten`;
  return `${hours} Stunden`;
}

function formatAgeRating(ratings?: Array<{ category?: number; rating?: number }>): string {
  if (!ratings || ratings.length === 0) return "";
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const r of ratings) {
    if (typeof r.rating !== "number") continue;
    const label = AGE_RATING_LABELS[r.rating] || `Altersfreigabe ${r.rating}`;
    if (!seen.has(label)) {
      seen.add(label);
      labels.push(label);
    }
  }
  return labels.join(", ");
}

// Helper function to generate review content using OpenAI with built-in auto-repair
export async function generateReviewContent(
  gameData: any,
  retryCount = 0,
  options?: {
    steamData?: SteamGameInfo | null;
    tavilySearchResults?: TavilySearchResponse;
  }
): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
  specs?: any;
}> {
  const isRetry = retryCount > 0;

  const involvedCompanies = (gameData.involved_companies || []) as Array<{
    developer: boolean;
    publisher: boolean;
    company: { name: string };
  }>;
  const developers = involvedCompanies.filter((c) => c.developer).map((c) => c.company.name);
  const publishers = involvedCompanies.filter((c) => c.publisher).map((c) => c.company.name);
  const platforms = ((gameData.platforms || []) as Array<{ name: string }>).map((p) => p.name);
  const genres = ((gameData.genres || []) as Array<{ name: string }>).map((g) => g.name);
  const gameModes = ((gameData.game_modes || []) as Array<{ name: string }>).map((m) => m.name);
  const perspectives = ((gameData.player_perspectives || []) as Array<{ name: string }>).map((p) => p.name);

  const storyline = (gameData.storyline as string | undefined)?.trim();
  const themes = ((gameData.themes || []) as Array<{ name: string }>).map((t) => t.name);
  const keywords = ((gameData.keywords || []) as Array<{ name: string }>).map((k) => k.name).slice(0, 12);
  const similarGames = ((gameData.similar_games || []) as Array<{ name: string }>).map((s) => s.name).slice(0, 6);
  const franchise = (gameData.franchise as { name?: string } | undefined)?.name;
  const collections = ((gameData.collections || []) as Array<{ name: string }>).map((c) => c.name);
  const engines = ((gameData.game_engines || []) as Array<{ name: string }>).map((e) => e.name);
  const timeToBeat = gameData.time_to_beat as
    | { hastly?: number; normally?: number; completely?: number }
    | undefined;
  const ageRating = formatAgeRating(
    (gameData.age_ratings || []) as Array<{ category?: number; rating?: number }>
  );
  const languages = ((gameData.language_supports || []) as Array<{ language: { name: string } }>)
    .map((l) => l.language?.name)
    .filter(Boolean)
    .slice(0, 12);

  const gameCategory = GAME_CATEGORY_LABELS[(gameData.category as number) ?? -1];
  const statusLabels: Record<number, string> = {
    0: "angekündigt",
    1: "Alpha",
    2: "Beta",
    3: "Early Access",
    4: "erscheint",
    5: "veröffentlicht",
    6: "eingestellt",
  };
  const gameStatus = statusLabels[(gameData.status as number) ?? -1];

  const releaseDate = gameData.first_release_date
    ? new Date(gameData.first_release_date * 1000).toLocaleDateString("de-DE")
    : "N/A";

  // Use Tavily to gather factual review context (best-effort, non-blocking)
  let tavilySearchResults = options?.tavilySearchResults;
  if (!tavilySearchResults) {
    try {
      console.log(`🔍 Searching Tavily for game ${gameData.name}...`);
      tavilySearchResults = await searchGameProduct(gameData.name, platforms[0]);
    } catch (error) {
      console.warn(`⚠️  Tavily search failed for ${gameData.name}:`, error);
    }
  }

  const steam = options?.steamData;

  const contextLines = [
    `Name: ${gameData.name}`,
    `Entwickler: ${developers.join(", ") || "Unbekannt"}`,
    `Publisher: ${publishers.join(", ") || "Unbekannt"}`,
    `Plattformen: ${platforms.join(", ") || "N/A"}`,
    `Genres: ${genres.join(", ") || "N/A"}`,
    `Spielmodi: ${gameModes.join(", ") || "N/A"}`,
    `Perspektive: ${perspectives.join(", ") || "N/A"}`,
    `Erscheinungsdatum: ${releaseDate}`,
    gameCategory ? `Spieltyp: ${gameCategory}` : "",
    gameStatus ? `Status: ${gameStatus}` : "",
    engines.length ? `Game-Engines: ${engines.join(", ")}` : "",
    themes.length ? `Themen: ${themes.join(", ")}` : "",
    keywords.length ? `Schlagwörter: ${keywords.join(", ")}` : "",
    franchise ? `Franchise: ${franchise}` : "",
    collections.length ? `Collection: ${collections.join(", ")}` : "",
    ageRating ? `Altersfreigabe: ${ageRating}` : "",
    languages.length ? `Unterstützte Sprachen (UI/Untertitel): ${languages.join(", ")}` : "",
    formatTimeToBeat(timeToBeat?.hastly)
      ? `Spieldauer (Hauptstory): ${formatTimeToBeat(timeToBeat?.hastly)}`
      : "",
    formatTimeToBeat(timeToBeat?.completely)
      ? `Spieldauer (100%): ${formatTimeToBeat(timeToBeat?.completely)}`
      : "",
    gameData.rating ? `IGDB-Community-Bewertung: ${Number(gameData.rating).toFixed(1)}/100` : "",
    gameData.aggregated_rating ? `IGDB-Kritiker-Bewertung: ${Number(gameData.aggregated_rating).toFixed(1)}/100` : "",
    steam?.metacriticScore ? `Metacritic: ${steam.metacriticScore}/100` : "",
    steam?.reviewSummary?.percentPositive != null && steam.reviewSummary.total > 0
      ? `Steam-Nutzerbewertung: ${steam.reviewSummary.percentPositive}% positiv (${steam.reviewSummary.description || "aus " + steam.reviewSummary.total + " Rezensionen"})`
      : "",
    steam?.recommendations ? `Steam-Empfehlungen: ${steam.recommendations}` : "",
    steam?.priceFormatted ? `Aktueller Preis (Steam): ${steam.priceFormatted}` : "",
    `Zusammenfassung: ${gameData.summary || "N/A"}`,
    storyline ? `Storyline: ${storyline.substring(0, 1200)}` : "",
    similarGames.length ? `Ähnliche Spiele für den Vergleich: ${similarGames.join(", ")}` : "",
    ...(tavilySearchResults ? buildGameResearchSummary(tavilySearchResults) : []),
  ].filter(Boolean);

  const pcReq = steam?.pcRequirements;
  const minReq = pcReq?.minimum;
  const recReq = pcReq?.recommended;
  const pcRequirementLines: string[] = [];
  if (minReq && (minReq.os || minReq.cpu || minReq.gpu || minReq.raw)) {
    pcRequirementLines.push(`Echte Systemanforderungen (Minimum) aus dem Steam-Storefront: ${minReq.raw || [minReq.os, minReq.cpu, minReq.ram, minReq.gpu, minReq.dx, minReq.storage].filter(Boolean).join(", ")}`);
  }
  if (recReq && (recReq.os || recReq.cpu || recReq.gpu || recReq.raw)) {
    pcRequirementLines.push(`Echte Systemanforderungen (Empfohlen) aus dem Steam-Storefront: ${recReq.raw || [recReq.os, recReq.cpu, recReq.ram, recReq.gpu, recReq.dx, recReq.storage].filter(Boolean).join(", ")}`);
  }
  if (pcRequirementLines.length > 0) {
    contextLines.push(...pcRequirementLines);
  }

  const sections: ReviewSection[] = [
    {
      de: "Einleitung",
      en: "Introduction",
      description: "Stimme den Leser ein: Worum geht es, warum ist das Spiel relevant, Einordnung in Serie und Genre.",
    },
    {
      de: "Story & Erzählung",
      en: "Story & Narrative",
      description: "Handlung, Erzählstruktur, Charaktere, Dialoge, Tempo und Wendepunkte – ohne die Handlung komplett zu spoilern.",
    },
    {
      de: "Gameplay & Mechaniken",
      en: "Gameplay & Mechanics",
      description: "Kernmechaniken, Steuerung, Systeme, Schwierigkeitsgrad, Spielspaß und Innovationen.",
    },
    {
      de: "Grafik & Präsentation",
      en: "Graphics & Presentation",
      description: "Art Direction, technische Umsetzung, Performance, Framerate, Ladezeiten und die Haptik der Spielwelt.",
    },
    {
      de: "Sound & Musik",
      en: "Sound & Music",
      description: "Soundtrack, Sounddesign, Sprachausgabe und deren Wirkung auf die Atmosphäre.",
    },
    {
      de: "Inhalt & Wiederspielwert",
      en: "Content & Replayability",
      description: "Umfang, Abwechslung, Nebenaktivitäten, Endgame und Community beziehungsweise Mods.",
    },
    {
      de: "Technik & Performance",
      en: "Performance & Technical Aspects",
      description: "Optimierung, Bugs, Plattform-Unterschiede und Stabilität.",
    },
    {
      de: "Vergleich mit ähnlichen Spielen",
      en: "Comparison with Similar Games",
      description: "Direkte Vergleiche mit Genrekollegen und Vorgängern.",
    },
    {
      de: "Für wen lohnt sich das Spiel?",
      en: "Who Is This Game For?",
      description: "Zielgruppe, nötige Spielerfahrung und Preis-Leistungs-Betrachtung.",
    },
    {
      de: "Fazit",
      en: "Verdict",
      description: "Gesamturteil, Begründung des Scores und klare Kaufempfehlung.",
    },
  ];

  const referenceRatings: string[] = [];
  if (gameData.rating) referenceRatings.push(`IGDB ${Number(gameData.rating).toFixed(1)}/100`);
  if (gameData.aggregated_rating) referenceRatings.push(`IGDB-Kritiker ${Number(gameData.aggregated_rating).toFixed(1)}/100`);
  if (steam?.metacriticScore) referenceRatings.push(`Metacritic ${steam.metacriticScore}/100`);
  if (steam?.reviewSummary?.percentPositive != null) referenceRatings.push(`Steam ${steam.reviewSummary.percentPositive}% positiv`);

  const scoreBand = computeGameScoreBand([
    gameData.rating,
    gameData.aggregated_rating,
    steam?.metacriticScore,
    steam?.reviewSummary?.percentPositive,
  ]);

  const prompt = buildStructuredReviewPrompt({
    category: "game",
    itemName: gameData.name,
    contextLines,
    sections,
    wordTarget: 1800,
    imageCount: 4,
    isRetry,
    includeSpecs: true,
    referenceRating: referenceRatings.join("; "),
    scoreBand: scoreBand ?? undefined,
  });

  try {
    const result = await generateContent(prompt, gameData.name, retryCount);

    // Override system requirements with the real Steam values when available
    if (steam?.pcRequirements) {
      const toSpecStrings = (req: { os?: string; cpu?: string; ram?: string; gpu?: string; dx?: string; storage?: string }) =>
        Object.fromEntries(
          Object.entries({ os: req.os, cpu: req.cpu, ram: req.ram, gpu: req.gpu, dx: req.dx, storage: req.storage })
            .filter(([, v]) => !!v && v !== "N/A")
        );
      result.specs = {
        ...(result.specs || {}),
        minimum: { ...(result.specs?.minimum || {}), ...toSpecStrings(steam.pcRequirements.minimum) },
        recommended: { ...(result.specs?.recommended || {}), ...toSpecStrings(steam.pcRequirements.recommended) },
      };
    }

    return result;
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

    // Find store IDs automatically (ALL stores from IGDB) - needed before content generation
    let storeIds: {
      steamAppId?: string;
      epicId?: string;
      gogId?: string;
      stores?: Array<{ category: number; name: string; id: string; url: string }>;
    } = {};

    try {
      const { findStoreIds } = await import("./store-search");
      storeIds = await findStoreIds(gameData.name, gameData.id);
      console.log(`🔍 Found store IDs for ${gameData.name}:`, storeIds);
    } catch (error) {
      console.warn(`⚠️  Could not fetch store IDs for ${gameData.name}:`, error);
    }

    // Fetch real Steam data (system requirements, Metacritic, review summary) - best-effort
    let steamData: import("@/lib/steam").SteamGameInfo | null = null;
    if (storeIds.steamAppId) {
      try {
        const { getSteamAppDetails, getSteamReviewSummary } = await import("./steam");
        const [details, reviews] = await Promise.allSettled([
          getSteamAppDetails(storeIds.steamAppId),
          getSteamReviewSummary(storeIds.steamAppId),
        ]);
        if (details.status === "fulfilled" && details.value) {
          steamData = details.value;
          if (reviews.status === "fulfilled" && reviews.value) {
            steamData.reviewSummary = reviews.value;
          }
          console.log(`✅ Steam data for ${gameData.name}:`, {
            metacritic: steamData.metacriticScore,
            rating: steamData.reviewSummary?.percentPositive,
            hasPcReqs: !!steamData.pcRequirements,
          });
        }
      } catch (error) {
        console.warn(`⚠️  Steam enrichment failed for ${gameData.name}:`, error);
      }
    }

    // Generate review content (with Steam + Tavily research context)
    const reviewContent = await generateReviewContent(gameData, 0, { steamData });

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
    const imageUrls: string[] = [];
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
        } catch {
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
        gameModes: ((gameData.game_modes || []) as Array<{ name: string }>).map((m) => m.name) || [],
        perspectives: ((gameData.player_perspectives || []) as Array<{ name: string }>).map((p) => p.name) || [],
        engines: ((gameData.game_engines || []) as Array<{ name: string }>).map((e) => e.name) || [],
        releaseDate: gameData.first_release_date,
        igdbScore: gameData.rating,
        criticScore: gameData.aggregated_rating ?? steamData?.metacriticScore ?? undefined,
        ageRating: formatAgeRating((gameData.age_ratings || []) as Array<{ category?: number; rating?: number }>),
        timeToBeat: {
          hastly: gameData.time_to_beat?.hastly ?? undefined,
          normally: gameData.time_to_beat?.normally ?? undefined,
          completely: gameData.time_to_beat?.completely ?? undefined,
        },
        similarGames: ((gameData.similar_games || []) as Array<{ name: string }>).map((s) => s.name) || [],
        franchise: (gameData.franchise as { name?: string } | undefined)?.name,
        steamMetacritic: steamData?.metacriticScore ?? undefined,
        steamRatingPercent: steamData?.reviewSummary?.percentPositive ?? undefined,
        steamTotalReviews: steamData?.reviewSummary?.total ?? undefined,
        steamPrice: steamData?.priceFormatted ?? undefined,
        stores: storeIds.stores || [], // Store all store links in metadata
    };

    // Check if release date is in the future - if so, set status to draft
    const now = new Date();
    const releaseDate = gameData.first_release_date ? new Date(gameData.first_release_date * 1000) : null;
    const isFutureRelease = releaseDate && releaseDate > now;
    const finalStatus = isFutureRelease ? "draft" : options.status;

    const youtubeVideos = extractYouTubeVideoIdsFromIGDB(gameData);

    const contentDe = replaceImagePlaceholders(reviewContent.de.content, imageUrls, gameData.name);
    const contentEn = replaceImagePlaceholders(reviewContent.en.content, imageUrls, gameData.name);

    let seoMeta: { metaDescription: string; metaKeywords: string } | null = null;
    try {
      seoMeta = await generateSEOMetadata(reviewContent.de.title, contentDe, "game");
    } catch {
      // Non-blocking
    }

    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "game",
        content: contentDe,
        content_en: contentEn,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        youtubeVideos,
        status: finalStatus,
        igdbId: gameData.id,
        steamAppId: storeIds.steamAppId || null,
        epicId: storeIds.epicId || null,
        gogId: storeIds.gogId || null,
        specs: reviewContent.specs || null,
        metadata: gameMetadata,
        metaDescription: seoMeta?.metaDescription ?? null,
        metaKeywords: seoMeta?.metaKeywords ?? null,
        releaseDate: releaseDate || null,
        createdAt: calculatePublicationDate(gameData.first_release_date),
      },
    });

    generateAndSaveCommentsForReview(review.id, {
      reviewTitle: reviewContent.de.title,
      score: reviewContent.score,
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "game",
    }).catch((e) => console.warn("Comment generation for game review failed:", e));

    generateAndAttachTagsForReview(review.id, {
      reviewTitle: reviewContent.de.title,
      category: "game",
      score: reviewContent.score,
      metadata: gameMetadata as { genres?: string[]; platforms?: string[] },
      contentExcerpt: reviewContent.de.content?.substring(0, 500),
    }).catch((e) => console.warn("Tag generation for game review failed:", e));

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`Error processing game ${gameData.name}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Load a draft game review by ID, fetch full IGDB data, generate full content (text, images, SEO, tags, comments)
 * and update the existing review with status "published".
 * Used by the publish-release-reviews cron to turn release-calendar drafts into published posts.
 */
export async function enrichAndPublishDraftGameReview(
  reviewId: string
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, slug: true, igdbId: true, category: true, status: true },
    });

    if (!review || review.category !== "game") {
      return { success: false, error: "Review not found or not a game" };
    }
    if (review.status !== "draft") {
      return { success: false, error: "Review is not a draft" };
    }
    if (review.igdbId == null) {
      return { success: false, error: "Review has no igdbId" };
    }

    const gameData = await getIGDBGameById(review.igdbId);
    if (!gameData) {
      return { success: false, error: "IGDB game not found" };
    }

    let storeIds: {
      steamAppId?: string;
      epicId?: string;
      gogId?: string;
      stores?: Array<{ category: number; name: string; id: string; url: string }>;
    } = {};
    try {
      const { findStoreIds } = await import("./store-search");
      storeIds = await findStoreIds(gameData.name, gameData.id);
    } catch {
      // Non-blocking
    }

    // Fetch real Steam data (system requirements, Metacritic, review summary) - best-effort
    let steamData: import("@/lib/steam").SteamGameInfo | null = null;
    if (storeIds.steamAppId) {
      try {
        const { getSteamAppDetails, getSteamReviewSummary } = await import("./steam");
        const [details, reviews] = await Promise.allSettled([
          getSteamAppDetails(storeIds.steamAppId),
          getSteamReviewSummary(storeIds.steamAppId),
        ]);
        if (details.status === "fulfilled" && details.value) {
          steamData = details.value;
          if (reviews.status === "fulfilled" && reviews.value) {
            steamData.reviewSummary = reviews.value;
          }
        }
      } catch (error) {
        console.warn(`⚠️  Steam enrichment failed for ${gameData.name}:`, error);
      }
    }

    const reviewContent = await generateReviewContent(gameData, 0, { steamData });
    const slug = review.slug;

    const imageUrls: string[] = [];
    if (gameData.cover?.url) {
      try {
        const coverUrl = gameData.cover.url.startsWith("//") ? "https:" + gameData.cover.url : gameData.cover.url;
        const highResCoverUrl = coverUrl.replace("t_thumb", "t_720p");
        const syncedUrl = await uploadImage(highResCoverUrl, `${slug}-cover.jpg`);
        imageUrls.push(syncedUrl);
      } catch (error) {
        console.error(`Error uploading cover for ${gameData.name}:`, error);
      }
    }
    if (gameData.screenshots && gameData.screenshots.length > 0) {
      const screenshotUrls = gameData.screenshots.slice(0, 5).map((s: any) =>
        s.url.startsWith("//") ? "https:" + s.url.replace("t_thumb", "t_1080p") : s.url.replace("t_thumb", "t_1080p")
      );
      for (let i = 0; i < screenshotUrls.length; i++) {
        try {
          const syncedUrl = await uploadImage(screenshotUrls[i], `${slug}-screen-${i + 1}.jpg`);
          imageUrls.push(syncedUrl);
        } catch {
          imageUrls.push(screenshotUrls[i]);
        }
      }
    }

    const gameMetadata = {
      developers: gameData.involved_companies?.filter((c: any) => c.developer).map((c: any) => c.company.name) || [],
      publishers: gameData.involved_companies?.filter((c: any) => c.publisher).map((c: any) => c.company.name) || [],
      platforms: gameData.platforms?.map((p: any) => p.name) || [],
      genres: gameData.genres?.map((g: any) => g.name) || [],
      gameModes: ((gameData.game_modes || []) as Array<{ name: string }>).map((m) => m.name) || [],
      perspectives: ((gameData.player_perspectives || []) as Array<{ name: string }>).map((p) => p.name) || [],
      engines: ((gameData.game_engines || []) as Array<{ name: string }>).map((e) => e.name) || [],
      releaseDate: gameData.first_release_date,
      igdbScore: gameData.rating,
      criticScore: gameData.aggregated_rating ?? steamData?.metacriticScore ?? undefined,
      ageRating: formatAgeRating((gameData.age_ratings || []) as Array<{ category?: number; rating?: number }>),
      timeToBeat: {
        hastly: gameData.time_to_beat?.hastly ?? undefined,
        normally: gameData.time_to_beat?.normally ?? undefined,
        completely: gameData.time_to_beat?.completely ?? undefined,
      },
      similarGames: ((gameData.similar_games || []) as Array<{ name: string }>).map((s) => s.name) || [],
      franchise: (gameData.franchise as { name?: string } | undefined)?.name,
      steamMetacritic: steamData?.metacriticScore ?? undefined,
      steamRatingPercent: steamData?.reviewSummary?.percentPositive ?? undefined,
      steamTotalReviews: steamData?.reviewSummary?.total ?? undefined,
      steamPrice: steamData?.priceFormatted ?? undefined,
      stores: storeIds.stores || [],
    };
    const releaseDate = gameData.first_release_date ? new Date(gameData.first_release_date * 1000) : null;
    const youtubeVideos = extractYouTubeVideoIdsFromIGDB(gameData);

    const contentDe = replaceImagePlaceholders(reviewContent.de.content, imageUrls, gameData.name);
    const contentEn = replaceImagePlaceholders(reviewContent.en.content, imageUrls, gameData.name);

    let seoMeta: { metaDescription: string; metaKeywords: string } | null = null;
    try {
      seoMeta = await generateSEOMetadata(reviewContent.de.title, contentDe, "game");
    } catch {
      // Non-blocking
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        content: contentDe,
        content_en: contentEn,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        youtubeVideos,
        status: "published",
        steamAppId: storeIds.steamAppId || null,
        epicId: storeIds.epicId || null,
        gogId: storeIds.gogId || null,
        specs: reviewContent.specs || null,
        metadata: gameMetadata,
        metaDescription: seoMeta?.metaDescription ?? null,
        metaKeywords: seoMeta?.metaKeywords ?? null,
        releaseDate: releaseDate || null,
      },
    });

    generateAndSaveCommentsForReview(reviewId, {
      reviewTitle: reviewContent.de.title,
      score: reviewContent.score,
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "game",
    }).catch((e) => console.warn("Comment generation for draft publish failed:", e));

    generateAndAttachTagsForReview(reviewId, {
      reviewTitle: reviewContent.de.title,
      category: "game",
      score: reviewContent.score,
      metadata: gameMetadata as { genres?: string[]; platforms?: string[] },
      contentExcerpt: reviewContent.de.content?.substring(0, 500),
    }).catch((e) => console.warn("Tag generation for draft publish failed:", e));

    return { success: true, reviewId };
  } catch (error: any) {
    console.error(`Error enriching draft game review ${reviewId}:`, error);
    return { success: false, error: error.message };
  }
}

// Helper function to generate movie review content using OpenAI
export async function generateMovieReviewContent(
  movieData: TMDBMovie,
  retryCount = 0,
  options?: { tavilySearchResults?: TavilySearchResponse }
): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
}> {
  const isRetry = retryCount > 0;

  // Use Tavily to gather factual review context (best-effort, non-blocking)
  let tavilySearchResults = options?.tavilySearchResults;
  if (!tavilySearchResults) {
    try {
      console.log(`🔍 Searching Tavily for movie ${movieData.title}...`);
      tavilySearchResults = await searchMovieProduct(
        movieData.title,
        movieData.release_date ? new Date(movieData.release_date).getFullYear() : undefined
      );
    } catch (error) {
      console.warn(`⚠️  Tavily search failed for ${movieData.title}:`, error);
    }
  }

  const cast = (movieData.credits?.cast || [])
    .slice(0, 8)
    .map((c) => (c.character ? `${c.name} als ${c.character}` : c.name));
  const directors = (movieData.credits?.crew || [])
    .filter((c) => c.job === "Director")
    .map((c) => c.name);
  const writers = (movieData.credits?.crew || [])
    .filter((c) => ["Writer", "Screenplay", "Story", "Screenstory", "Novel"].includes(c.job))
    .map((c) => c.name);

  const contextLines = [
    `Titel: ${movieData.title}`,
    `Originaltitel: ${movieData.original_title || "N/A"}`,
    `Genres: ${movieData.genres?.map((g) => g.name).join(", ") || "N/A"}`,
    `Erscheinungsdatum: ${movieData.release_date || "N/A"}`,
    movieData.runtime ? `Laufzeit: ${movieData.runtime} Minuten` : "",
    `Regie: ${directors.slice(0, 5).join(", ") || "N/A"}`,
    `Drehbuch: ${[...new Set(writers)].slice(0, 5).join(", ") || "N/A"}`,
    cast.length > 0 ? `Besetzung: ${[...new Set(cast)].join(", ")}` : "",
    movieData.vote_average
      ? `TMDB-Bewertung: ${Number(movieData.vote_average).toFixed(1)}/10 (${movieData.vote_count || 0} Stimmen)`
      : "",
    movieData.external_ids?.imdb_id ? `IMDb-ID: ${movieData.external_ids.imdb_id}` : "",
    movieData.production_companies?.length
      ? `Produktionsfirmen: ${movieData.production_companies.map((c) => c.name).join(", ")}`
      : "",
    movieData.production_countries?.length
      ? `Produktionsländer: ${movieData.production_countries.map((c) => c.name).join(", ")}`
      : "",
    movieData.spoken_languages?.length
      ? `Sprachen: ${movieData.spoken_languages.map((l) => l.name).join(", ")}`
      : "",
    `Handlung: ${movieData.overview || "N/A"}`,
    ...(tavilySearchResults ? buildResearchSummary(tavilySearchResults) : []),
  ].filter(Boolean);

  const sections: ReviewSection[] = [
    {
      de: "Einleitung",
      en: "Introduction",
      description: "Stimme den Leser ein: Kontext, Erwartungen und erster Eindruck ohne Spoiler.",
    },
    {
      de: "Handlung & Erzählung",
      en: "Plot & Narrative",
      description: "Erzählstruktur, Tempo, Wendepunkte und Dialoge – ohne das komplette Ende zu spoilern.",
    },
    {
      de: "Schauspiel & Charaktere",
      en: "Acting & Characters",
      description: "Performances, Chemie zwischen den Darstellern und Charakterentwicklung.",
    },
    {
      de: "Regie & Inszenierung",
      en: "Direction & Cinematography",
      description: "Regie, Kamera, Schnitt, Bildsprache und visueller Stil.",
    },
    {
      de: "Musik & Sounddesign",
      en: "Music & Sound Design",
      description: "Score, Soundtrack, Soundeffekte und deren emotionale Wirkung.",
    },
    {
      de: "Visuelle Effekte & Technik",
      en: "Visual Effects & Technical Craft",
      description: "VFX, Produktionsdesign, Ausstattung und technische Umsetzung.",
    },
    {
      de: "Themen & Botschaft",
      en: "Themes & Message",
      description: "Zentrale Themen, gesellschaftliche Relevanz und emotionale Tiefe.",
    },
    {
      de: "Vergleich mit ähnlichen Filmen",
      en: "Comparison with Similar Films",
      description: "Einordnung in das Genre und Vergleiche mit verwandten Werken.",
    },
    {
      de: "Für wen lohnt sich der Film?",
      en: "Who Is This Film For?",
      description: "Zielgruppe, Sehgewohnheit und Preis-Leistung (Kino oder Streaming).",
    },
    {
      de: "Fazit",
      en: "Verdict",
      description: "Gesamturteil, Begründung des Scores und klare Empfehlung.",
    },
  ];

  const prompt = buildStructuredReviewPrompt({
    category: "movie",
    itemName: movieData.title,
    contextLines,
    sections,
    wordTarget: 1800,
    imageCount: 4,
    isRetry,
    referenceRating: movieData.vote_average ? `${Number(movieData.vote_average).toFixed(1)}/10` : undefined,
    scoreBand: movieData.vote_average ? computeScoreBand(Number(movieData.vote_average)) : undefined,
  });

  try {
    return await generateContent(prompt, movieData.title, retryCount);
  } catch (error) {
    console.error(`Final error generating movie content for ${movieData.title}:`, error);
    const castNames = (movieData.credits?.cast || []).slice(0, 5).map((c) => c.name);
    const directorNames = (movieData.credits?.crew || [])
      .filter((c) => c.job === "Director")
      .map((c) => c.name);
    const fallbackRuntime = movieData.runtime ? `${movieData.runtime} Minuten` : "annähernd zwei Stunden";
    const fallbackPlotDe = movieData.overview
      ? `Die Handlung entfaltet sich vor dem Hintergrund des oben beschriebenen Ausgangspunkts und hält den Spannungsbogen über die Laufzeit von ${fallbackRuntime}.\n\n`
      : "";
    const fallbackPlotEn = movieData.overview
      ? `The plot unfolds against the backdrop described above and maintains its dramatic arc across the runtime of approximately ${fallbackRuntime}.\n\n`
      : "";
    const castLineDe = castNames.length > 0
      ? `Die Darsteller ${castNames.join(", ")} tragen die Geschichte mit überzeugenden Leistungen.`
      : "Die Darsteller überzeugen mit ihrem Ensemble.";
    const castLineEn = castNames.length > 0
      ? `The cast, led by ${castNames.join(", ")}, carries the story with compelling performances.`
      : "The cast delivers compelling ensemble performances.";
    const directorLineDe = directorNames.length > 0
      ? `Unter der Regie von ${directorNames.join(", ")} entsteht eine stimmige Inszenierung.\n\n`
      : "";
    const directorLineEn = directorNames.length > 0
      ? `Under the direction of ${directorNames.join(", ")}, the film feels cohesive and well-crafted.\n\n`
      : "";
    return {
      de: {
        title: movieData.title,
        content: `## Einleitung\n\n${movieData.overview || "Keine Beschreibung verfügbar."}\n\n## Handlung & Erzählung\n\n${fallbackPlotDe}## Schauspiel & Charaktere\n\n${castLineDe}\n\n${directorLineDe}## Fazit\n\nEin sehenswerter Film, der es wert ist, genauer betrachtet zu werden.`,
        pros: ["Spannende Handlung", "Gute schauspielerische Leistung", "Stimmige Inszenierung", "Atmosphärische Musik", "Überzeugender Cast"],
        cons: ["Einige Längen im Mittelteil", "Vorhersehbares Ende", "Manche Nebenfiguren bleiben blass", "Erzähltempo schwankt", "Nicht ohne Genreklischees"],
      },
      en: {
        title: movieData.title,
        content: `## Introduction\n\n${movieData.overview || "No description available."}\n\n## Plot & Narrative\n\n${fallbackPlotEn}## Acting & Characters\n\n${castLineEn}\n\n${directorLineEn}## Conclusion\n\nA worthwhile film that deserves a closer look.`,
        pros: ["Engaging plot", "Strong performances", "Cohesive direction", "Atmospheric score", "Compelling cast"],
        cons: ["Some pacing issues in the middle", "Predictable ending", "Some side characters feel thin", "Uneven pacing", "Falls back on genre cliches"],
      },
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
    
    // Generate slug and ensure uniqueness
    let slug = generateSlug(reviewContent.de.title || movieData.title);
    let slugAttempts = 0;
    while (await prisma.review.findUnique({ where: { slug } })) {
      slugAttempts++;
      if (slugAttempts > 10) {
        slug = `${generateSlug(reviewContent.de.title || movieData.title)}-${Date.now().toString(36)}`;
        break;
      }
      slug = `${generateSlug(reviewContent.de.title || movieData.title)}-${Math.random().toString(36).substring(2, 7)}`;
    }
    
    const imageUrls: string[] = [];
    if (movieData.poster_path) {
      try {
        const posterUrl = getTMDBImageUrl(movieData.poster_path, "w1280");
        if (posterUrl) {
          const syncedUrl = await uploadImage(posterUrl, `${slug}-poster.jpg`);
          imageUrls.push(syncedUrl);
        }
      } catch {
        const posterUrl = getTMDBImageUrl(movieData.poster_path, "w1280");
        if (posterUrl) imageUrls.push(posterUrl);
      }
    }

    // Add backdrops as in-content images (used by ![[IMAGE_X]] placeholders)
    const movieBackdrops = (movieData.images?.backdrops || []).slice(0, 3);
    for (let i = 0; i < movieBackdrops.length; i++) {
      const backdropUrl = getTMDBImageUrl(movieBackdrops[i].file_path, "w1280");
      if (!backdropUrl) continue;
      try {
        const syncedUrl = await uploadImage(backdropUrl, `${slug}-backdrop-${i + 1}.jpg`);
        imageUrls.push(syncedUrl);
      } catch {
        imageUrls.push(backdropUrl);
      }
    }

    // Check if release date is in the future - if so, set status to draft
    const now = new Date();
    const releaseDate = movieData.release_date ? new Date(movieData.release_date) : null;
    const isFutureRelease = releaseDate && releaseDate > now;
    const finalStatus = isFutureRelease ? "draft" : options.status;

    const youtubeVideos = extractYouTubeVideoIdsFromTMDB(movieData.videos);

    const contentDe = replaceImagePlaceholders(reviewContent.de.content, imageUrls, movieData.title);
    const contentEn = replaceImagePlaceholders(reviewContent.en.content, imageUrls, movieData.title);

    let seoMeta: { metaDescription: string; metaKeywords: string } | null = null;
    try {
      seoMeta = await generateSEOMetadata(reviewContent.de.title, contentDe, "movie");
    } catch {
      // Non-blocking
    }

    const movieMetadata = {
      genres: movieData.genres?.map((g) => g.name) || [],
      production_companies: movieData.production_companies?.map((c) => c.name) || [],
      production_countries: movieData.production_countries?.map((c) => c.name) || [],
      spoken_languages: movieData.spoken_languages?.map((l) => l.name) || [],
      release_date: movieData.release_date || undefined,
      runtime: movieData.runtime || undefined,
      tmdb_score: movieData.vote_average,
      vote_count: movieData.vote_count,
      popularity: movieData.popularity,
      director: (movieData.credits?.crew || []).filter((c) => c.job === "Director").map((c) => c.name) || [],
      cast: (movieData.credits?.cast || []).slice(0, 8).map((c) => c.name) || [],
      original_title: movieData.original_title || undefined,
    };

    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "movie",
        content: contentDe,
        content_en: contentEn,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        youtubeVideos,
        status: finalStatus,
        tmdbId: movieData.id,
        metadata: movieMetadata,
        metaDescription: seoMeta?.metaDescription ?? null,
        metaKeywords: seoMeta?.metaKeywords ?? null,
        createdAt: movieData.release_date ? new Date(movieData.release_date) : new Date(),
      },
    });

    generateAndSaveCommentsForReview(review.id, {
      reviewTitle: reviewContent.de.title,
      score: reviewContent.score,
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "movie",
    }).catch((e) => console.warn("Comment generation for movie review failed:", e));

    generateAndAttachTagsForReview(review.id, {
      reviewTitle: reviewContent.de.title,
      category: "movie",
      score: reviewContent.score,
      metadata: { genres: movieMetadata.genres },
      contentExcerpt: reviewContent.de.content?.substring(0, 500),
    }).catch((e) => console.warn("Tag generation for movie review failed:", e));

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`Error processing movie ${movieData.title}:`, error);
    return { success: false, error: error.message };
  }
}

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
    
    // Generate slug and ensure uniqueness
    let slug = generateSlug(reviewContent.de.title || seriesData.name);
    let slugAttempts = 0;
    while (await prisma.review.findUnique({ where: { slug } })) {
      slugAttempts++;
      if (slugAttempts > 10) {
        slug = `${generateSlug(reviewContent.de.title || seriesData.name)}-${Date.now().toString(36)}`;
        break;
      }
      slug = `${generateSlug(reviewContent.de.title || seriesData.name)}-${Math.random().toString(36).substring(2, 7)}`;
    }
    
    const imageUrls: string[] = [];
    if (seriesData.poster_path) {
      const posterUrl = getTMDBImageUrl(seriesData.poster_path, "w1280");
      if (posterUrl) imageUrls.push(posterUrl);
    }

    // Add backdrops as in-content images (used by ![[IMAGE_X]] placeholders)
    const seriesBackdrops = (seriesData.images?.backdrops || []).slice(0, 3);
    for (let i = 0; i < seriesBackdrops.length; i++) {
      const backdropUrl = getTMDBImageUrl(seriesBackdrops[i].file_path, "w1280");
      if (!backdropUrl) continue;
      try {
        const syncedUrl = await uploadImage(backdropUrl, `${slug}-backdrop-${i + 1}.jpg`);
        imageUrls.push(syncedUrl);
      } catch {
        imageUrls.push(backdropUrl);
      }
    }

    // Check if release date is in the future - if so, set status to draft
    const now = new Date();
    const releaseDate = seriesData.first_air_date ? new Date(seriesData.first_air_date) : null;
    const isFutureRelease = releaseDate && releaseDate > now;
    const finalStatus = isFutureRelease ? "draft" : options.status;

    const youtubeVideos = extractYouTubeVideoIdsFromTMDB(seriesData.videos);

    const contentDe = replaceImagePlaceholders(reviewContent.de.content, imageUrls, seriesData.name);
    const contentEn = replaceImagePlaceholders(reviewContent.en.content, imageUrls, seriesData.name);

    let seoMeta: { metaDescription: string; metaKeywords: string } | null = null;
    try {
      seoMeta = await generateSEOMetadata(reviewContent.de.title, contentDe, "series");
    } catch {
      // Non-blocking
    }

    const seriesMetadata = {
      genres: seriesData.genres?.map((g) => g.name) || [],
      production_companies: seriesData.production_companies?.map((c) => c.name) || [],
      production_countries: seriesData.production_countries?.map((c) => c.name) || [],
      spoken_languages: seriesData.spoken_languages?.map((l) => l.name) || [],
      first_air_date: seriesData.first_air_date || undefined,
      last_air_date: seriesData.last_air_date || undefined,
      status: seriesData.status || undefined,
      number_of_seasons: seriesData.number_of_seasons || undefined,
      number_of_episodes: seriesData.number_of_episodes || undefined,
      tmdb_score: seriesData.vote_average,
      vote_count: seriesData.vote_count,
      popularity: seriesData.popularity,
      created_by: (seriesData.created_by || []).map((c) => c.name) || [],
      cast: (seriesData.credits?.cast || []).slice(0, 8).map((c) => c.name) || [],
      original_name: seriesData.original_name || undefined,
    };

    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "series",
        content: contentDe,
        content_en: contentEn,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        youtubeVideos,
        status: finalStatus,
        tmdbId: seriesData.id,
        metadata: seriesMetadata,
        metaDescription: seoMeta?.metaDescription ?? null,
        metaKeywords: seoMeta?.metaKeywords ?? null,
        createdAt: seriesData.first_air_date ? new Date(seriesData.first_air_date) : new Date(),
      },
    });

    generateAndSaveCommentsForReview(review.id, {
      reviewTitle: reviewContent.de.title,
      score: reviewContent.score,
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "series",
    }).catch((e) => console.warn("Comment generation for series review failed:", e));

    generateAndAttachTagsForReview(review.id, {
      reviewTitle: reviewContent.de.title,
      category: "series",
      score: reviewContent.score,
      metadata: seriesData.genres ? { genres: seriesData.genres.map((g) => g.name) } : undefined,
      contentExcerpt: reviewContent.de.content?.substring(0, 500),
    }).catch((e) => console.warn("Tag generation for series review failed:", e));

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function generateSeriesReviewContent(
  seriesData: TMDBSeries,
  retryCount = 0,
  options?: { tavilySearchResults?: TavilySearchResponse }
): Promise<{
  de: { title: string; content: string; pros: string[]; cons: string[] };
  en: { title: string; content: string; pros: string[]; cons: string[] };
  score: number;
}> {
  const isRetry = retryCount > 0;

  // Use Tavily to gather factual review context (best-effort, non-blocking)
  let tavilySearchResults = options?.tavilySearchResults;
  if (!tavilySearchResults) {
    try {
      console.log(`🔍 Searching Tavily for series ${seriesData.name}...`);
      tavilySearchResults = await searchSeriesProduct(
        seriesData.name,
        seriesData.first_air_date ? new Date(seriesData.first_air_date).getFullYear() : undefined
      );
    } catch (error) {
      console.warn(`⚠️  Tavily search failed for ${seriesData.name}:`, error);
    }
  }

  const cast = (seriesData.credits?.cast || [])
    .slice(0, 8)
    .map((c) => (c.character ? `${c.name} als ${c.character}` : c.name));
  const creators = (seriesData.created_by || []).map((c) => c.name);
  const directors = (seriesData.credits?.crew || [])
    .filter((c) => c.job === "Director")
    .map((c) => c.name);
  const writers = (seriesData.credits?.crew || [])
    .filter((c) => ["Writer", "Screenplay", "Story", "Creator"].includes(c.job))
    .map((c) => c.name);

  const contextLines = [
    `Titel: ${seriesData.name}`,
    `Originaltitel: ${seriesData.original_name || "N/A"}`,
    `Genres: ${seriesData.genres?.map((g) => g.name).join(", ") || "N/A"}`,
    `Erstausstrahlung: ${seriesData.first_air_date || "N/A"}`,
    seriesData.status ? `Status: ${seriesData.status}` : "",
    seriesData.last_air_date ? `Letzte Ausstrahlung: ${seriesData.last_air_date}` : "",
    creators.length > 0 ? `Erdacht von / Creator: ${creators.slice(0, 5).join(", ")}` : "",
    `Regie: ${directors.slice(0, 5).join(", ") || "N/A"}`,
    `Autoren: ${[...new Set(writers)].slice(0, 5).join(", ") || "N/A"}`,
    cast.length > 0 ? `Besetzung: ${[...new Set(cast)].join(", ")}` : "",
    seriesData.number_of_seasons ? `Staffeln: ${seriesData.number_of_seasons}` : "",
    seriesData.number_of_episodes ? `Folgen: ${seriesData.number_of_episodes}` : "",
    seriesData.vote_average
      ? `TMDB-Bewertung: ${Number(seriesData.vote_average).toFixed(1)}/10 (${seriesData.vote_count || 0} Stimmen)`
      : "",
    seriesData.external_ids?.imdb_id ? `IMDb-ID: ${seriesData.external_ids.imdb_id}` : "",
    seriesData.production_companies?.length
      ? `Produktionsfirmen: ${seriesData.production_companies.map((c) => c.name).join(", ")}`
      : "",
    seriesData.production_countries?.length
      ? `Produktionsländer: ${seriesData.production_countries.map((c) => c.name).join(", ")}`
      : "",
    seriesData.spoken_languages?.length
      ? `Sprachen: ${seriesData.spoken_languages.map((l) => l.name).join(", ")}`
      : "",
    `Handlung: ${seriesData.overview || "N/A"}`,
    ...(tavilySearchResults ? buildResearchSummary(tavilySearchResults) : []),
  ].filter(Boolean);

  const sections: ReviewSection[] = [
    {
      de: "Einleitung",
      en: "Introduction",
      description: "Stimme den Leser ein: Worum geht es, warum ist die Serie relevant, Erwartungen.",
    },
    {
      de: "Handlung & Setting",
      en: "Plot & Setting",
      description: "Grundkonzept, Welt, Prämisse und Erzählstruktur – ohne zentrale Twists zu spoilern.",
    },
    {
      de: "Charaktere & Schauspiel",
      en: "Characters & Acting",
      description: "Cast, Figurenentwicklung und die Chemie im Ensemble.",
    },
    {
      de: "Staffeln & Episodenstruktur",
      en: "Seasons & Episode Structure",
      description: "Pacing, Staffelbögen, Füllmaterial und Dramaturgie über mehrere Folgen hinweg.",
    },
    {
      de: "Regie, Inszenierung & Bildsprache",
      en: "Direction, Cinematography & Visuals",
      description: "Kamera, Schnitt, Farbgebung und visueller Stil der Serie.",
    },
    {
      de: "Musik & Sounddesign",
      en: "Music & Sound Design",
      description: "Score, Titelsong, Sounddesign und deren atmosphärische Wirkung.",
    },
    {
      de: "Themen & Tiefe",
      en: "Themes & Depth",
      description: "Zentrale Themen, Erzähltiefe und gesellschaftliche Relevanz.",
    },
    {
      de: "Vergleich mit ähnlichen Serien",
      en: "Comparison with Similar Series",
      description: "Einordnung in das Genre und Vergleiche mit verwandten Serien.",
    },
    {
      de: "Binge-Würdigkeit",
      en: "Binge-worthiness",
      description: "Suchtfaktor, empfohlene Sehweise und ob sich das Warten auf neue Staffeln lohnt.",
    },
    {
      de: "Fazit",
      en: "Verdict",
      description: "Gesamturteil, Begründung des Scores und klare Empfehlung.",
    },
  ];

  const prompt = buildStructuredReviewPrompt({
    category: "series",
    itemName: seriesData.name,
    contextLines,
    sections,
    wordTarget: 1800,
    imageCount: 4,
    isRetry,
    referenceRating: seriesData.vote_average ? `${Number(seriesData.vote_average).toFixed(1)}/10` : undefined,
    scoreBand: seriesData.vote_average ? computeScoreBand(Number(seriesData.vote_average)) : undefined,
  });

  try {
    return await generateContent(prompt, seriesData.name, retryCount);
  } catch (error) {
    console.error(`Final error generating series content for ${seriesData.name}:`, error);
    const castNames = (seriesData.credits?.cast || []).slice(0, 5).map((c) => c.name);
    const creatorNames = (seriesData.created_by || []).map((c) => c.name);
    const fallbackPlotDe = seriesData.overview
      ? "Die Serie entwickelt ihre Prämisse über mehrere Staffeln und erzählt ihre Geschichte mit einem klaren Spannungsbogen.\n\n"
      : "";
    const fallbackPlotEn = seriesData.overview
      ? "The series develops its premise across multiple seasons and tells its story with a clear dramatic arc.\n\n"
      : "";
    const castLineDe = castNames.length > 0
      ? `Das Ensemble um ${castNames.join(", ")} trägt die Serie mit überzeugenden Leistungen.`
      : "Das Ensemble trägt die Serie mit überzeugenden Leistungen.";
    const castLineEn = castNames.length > 0
      ? `The ensemble, led by ${castNames.join(", ")}, carries the series with compelling performances.`
      : "The ensemble carries the series with compelling performances.";
    const creatorLineDe = creatorNames.length > 0
      ? `Als Creator sind ${creatorNames.join(", ")} für die kreative Ausrichtung verantwortlich.\n\n`
      : "";
    const creatorLineEn = creatorNames.length > 0
      ? `Created by ${creatorNames.join(", ")}, the series benefits from a clear creative vision.\n\n`
      : "";
    return {
      de: {
        title: seriesData.name,
        content: `## Einleitung\n\n${seriesData.overview || "Keine Beschreibung verfügbar."}\n\n## Handlung & Setting\n\n${fallbackPlotDe}## Charaktere & Schauspiel\n\n${castLineDe}\n\n${creatorLineDe}## Fazit\n\nEine sehenswerte Serie, die es wert ist, genauer betrachtet zu werden.`,
        pros: ["Spannende Handlung", "Gutes Ensemble", "Starke Inszenierung", "Atmosphärischer Score", "Interessante Themen"],
        cons: ["Einige Längen", "Manche Nebenhandlungen wirken aufgesetzt", "Vorhersehbare Twists", "Pacing schwankt zwischen Staffeln", "Endet etwas abrupt"],
      },
      en: {
        title: seriesData.name,
        content: `## Introduction\n\n${seriesData.overview || "No description available."}\n\n## Plot & Setting\n\n${fallbackPlotEn}## Characters & Acting\n\n${castLineEn}\n\n${creatorLineEn}## Conclusion\n\nA worthwhile series that deserves a closer look.`,
        pros: ["Engaging plot", "Strong ensemble cast", "Solid direction", "Atmospheric score", "Interesting themes"],
        cons: ["Some pacing issues", "Some subplots feel tacked on", "Predictable twists", "Pacing varies between seasons", "Ends somewhat abruptly"],
      },
      score: 70,
    };
  }
}

/**
 * Regenerate a review that has score=0 and is older than 30 days.
 * Fetches fresh data from IGDB/TMDB and updates the review in-place.
 */
export async function regenerateZeroScoreReview(
  reviewId: string
): Promise<{ success: boolean; newScore?: number; error?: string }> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      igdbId: true,
      tmdbId: true,
      score: true,
      images: true,
      createdAt: true,
      releaseDate: true,
    },
  });

  if (!review) return { success: false, error: "Review not found" };
  if (review.score !== 0) return { success: false, error: "Review score is not 0" };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (review.createdAt > thirtyDaysAgo) {
    return { success: false, error: "Review is not older than 30 days" };
  }

  if (review.releaseDate) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    if (review.releaseDate > oneDayAgo) {
      return { success: false, error: "Release date +1 day has not passed yet" };
    }
  }

  let generated:
    | {
        de: { title: string; content: string; pros: string[]; cons: string[] };
        en: { title: string; content: string; pros: string[]; cons: string[] };
        score: number;
      }
    | undefined;

  if (review.category === "game" && review.igdbId) {
    const gameData = await getIGDBGameById(review.igdbId);
    if (!gameData) return { success: false, error: "IGDB game not found" };

    let storeIds: {
      steamAppId?: string;
      epicId?: string;
      gogId?: string;
    } = {};
    try {
      const { findStoreIds } = await import("./store-search");
      storeIds = await findStoreIds(gameData.name, gameData.id);
    } catch {
      // Non-blocking
    }

    let steamData: SteamGameInfo | null = null;
    if (storeIds.steamAppId) {
      try {
        const { getSteamAppDetails, getSteamReviewSummary } = await import("./steam");
        const [details, reviews] = await Promise.allSettled([
          getSteamAppDetails(storeIds.steamAppId),
          getSteamReviewSummary(storeIds.steamAppId),
        ]);
        if (details.status === "fulfilled" && details.value) {
          steamData = details.value;
          if (reviews.status === "fulfilled" && reviews.value) {
            steamData.reviewSummary = reviews.value;
          }
        }
      } catch {
        // Non-blocking
      }
    }

    generated = await generateReviewContent(gameData, 0, { steamData });

    // Re-upload images if needed
    const imageUrls: string[] = [];
    if (gameData.cover?.url) {
      try {
        const coverUrl = gameData.cover.url.startsWith("//")
          ? "https:" + gameData.cover.url
          : gameData.cover.url;
        const highResCoverUrl = coverUrl.replace("t_thumb", "t_720p");
        const syncedUrl = await uploadImage(highResCoverUrl, `${review.slug}-cover.jpg`);
        imageUrls.push(syncedUrl);
      } catch {
        imageUrls.push(gameData.cover.url.replace("t_thumb", "t_720p"));
      }
    }
    if (gameData.screenshots && gameData.screenshots.length > 0) {
      const screenshotUrls = gameData.screenshots.slice(0, 5).map((s: any) =>
        s.url.startsWith("//")
          ? "https:" + s.url.replace("t_thumb", "t_1080p")
          : s.url.replace("t_thumb", "t_1080p")
      );
      for (let i = 0; i < screenshotUrls.length; i++) {
        try {
          const syncedUrl = await uploadImage(screenshotUrls[i], `${review.slug}-screen-${i + 1}.jpg`);
          imageUrls.push(syncedUrl);
        } catch {
          imageUrls.push(screenshotUrls[i]);
        }
      }
    }

    const imagesToUse = imageUrls.length > 0 ? imageUrls : review.images;
    const contentDe = replaceImagePlaceholders(generated.de.content, imagesToUse, review.title);
    const contentEn = replaceImagePlaceholders(generated.en.content, imagesToUse, review.title);

    let seoMeta: { metaDescription: string; metaKeywords: string } | null = null;
    try {
      seoMeta = await generateSEOMetadata(generated.de.title, contentDe, "game");
    } catch {
      // Non-blocking
    }

    await prisma.review.update({
      where: { id: review.id },
      data: {
        title: generated.de.title,
        title_en: generated.en.title,
        content: contentDe,
        content_en: contentEn,
        score: generated.score,
        pros: generated.de.pros,
        pros_en: generated.en.pros,
        cons: generated.de.cons,
        cons_en: generated.en.cons,
        images: imagesToUse,
        metaDescription: seoMeta?.metaDescription ?? null,
        metaKeywords: seoMeta?.metaKeywords ?? null,
      },
    });

    generateAndSaveCommentsForReview(review.id, {
      reviewTitle: generated.de.title,
      score: generated.score,
      pros: generated.de.pros,
      cons: generated.de.cons,
      category: "game",
    }).catch((e) => console.warn("Comment regeneration failed:", e));

    generateAndAttachTagsForReview(review.id, {
      reviewTitle: generated.de.title,
      category: "game",
      score: generated.score,
      contentExcerpt: generated.de.content?.substring(0, 500),
    }).catch((e) => console.warn("Tag regeneration failed:", e));

    return { success: true, newScore: generated.score };
  }

  if (review.category === "movie" && review.tmdbId) {
    const movieData = await getTMDBMovieById(review.tmdbId);
    if (!movieData) return { success: false, error: "TMDB movie not found" };

    generated = await generateMovieReviewContent(movieData);

    const imagesToUse = review.images;
    const contentDe = replaceImagePlaceholders(generated.de.content, imagesToUse, review.title);
    const contentEn = replaceImagePlaceholders(generated.en.content, imagesToUse, review.title);

    let seoMeta: { metaDescription: string; metaKeywords: string } | null = null;
    try {
      seoMeta = await generateSEOMetadata(generated.de.title, contentDe, "movie");
    } catch {
      // Non-blocking
    }

    await prisma.review.update({
      where: { id: review.id },
      data: {
        title: generated.de.title,
        title_en: generated.en.title,
        content: contentDe,
        content_en: contentEn,
        score: generated.score,
        pros: generated.de.pros,
        pros_en: generated.en.pros,
        cons: generated.de.cons,
        cons_en: generated.en.cons,
        metaDescription: seoMeta?.metaDescription ?? null,
        metaKeywords: seoMeta?.metaKeywords ?? null,
      },
    });

    generateAndSaveCommentsForReview(review.id, {
      reviewTitle: generated.de.title,
      score: generated.score,
      pros: generated.de.pros,
      cons: generated.de.cons,
      category: "movie",
    }).catch((e) => console.warn("Comment regeneration failed:", e));

    generateAndAttachTagsForReview(review.id, {
      reviewTitle: generated.de.title,
      category: "movie",
      score: generated.score,
      contentExcerpt: generated.de.content?.substring(0, 500),
    }).catch((e) => console.warn("Tag regeneration failed:", e));

    return { success: true, newScore: generated.score };
  }

  if (review.category === "series" && review.tmdbId) {
    const seriesData = await getTMDBSeriesById(review.tmdbId);
    if (!seriesData) return { success: false, error: "TMDB series not found" };

    generated = await generateSeriesReviewContent(seriesData);

    const imagesToUse = review.images;
    const contentDe = replaceImagePlaceholders(generated.de.content, imagesToUse, review.title);
    const contentEn = replaceImagePlaceholders(generated.en.content, imagesToUse, review.title);

    let seoMeta: { metaDescription: string; metaKeywords: string } | null = null;
    try {
      seoMeta = await generateSEOMetadata(generated.de.title, contentDe, "series");
    } catch {
      // Non-blocking
    }

    await prisma.review.update({
      where: { id: review.id },
      data: {
        title: generated.de.title,
        title_en: generated.en.title,
        content: contentDe,
        content_en: contentEn,
        score: generated.score,
        pros: generated.de.pros,
        pros_en: generated.en.pros,
        cons: generated.de.cons,
        cons_en: generated.en.cons,
        metaDescription: seoMeta?.metaDescription ?? null,
        metaKeywords: seoMeta?.metaKeywords ?? null,
      },
    });

    generateAndSaveCommentsForReview(review.id, {
      reviewTitle: generated.de.title,
      score: generated.score,
      pros: generated.de.pros,
      cons: generated.de.cons,
      category: "series",
    }).catch((e) => console.warn("Comment regeneration failed:", e));

    generateAndAttachTagsForReview(review.id, {
      reviewTitle: generated.de.title,
      category: "series",
      score: generated.score,
      contentExcerpt: generated.de.content?.substring(0, 500),
    }).catch((e) => console.warn("Tag regeneration failed:", e));

    return { success: true, newScore: generated.score };
  }

  return { success: false, error: `Unsupported category or missing ID: ${review.category}` };
}
