import { Review } from "@/types/review";
import { extractTags } from "./tags";

/**
 * Client-side recommendation engine
 * No database changes - uses existing review data
 */

interface RecommendationOptions {
  minScore?: number;
  maxResults?: number;
  excludeIds?: string[];
}

/**
 * Get similar reviews based on tags and category
 */
export function getSimilarReviews(
  currentReview: Review,
  allReviews: Review[],
  options: RecommendationOptions = {}
): Review[] {
  const { minScore = 0, maxResults = 6, excludeIds = [] } = options;

  const currentTags = new Set(extractTags(currentReview));
  const currentCategory = currentReview.category;

  // Score reviews by similarity
  const scoredReviews = allReviews
    .filter(
      (review) =>
        review.id !== currentReview.id &&
        !excludeIds.includes(review.id) &&
        review.status === "published" &&
        review.score >= minScore
    )
    .map((review) => {
      const reviewTags = new Set(extractTags(review));
      
      // Calculate similarity score
      let score = 0;

      // Category match
      if (review.category === currentCategory) {
        score += 10;
      }

      // Tag overlap
      const commonTags = [...currentTags].filter((tag) => reviewTags.has(tag));
      score += commonTags.length * 5;

      // Score similarity (prefer similar scores)
      const scoreDiff = Math.abs(review.score - currentReview.score);
      score += Math.max(0, 10 - scoreDiff / 10);

      // Prefer recent reviews
      const daysSince = Math.floor(
        (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.max(0, 5 - daysSince / 30);

      return { review, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((item) => item.review);

  return scoredReviews;
}

/**
 * Get personalized recommendations based on user preferences
 */
export function getPersonalizedRecommendations(
  allReviews: Review[],
  preferences: {
    categories?: string[];
    minScore?: number;
    tags?: string[];
    excludeIds?: string[];
  } = {}
): Review[] {
  const {
    categories = [],
    minScore = 70,
    tags = [],
    excludeIds = [],
  } = preferences;

  let filtered = allReviews.filter(
    (review) =>
      review.status === "published" &&
      review.score >= minScore &&
      !excludeIds.includes(review.id)
  );

  // Filter by categories
  if (categories.length > 0) {
    filtered = filtered.filter((review) => categories.includes(review.category));
  }

  // Filter by tags
  if (tags.length > 0) {
    filtered = filtered.filter((review) => {
      const reviewTags = extractTags(review);
      return tags.some((tag) => reviewTags.includes(tag));
    });
  }

  // Sort by score and recency
  return filtered
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 10) return scoreDiff;
      
      const dateDiff =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return dateDiff;
    })
    .slice(0, 12);
}

/**
 * Get trending reviews (based on recency and score)
 */
export function getTrendingReviews(
  allReviews: Review[],
  limit: number = 6
): Review[] {
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  return allReviews
    .filter((review) => review.status === "published")
    .map((review) => {
      const createdAt = new Date(review.createdAt).getTime();
      const isRecent = createdAt > oneWeekAgo;
      const daysSince = (now - createdAt) / (1000 * 60 * 60 * 24);
      
      // Trending score: combines recency and quality
      const trendingScore =
        review.score * 0.6 + (isRecent ? 40 : Math.max(0, 40 - daysSince));
      
      return { review, trendingScore };
    })
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit)
    .map((item) => item.review);
}

/**
 * Get "You might also like" recommendations
 */
export function getYouMightAlsoLike(
  currentReview: Review,
  allReviews: Review[],
  limit: number = 4
): Review[] {
  return getSimilarReviews(currentReview, allReviews, {
    minScore: currentReview.score - 20,
    maxResults: limit,
  });
}
