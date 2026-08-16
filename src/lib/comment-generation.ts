import openai, { OPENAI_MODEL } from "@/lib/openai";
import { generateFakeName } from "@/lib/fake-names";
import prisma from "@/lib/prisma";

const MIN_COMMENTS = 200;
const MAX_COMMENTS = 300;
const CHUNK_SIZE = 12;
const MAX_RETRIES = 2;
const CONCURRENCY = 3;
const MAX_TOPUP_ATTEMPTS = 3;

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

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
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

function buildChunkPrompt(
  input: GenerateCommentsInput,
  chunkCount: number,
  chunkIndex: number,
  chunkTotal: number
): string {
  const dist = getSentimentDistribution(input.score);
  const category = input.category ?? "Produkt";

  return `Erstelle genau ${chunkCount} realistische, untereinander unterschiedliche Community-Kommentare auf Deutsch zu folgender Review (Batch ${chunkIndex} von ${chunkTotal}).

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
- Alle Kommentare dieses Batches inhaltlich klar voneinander abgrenzen: andere Aspekte, andere Perspektiven, andere Nutzer-Typen.
- Keine Sätze oder Formulierungen wiederholen, weder innerhalb des Batches noch über Batches hinweg.
- Keine Beleidigungen, keine Markennamen erfinden.
- Antworte NUR mit einem JSON-Objekt im Format: { "comments": [ "Kommentartext 1", "Kommentartext 2", ... ] }
- Keine Autorennamen im JSON – nur die Texte unter "comments".`;
}

async function generateChunkTexts(
  input: GenerateCommentsInput,
  chunkCount: number,
  chunkIndex: number,
  chunkTotal: number,
  retryCount: number
): Promise<string[]> {
  const prompt = buildChunkPrompt(input, chunkCount, chunkIndex, chunkTotal);

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = parseCommentJson(raw);
    const texts: string[] = Array.isArray(parsed.comments)
      ? parsed.comments.slice(0, chunkCount).map((t) => String(t).trim()).filter(Boolean)
      : [];

    return texts;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`Comment batch ${chunkIndex}/${chunkTotal} failed, retry ${retryCount + 1}/${MAX_RETRIES}:`, error);
      return generateChunkTexts(input, chunkCount, chunkIndex, chunkTotal, retryCount + 1);
    }
    console.error(`Comment batch ${chunkIndex}/${chunkTotal} failed after retries:`, error);
    throw error;
  }
}

function dedupeTexts(texts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const text of texts) {
    const key = text.toLocaleLowerCase("de").replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function assignAuthors(texts: string[]): GeneratedComment[] {
  const usedNames = new Set<string>();
  return texts.map((text) => {
    let author = generateFakeName();
    while (usedNames.has(author)) author = generateFakeName();
    usedNames.add(author);
    return { text, author };
  });
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
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
 * Generates realistic community comments for a review using OpenAI.
 * Comments are in German, 20–150 words, with sentiment distribution based on score.
 * Defaults to a random count between 200 and 300 (configurable via input.count).
 * Generation is chunked and run with limited concurrency so large batches stay reliable.
 * Authors are assigned via generateFakeName (unique per batch).
 */
export async function generateComments(
  input: GenerateCommentsInput,
  retryCount = 0
): Promise<GeneratedComment[]> {
  const count = Math.min(
    MAX_COMMENTS,
    Math.max(MIN_COMMENTS, input.count ?? randomInt(MIN_COMMENTS, MAX_COMMENTS))
  );
  // Slightly over-generate so deduplication does not drop us below the target.
  const target = Math.min(MAX_COMMENTS, count + Math.ceil(count * 0.2));

  const chunkCounts: number[] = [];
  let remaining = target;
  while (remaining > 0) {
    const n = Math.min(CHUNK_SIZE, remaining);
    chunkCounts.push(n);
    remaining -= n;
  }

  const allChunks = await mapWithConcurrency(chunkCounts, CONCURRENCY, async (n, i) => {
    try {
      return await generateChunkTexts(input, n, i + 1, chunkCounts.length, retryCount);
    } catch (error) {
      console.error(`Comment batch ${i + 1}/${chunkCounts.length} failed permanently:`, error);
      return [] as string[];
    }
  });

  let texts = dedupeTexts(allChunks.flat());

  // Top up if deduplication or failed batches left us short of the target.
  let attempts = 0;
  while (texts.length < count && attempts < MAX_TOPUP_ATTEMPTS) {
    attempts++;
    const shortfall = count - texts.length;
    const extraCounts: number[] = [];
    let remainingShortfall = shortfall;
    while (remainingShortfall > 0) {
      const n = Math.min(CHUNK_SIZE, remainingShortfall);
      extraCounts.push(n);
      remainingShortfall -= n;
    }
    try {
      const extraChunks = await mapWithConcurrency(extraCounts, CONCURRENCY, async (n, i) =>
        generateChunkTexts(input, n, chunkCounts.length + attempts + i + 1, chunkCounts.length + attempts + extraCounts.length, 0)
      );
      texts = dedupeTexts([...texts, ...extraChunks.flat()]);
    } catch (error) {
      console.error("Top-up comment generation failed:", error);
      break;
    }
  }

  return assignAuthors(texts.slice(0, count));
}

/**
 * Generates AI comments for a review and saves them to the database.
 * Defaults to 200–300 comments per review.
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
