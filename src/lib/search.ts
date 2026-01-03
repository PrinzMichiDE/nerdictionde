import { Review } from "@/types/review";
import { extractTags } from "./tags";

/**
 * Advanced search functionality
 * Supports full-text search with highlighting and suggestions
 */

export interface SearchResult {
  review: Review;
  score: number;
  highlights: {
    field: string;
    text: string;
    matches: Array<{ start: number; end: number }>;
  }[];
}

/**
 * Perform full-text search on reviews
 */
export function searchReviews(
  reviews: Review[],
  query: string,
  options: {
    limit?: number;
    highlight?: boolean;
    fields?: string[];
  } = {}
): SearchResult[] {
  const { limit = 50, highlight = true, fields = ["title", "content", "title_en", "content_en"] } = options;

  if (!query.trim()) {
    return reviews.slice(0, limit).map((review) => ({
      review,
      score: 0,
      highlights: [],
    }));
  }

  const searchTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  const results: SearchResult[] = [];

  for (const review of reviews) {
    let score = 0;
    const highlights: SearchResult["highlights"] = [];

    // Search in specified fields
    for (const field of fields) {
      const value = (review as any)[field];
      if (!value || typeof value !== "string") continue;

      const lowerValue = value.toLowerCase();
      let fieldScore = 0;
      const matches: Array<{ start: number; end: number }> = [];

      for (const term of searchTerms) {
        const index = lowerValue.indexOf(term);
        if (index !== -1) {
          // Exact match gets higher score
          const isExactMatch = lowerValue === term;
          fieldScore += isExactMatch ? 10 : 1;

          // Find all occurrences
          let searchIndex = 0;
          while ((searchIndex = lowerValue.indexOf(term, searchIndex)) !== -1) {
            matches.push({
              start: searchIndex,
              end: searchIndex + term.length,
            });
            searchIndex += term.length;
          }
        }
      }

      if (fieldScore > 0) {
        score += fieldScore;

        if (highlight && matches.length > 0) {
          // Generate highlighted text
          let highlightedText = value;
          const sortedMatches = matches.sort((a, b) => b.start - a.start);

          for (const match of sortedMatches) {
            const before = highlightedText.substring(0, match.start);
            const matched = highlightedText.substring(match.start, match.end);
            const after = highlightedText.substring(match.end);
            highlightedText = `${before}<mark class="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">${matched}</mark>${after}`;
          }

          highlights.push({
            field,
            text: highlightedText,
            matches,
          });
        }
      }
    }

    // Boost score for tag matches
    const reviewTags = extractTags(review);
    for (const tag of reviewTags) {
      if (searchTerms.some((term) => tag.toLowerCase().includes(term))) {
        score += 5;
      }
    }

    // Boost score for category match
    if (searchTerms.some((term) => review.category.toLowerCase().includes(term))) {
      score += 3;
    }

    if (score > 0) {
      results.push({
        review,
        score,
        highlights,
      });
    }
  }

  // Sort by score and limit
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get search suggestions based on query
 */
export function getSearchSuggestions(
  reviews: Review[],
  query: string,
  limit: number = 5
): string[] {
  if (!query.trim() || query.length < 2) return [];

  const lowerQuery = query.toLowerCase();
  const suggestions = new Set<string>();

  // Extract suggestions from titles
  for (const review of reviews) {
    const title = review.title.toLowerCase();
    if (title.includes(lowerQuery)) {
      // Extract the matching part and a bit more context
      const index = title.indexOf(lowerQuery);
      const suggestion = review.title.substring(
        Math.max(0, index - 10),
        Math.min(review.title.length, index + lowerQuery.length + 20)
      );
      if (suggestion.length > lowerQuery.length) {
        suggestions.add(suggestion.trim());
      }
    }

    if (suggestions.size >= limit) break;
  }

  // Add tag suggestions
  const allTags = new Set<string>();
  reviews.forEach((review) => {
    extractTags(review).forEach((tag) => allTags.add(tag));
  });

  for (const tag of allTags) {
    if (tag.toLowerCase().includes(lowerQuery)) {
      suggestions.add(tag);
      if (suggestions.size >= limit) break;
    }
  }

  return Array.from(suggestions).slice(0, limit);
}

/**
 * Extract keywords from text for better search
 */
export function extractKeywords(text: string): string[] {
  // Remove markdown and special characters
  const cleanText = text
    .replace(/[#*`\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  // Common stop words in German and English
  const stopWords = new Set([
    "der", "die", "das", "und", "oder", "ist", "sind", "war", "waren",
    "the", "a", "an", "and", "or", "is", "are", "was", "were",
    "ein", "eine", "einen", "einer", "einem",
    "für", "von", "zu", "mit", "auf", "in", "an",
    "for", "of", "to", "with", "on", "in", "at",
  ]);

  const words = cleanText.split(/\s+/).filter(
    (word) => word.length > 3 && !stopWords.has(word)
  );

  // Count word frequency
  const wordCounts = new Map<string, number>();
  words.forEach((word) => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  });

  // Return top keywords
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
