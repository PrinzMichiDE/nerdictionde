export interface ReviewWithTags {
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  category: string;
  score: number;
  content: string;
  content_en: string | null;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ tag: { name: string; slug: string } }>;
  seriesId: string | null;
  seriesOrder: number | null;
  series: { id: string; slug: string; title: string; type: string; visibility: string; ownerId: string | null } | null;
}

/**
 * Scores reviews by relevance to a search query.
 * Scoring weights:
 * - Title exact match: 100
 * - Title starts with term: 50
 * - Title contains term: 25
 * - English title exact match: 100
 * - English title starts with term: 50
 * - English title contains term: 25
 * - Tag exact match: 30
 * - Tag partial match: 15
 * - Content match: 5
 * - Content word boundary match: 3
 * - Editorial score tiebreaker: score / 100
 */
export function scoreRelevance(reviews: ReviewWithTags[], query: string): ReviewWithTags[] {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 1);
  if (terms.length === 0) return reviews;

  const scored = reviews.map((review) => {
    let score = 0;
    const title = (review.title || "").toLowerCase();
    const titleEn = (review.title_en || "").toLowerCase();
    const content = (review.content || "").toLowerCase();
    const contentEn = (review.content_en || "").toLowerCase();
    const tagNames = review.tags.map((t) => t.tag.name.toLowerCase());
    const tagSlugs = review.tags.map((t) => t.tag.slug.toLowerCase());

    for (const term of terms) {
      // Title exact match (highest weight)
      if (title === term || titleEn === term) score += 100;
      // Title starts with term
      else if (title.startsWith(term) || titleEn.startsWith(term)) score += 50;
      // Title contains term
      else if (title.includes(term) || titleEn.includes(term)) score += 25;

      // Tag exact match (high weight)
      if (tagNames.includes(term) || tagSlugs.includes(term)) score += 30;
      // Tag partial match
      else if (tagNames.some((t) => t.includes(term)) || tagSlugs.some((t) => t.includes(term))) score += 15;

      // Content match (lower weight)
      if (content.includes(term) || contentEn.includes(term)) score += 5;

      // Word boundary matches in content (bonus)
      const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, "i");
      if (wordBoundaryRegex.test(content) || wordBoundaryRegex.test(contentEn)) score += 3;
    }

    // Tiebreaker: higher editorial score wins
    score += (review.score || 0) / 100;

    return { review, relevanceScore: score };
  });

  // Sort by relevance score descending
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scored.map((s) => s.review);
}