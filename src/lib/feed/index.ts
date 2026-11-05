/**
 * feed — Public API
 *
 * Entry point for the activity feed. Orchestrates fetching followed users,
 * collections, and series, then merges all sources efficiently.
 */

import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { getFollowing } from "@/lib/follow";
import { isCollectionsFollowEnabled } from "@/lib/collections-follow-schema";
import { featureFlags } from "@/lib/feature-flags";
import {
  fetchFollowedUserRatings,
  fetchFollowedUserBookmarks,
  fetchFollowedCollectionItems,
  fetchFollowedUserSeriesItems,
} from "./query-builders";
import { mergeFeedSources } from "./merger";
import type { FeedResult } from "./types";

/**
 * Get activity feed for a user (cursor-based pagination).
 * Cached for 30 seconds per user.
 */
export const getFeed = unstable_cache(
  async (
    userId: string,
    cursor?: string,
    limit = 20,
    includeCollections = true,
    includeUserSeries = true
  ): Promise<FeedResult> => {
    // 1. Get followed user IDs
    const following = await getFollowing(userId);
    const followedUserIds = following.items.map((f) => f.following.id);

    // 2. Get followed collection IDs
    let followedCollectionIds: string[] = [];
    if (includeCollections && isCollectionsFollowEnabled()) {
      const followedCollections = await prisma.collectionFollow.findMany({
        where: { userId },
        select: { collectionId: true },
      });
      followedCollectionIds = followedCollections.map((f) => f.collectionId);
    }

    // 3. Get followed user series IDs
    let followedUserSeriesIds: string[] = [];
    if (includeUserSeries && featureFlags.userSeries) {
      const followedUserSeries = await prisma.userSeriesFollow.findMany({
        where: { userId },
        select: { seriesId: true },
      });
      followedUserSeriesIds = followedUserSeries.map((f) => f.seriesId);
    }

    // 4. Fetch all sources in parallel (each limited to `limit` items)
    const [ratings, bookmarks, collectionItems, userSeriesItems] =
      await Promise.all([
        fetchFollowedUserRatings(followedUserIds, cursor, limit),
        fetchFollowedUserBookmarks(followedUserIds, cursor, limit),
        includeCollections && isCollectionsFollowEnabled()
          ? fetchFollowedCollectionItems(followedCollectionIds, cursor, limit)
          : Promise.resolve({ items: [], earliestCursor: null }),
        includeUserSeries && featureFlags.userSeries
          ? fetchFollowedUserSeriesItems(followedUserSeriesIds, cursor, limit)
          : Promise.resolve({ items: [], earliestCursor: null }),
      ]);

    // 5. Merge, deduplicate, sort, and apply limit
    return mergeFeedSources(
      [ratings, bookmarks, collectionItems, userSeriesItems],
      limit
    );
  },
  ["feed"],
  { tags: ["feed"], revalidate: 30 }
);

/**
 * Invalidate feed cache for a user (call after new activity).
 * Note: Next.js unstable_cache doesn't support direct invalidation by key.
 * Cache expires after 30 seconds (revalidate).
 */
export function invalidateFeedCache(_userId: string): void {
  // No-op for now; relies on TTL expiration.
  // Future: use revalidateTag("feed") when Next.js supports it for unstable_cache.
}
