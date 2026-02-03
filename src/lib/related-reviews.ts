/**
 * Find related reviews by category, score, and shared tags.
 */

import prisma from "@/lib/prisma";

const DEFAULT_TAKE = 6;
const SCORE_DELTA = 15;

export interface RelatedReviewInput {
  reviewId: string;
  category: string;
  score: number;
  tagIds?: string[];
  metadataGenres?: string[];
}

/**
 * Find related reviews: same category, similar score, prefer shared tags.
 * Returns review IDs in order of relevance (tag overlap first, then score similarity).
 */
export async function findRelatedReviews(
  input: RelatedReviewInput,
  take = DEFAULT_TAKE
): Promise<string[]> {
  const { reviewId, category, score, tagIds = [], metadataGenres = [] } = input;

  // Same category, published, exclude self, similar score
  const scoreMin = Math.max(0, score - SCORE_DELTA);
  const scoreMax = Math.min(100, score + SCORE_DELTA);

  const candidates = await prisma.review.findMany({
    where: {
      id: { not: reviewId },
      category,
      status: "published",
      score: { gte: scoreMin, lte: scoreMax },
    },
    select: {
      id: true,
      score: true,
      tags: { select: { tagId: true } },
      metadata: true,
    },
    take: take * 3, // fetch more to sort by relevance
    orderBy: { createdAt: "desc" },
  });

  const currentTagSet = new Set(tagIds);
  const currentGenreSet = new Set(
    metadataGenres.map((g) => String(g).toLowerCase().trim())
  );

  const withScore = candidates.map((r) => {
    const sharedTags = r.tags.filter((t) => currentTagSet.has(t.tagId)).length;
    const meta = (r.metadata as { genres?: string[] }) || {};
    const genres = (meta.genres || []).map((g) => String(g).toLowerCase().trim());
    const sharedGenres = genres.filter((g) => currentGenreSet.has(g)).length;
    const scoreDiff = Math.abs(r.score - score);
    return {
      id: r.id,
      sharedTags,
      sharedGenres,
      scoreDiff,
    };
  });

  // Sort: more shared tags first, then shared genres, then closer score, then recent
  withScore.sort((a, b) => {
    if (b.sharedTags !== a.sharedTags) return b.sharedTags - a.sharedTags;
    if (b.sharedGenres !== a.sharedGenres) return b.sharedGenres - a.sharedGenres;
    return a.scoreDiff - b.scoreDiff;
  });

  return withScore.slice(0, take).map((r) => r.id);
}

/**
 * Load full reviews by IDs (preserving order). Skips missing IDs.
 */
export async function getReviewsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const reviews = await prisma.review.findMany({
    where: { id: { in: ids }, status: "published" },
    select: {
      id: true,
      title: true,
      title_en: true,
      slug: true,
      category: true,
      score: true,
      content: true,
      images: true,
      createdAt: true,
    },
  });
  const orderMap = new Map(ids.map((id, i) => [id, i]));
  return reviews.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
}
