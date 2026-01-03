import { Review } from "@/types/review";

/**
 * Extract tags from review metadata and content
 * No database changes - tags are derived from existing data
 */
export function extractTags(review: Review): string[] {
  const tags: Set<string> = new Set();

  // Add category as tag
  tags.add(review.category);

  // Extract from metadata if available
  if (review.metadata) {
    const metadata = review.metadata as any;

    // Genres
    if (metadata.genres && Array.isArray(metadata.genres)) {
      metadata.genres.forEach((genre: string) => {
        tags.add(genre.toLowerCase());
      });
    }

    // Platforms
    if (metadata.platforms && Array.isArray(metadata.platforms)) {
      metadata.platforms.forEach((platform: string) => {
        tags.add(platform.toLowerCase());
      });
    }

    // Game modes
    if (metadata.gameModes && Array.isArray(metadata.gameModes)) {
      metadata.gameModes.forEach((mode: string) => {
        tags.add(mode.toLowerCase());
      });
    }

    // Perspectives
    if (metadata.perspectives && Array.isArray(metadata.perspectives)) {
      metadata.perspectives.forEach((perspective: string) => {
        tags.add(perspective.toLowerCase());
      });
    }
  }

  // Extract from score ranges
  if (review.score >= 90) tags.add("excellent");
  else if (review.score >= 80) tags.add("great");
  else if (review.score >= 70) tags.add("good");
  else if (review.score >= 60) tags.add("average");
  else tags.add("below-average");

  // Extract from hardware type if available
  if (review.hardwareId) {
    tags.add("hardware");
  }

  // Add affiliate tag if has affiliate link
  if (review.affiliateLink) {
    tags.add("affiliate");
  }

  // Extract common words from title (simple approach)
  const titleWords = review.title.toLowerCase().split(/\s+/);
  const commonTechWords = [
    "gaming",
    "pro",
    "ultra",
    "premium",
    "budget",
    "wireless",
    "rgb",
    "mechanical",
    "4k",
    "1440p",
    "1080p",
  ];

  commonTechWords.forEach((word) => {
    if (titleWords.some((w) => w.includes(word))) {
      tags.add(word);
    }
  });

  return Array.from(tags).sort();
}

/**
 * Get all unique tags from reviews
 */
export function getAllTags(reviews: Review[]): string[] {
  const tagSet = new Set<string>();
  reviews.forEach((review) => {
    extractTags(review).forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

/**
 * Get tag count for each tag
 */
export function getTagCounts(reviews: Review[]): Record<string, number> {
  const counts: Record<string, number> = {};
  reviews.forEach((review) => {
    extractTags(review).forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
  });
  return counts;
}

/**
 * Filter reviews by tags
 */
export function filterReviewsByTags(reviews: Review[], tags: string[]): Review[] {
  if (tags.length === 0) return reviews;

  return reviews.filter((review) => {
    const reviewTags = extractTags(review);
    return tags.some((tag) => reviewTags.includes(tag));
  });
}
