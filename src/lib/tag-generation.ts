/**
 * Automatic tag generation for reviews based on metadata, content, and score.
 * Creates or finds Tags and links them via ReviewTag.
 */

import prisma from "@/lib/prisma";
import openai, { OPENAI_MODEL } from "@/lib/openai";

const MAX_TAGS_PER_REVIEW = 8;
const MAX_OPENAI_TAGS = 5;

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface GenerateTagsInput {
  reviewTitle: string;
  category: string;
  score: number;
  metadata?: {
    genres?: string[];
    platforms?: string[];
    developers?: string[];
    publishers?: string[];
    [key: string]: unknown;
  };
  contentExcerpt?: string; // First ~500 chars of content for keyword extraction
}

/**
 * Derive tag names from metadata (genres, platforms, etc.) and score.
 */
function tagsFromMetadata(input: GenerateTagsInput): string[] {
  const names: string[] = [];
  const meta = input.metadata || {};

  if (Array.isArray(meta.genres) && meta.genres.length > 0) {
    names.push(...meta.genres.slice(0, 4));
  }
  if (Array.isArray(meta.platforms) && meta.platforms.length > 0) {
    // Add one platform as tag (e.g. "PC", "PlayStation 5")
    const platform = meta.platforms[0];
    if (platform && !names.includes(platform)) {
      names.push(platform);
    }
  }

  // Score-based tags
  if (input.score >= 90) names.push("Must-Have");
  else if (input.score >= 80) names.push("Empfehlung");
  else if (input.score >= 70) names.push("Solide");
  else if (input.score < 50) names.push("Kritisch");

  return [...new Set(names)].slice(0, MAX_TAGS_PER_REVIEW);
}

/**
 * Use OpenAI to extract a few additional tags from title and content excerpt.
 */
async function tagsFromContent(input: GenerateTagsInput): Promise<string[]> {
  if (!input.contentExcerpt && !input.reviewTitle) return [];

  try {
    const prompt = `Erstelle 2 bis ${MAX_OPENAI_TAGS} kurze Schlagwörter (Tags) auf Deutsch oder Englisch für folgende Review. Nur einzelne Wörter oder kurze Phrasen (z.B. "Open World", "Multiplayer", "Story", "Action").
Review-Titel: ${input.reviewTitle}
Kategorie: ${input.category}
${input.contentExcerpt ? `Auszug: ${input.contentExcerpt.substring(0, 400)}` : ""}

Antworte NUR mit einem JSON-Objekt: { "tags": ["Tag1", "Tag2", ...] }
Keine Erklärung.`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 200,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "")) as { tags?: string[] };
    const tags = Array.isArray(parsed.tags) ? parsed.tags : [];
    return tags.slice(0, MAX_OPENAI_TAGS);
  } catch (error) {
    console.warn("Tag extraction from content failed:", error);
    return [];
  }
}

/**
 * Ensure a Tag exists by name; create if missing. Returns Tag id.
 */
async function findOrCreateTag(name: string, category?: string): Promise<string> {
  const slug = slugFromName(name);
  if (!slug || slug.length < 2) return "";

  const existing = await prisma.tag.findFirst({
    where: { OR: [{ name: { equals: name, mode: "insensitive" } }, { slug }] },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.tag.create({
    data: {
      name: name.trim(),
      slug: slug.length > 0 ? slug : `tag-${Date.now().toString(36)}`,
      category: category || null,
    },
    select: { id: true },
  });
  return created.id;
}

/**
 * Generate tag names for a review (metadata + optional content-based), then create/link Tags.
 */
export async function generateAndAttachTagsForReview(
  reviewId: string,
  input: GenerateTagsInput
): Promise<void> {
  try {
    const fromMeta = tagsFromMetadata(input);
    const fromContent = await tagsFromContent(input);
    const allNames = [...new Set([...fromMeta, ...fromContent])]
      .map((n) => String(n).trim())
      .filter((n) => n.length > 0 && n.length <= 50)
      .slice(0, MAX_TAGS_PER_REVIEW);

    if (allNames.length === 0) return;

    const tagIds: string[] = [];
    for (const name of allNames) {
      const tagId = await findOrCreateTag(name, input.category);
      if (tagId && !tagIds.includes(tagId)) tagIds.push(tagId);
    }

    if (tagIds.length === 0) return;

    await prisma.reviewTag.createMany({
      data: tagIds.map((tagId) => ({ reviewId, tagId })),
      skipDuplicates: true,
    });
  } catch (error) {
    console.warn("Tag generation for review failed:", reviewId, error);
  }
}
