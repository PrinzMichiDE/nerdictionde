/**
 * Generate SEO metadata (meta description, keywords) for reviews.
 */

import openai, { OPENAI_MODEL } from "@/lib/openai";

const META_DESC_MAX_LENGTH = 160;
const META_DESC_MIN_LENGTH = 120;

/**
 * Strip markdown and truncate for a quick plain-text description.
 */
function plainTextFromMarkdown(md: string, maxLen: number): string {
  const plain = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~`]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length <= maxLen ? plain : plain.substring(0, maxLen - 3) + "...";
}

export interface SEOMetadataResult {
  metaDescription: string;
  metaKeywords: string;
}

/**
 * Generate meta description (150-160 chars) and comma-separated keywords from review title and content.
 */
export async function generateSEOMetadata(
  title: string,
  content: string,
  category?: string
): Promise<SEOMetadataResult> {
  const fallbackDesc = plainTextFromMarkdown(content, META_DESC_MAX_LENGTH);
  const fallbackKeywords = `${title}, Review, ${category || "Produkt"}`;

  try {
    const prompt = `Erstelle SEO-Metadaten für folgende Review (nur Deutsch).
Titel: ${title}
Kategorie: ${category || "Produkt"}
Auszug: ${content.substring(0, 600)}

Antworte NUR mit einem JSON-Objekt:
{
  "metaDescription": "Eine prägnante Beschreibung in 150-160 Zeichen für Suchmaschinen (ohne Anführungszeichen im Text).",
  "metaKeywords": "Stichwort1, Stichwort2, Stichwort3, ... (5-10 relevante Begriffe, kommagetrennt)"
}
Keine Erklärung.`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    interface ParsedSEO {
      metaDescription?: string;
      metaKeywords?: string;
    }
    const parsed: ParsedSEO = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, ""));

    const metaDescription =
      typeof parsed.metaDescription === "string" && parsed.metaDescription.length >= META_DESC_MIN_LENGTH
        ? parsed.metaDescription.substring(0, META_DESC_MAX_LENGTH).trim()
        : fallbackDesc;
    const metaKeywords =
      typeof parsed.metaKeywords === "string" && parsed.metaKeywords.length > 0
        ? parsed.metaKeywords.substring(0, 500).trim()
        : fallbackKeywords;

    return { metaDescription, metaKeywords };
  } catch (error) {
    console.warn("SEO metadata generation failed:", error);
    return {
      metaDescription: fallbackDesc,
      metaKeywords: fallbackKeywords,
    };
  }
}
