/**
 * recommendations — Cache helpers
 *
 * Wraps Next.js unstable_cache without relying on tag-based invalidation,
 * which is not supported for unstable_cache in Next.js 16. Cache expiration
 * is handled via TTL (revalidate).
 */

import { unstable_cache } from "next/cache";

const HOME_CACHE_TTL = 300; // 5 minutes
const DETAIL_CACHE_TTL = 900; // 15 minutes

/**
 * Creates a cached version of a function with TTL-based expiration.
 * Tags are intentionally not used — Next.js 16 unstable_cache does not
 * support revalidateTag for unstable_cache.
 */
export function createCachedFunction<
  Args extends unknown[],
  Result
>(
  fn: (...args: Args) => Promise<Result>,
  cacheKey: string[],
  ttlSeconds: number
): (...args: Args) => Promise<Result> {
  return unstable_cache(fn, cacheKey, {
    revalidate: ttlSeconds,
    tags: cacheKey,
  });
}

export const HOME_CACHE_CONFIG = {
  ttl: HOME_CACHE_TTL,
  key: ["recommendations-home"] as string[],
};

export const DETAIL_CACHE_CONFIG = {
  ttl: DETAIL_CACHE_TTL,
  key: ["recommendations-detail"] as string[],
};
