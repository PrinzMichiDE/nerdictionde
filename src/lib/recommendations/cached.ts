/**
 * recommendations — Cached entry points
 *
 * Wraps the uncached service functions with unstable_cache using TTL only
 * (no tag-based invalidation, which Next.js 16 does not support for
 * unstable_cache).
 */

import { unstable_cache } from "next/cache";
import {
  getHomeRecommendationsCore,
  getDetailRecommendationsCore,
} from "./service";
import { HOME_CACHE_CONFIG, DETAIL_CACHE_CONFIG } from "./cache";
import type { RecommendationResult } from "@/types/recommendations";

const getCachedHomeRecommendations = unstable_cache(
  getHomeRecommendationsCore,
  HOME_CACHE_CONFIG.key,
  { revalidate: HOME_CACHE_CONFIG.ttl, tags: HOME_CACHE_CONFIG.key }
);

const getCachedDetailRecommendations = unstable_cache(
  getDetailRecommendationsCore,
  DETAIL_CACHE_CONFIG.key,
  { revalidate: DETAIL_CACHE_CONFIG.ttl, tags: DETAIL_CACHE_CONFIG.key }
);

/**
 * Get home page recommendations for a user (cached).
 */
export async function getRecommendations(
  userId: string,
  { limit = 10, cursor }: { limit?: number; cursor?: string } = {}
): Promise<RecommendationResult> {
  // Cursor-based pagination not yet implemented; limit is enforced.
  void cursor;
  return getCachedHomeRecommendations(userId, Math.min(limit, 20));
}

/**
 * Get review detail page recommendations (cached).
 */
export async function getReviewRecommendations(
  reviewId: string,
  userId: string | undefined,
  { limit = 5 }: { limit?: number } = {}
): Promise<RecommendationResult> {
  return getCachedDetailRecommendations(reviewId, userId, Math.min(limit, 10));
}
