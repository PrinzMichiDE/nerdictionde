import openai, { OPENAI_MODEL } from "@/lib/openai";
import { generateFakeName } from "@/lib/fake-names";
import prisma from "@/lib/prisma";

const MIN_COMMENTS = 3;
const MAX_COMMENTS = 10;
const MAX_RETRIES = 2;

export interface GenerateCommentsInput {
  reviewTitle: string;
  score: number;
  pros: string[];
  cons: string[];
  category?: string;
  count?: number;
}

export interface GeneratedComment {
  text: string;
  author: string;
}

/**
 * Returns sentiment distribution based on review score.
 * Higher score -> more positive, lower score -> more critical.
 */
function getSentimentDistribution(score: number): {
  positive: number;
  neutral: number;
  critical: number;
} {
  if (score >= 90) return { positive: 0.7, neutral: 0.2, critical: 0.1 };
  if (score >= 70) return { positive: 0.5, neutral: 0.3, critical: 0.2 };
  if (score >= 50) return { positive: 0.3, neutral: 0.4, critical: 0.3 };
  return { positive: 0.1, neutral: 0.3, critical: 0.6 };
}

/**
 * Generates realistic community comments for a review using OpenAI.
 * Comments are in German, 20–150 words, with sentiment distribution based on score.
 * Authors are assigned via generateFakeName (no duplicates per batch).
 */
export async function generateComments(
  input: GenerateCommentsInput,
  retryCount = 0
): Promise<GeneratedComment[]> {
  const count = Math.min(
    MAX_COMMENTS,
    Math.max(MIN_COMMENTS, input.count ?? MIN_COMMENTS + Math.floor(Math.random() * (MAX_COMMENTS - MIN_COMMENTS + 1)))
  );
  const dist = getSentimentDistribution(input.score);
  const category = input.category ?? "Produkt";

  const prompt = `Erstelle genau ${count} realistische Community-Kommentare auf Deutsch zu folgender Review.

Review-Titel: ${input.reviewTitle}
Kategorie: ${category}
Bewertung (Score 0–100): ${input.score}

Pro-Punkte: ${input.pros.length ? input.pros.slice(0, 5).join("; ") : "–"}
Contra-Punkte: ${input.cons.length ? input.cons.slice(0, 5).join("; ") : "–"}

Verteilung der Meinungen (Anteile):
- Positiv: ${Math.round(dist.positive * 100)}%
- Neutral: ${Math.round(dist.neutral * 100)}%
- Kritisch: ${Math.round(dist.critical * 100)}%

Anforderungen:
- Jeder Kommentar 20–150 Wörter, natürlich und authentisch.
- Kommentare beziehen sich auf konkrete Aspekte der Review (Pros/Cons, Score, Kategorie).
- Verschiedene Längen und Stile (kurz bestätigend, ausführlich, Frage, persönliche Erfahrung).
- Keine Beleidigungen, keine Markennamen erfinden.
- Antworte NUR mit einem JSON-Objekt im Format: { "comments": [ "Kommentartext 1", "Kommentartext 2", ... ] }
- Keine Autorennamen im JSON – nur die Texte unter "comments".`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = parseCommentJson(raw);
    const texts: string[] = Array.isArray(parsed.comments) ? parsed.comments.slice(0, count) : [];

    const usedNames = new Set<string>();
    const comments: GeneratedComment[] = texts.map((text) => {
      let author = generateFakeName();
      while (usedNames.has(author)) author = generateFakeName();
      usedNames.add(author);
      return { text: String(text).trim(), author };
    });

    return comments;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`Comment generation failed, retry ${retryCount + 1}/${MAX_RETRIES}:`, error);
      return generateComments(input, retryCount + 1);
    }
    console.error("Comment generation failed after retries:", error);
    throw error;
  }
}

function parseCommentJson(raw: string): { comments?: string[] } {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const str = match ? match[0] : cleaned;
  try {
    return JSON.parse(str) as { comments?: string[] };
  } catch {
    return {};
  }
}

/**
 * Generates AI comments for a review and saves them to the database.
 * Does not throw; logs errors so review creation is never blocked.
 */
export async function generateAndSaveCommentsForReview(
  reviewId: string,
  input: Omit<GenerateCommentsInput, "count">
): Promise<void> {
  try {
    const comments = await generateComments(input);
    if (comments.length === 0) return;
    await prisma.comment.createMany({
      data: comments.map((c) => ({ reviewId, text: c.text, author: c.author })),
    });
  } catch (e) {
    console.warn("Comment generation failed for review", reviewId, e);
  }
}
