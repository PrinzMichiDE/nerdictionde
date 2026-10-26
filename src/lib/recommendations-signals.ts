// ============================================
// Server Logic — User Signal Extraction
// ============================================

import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import type { UserSignals } from '@/types/recommendations';

const SIGNALS_CACHE_TTL = 300; // 5 minutes

// Core logic - testable without cache
export async function fetchUserSignals(userId: string): Promise<UserSignals> {
  // Parallel fetch all signal sources
  const [ratings, bookmarks, follows, readingHistory, categorySubs] = await Promise.all([
    // User ratings (score 0-10)
    prisma.userRating.findMany({
      where: { userId },
      select: { reviewId: true, score: true },
    }),

    // User bookmarks
    prisma.bookmark.findMany({
      where: { userId },
      select: { reviewId: true },
    }),

    // Users this user follows
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),

    // Reading history (progress > 50% = "read")
    prisma.readingHistory.findMany({
      where: {
        userId,
        OR: [
          { progress: { gte: 50 } },
          { scrollDepth: { gte: 50 } },
          { dwellTime: { gte: 180000 } }, // 3 minutes in ms
        ],
      },
      select: { reviewId: true },
    }),

    // Category subscriptions
    prisma.categorySubscription.findMany({
      where: { userId },
      select: { category: true },
    }),
  ]);

  return {
    ratedReviews: new Map<string, number>(ratings.map((r) => [r.reviewId, r.score])),
    bookmarkedReviews: new Set<string>(bookmarks.map((b) => b.reviewId)),
    followedUserIds: new Set<string>(follows.map((f) => f.followingId)),
    readReviewIds: new Set<string>(readingHistory.map((rh) => rh.reviewId)),
    subscribedCategories: new Set<string>(categorySubs.map((cs) => cs.category)),
  };
}

// Cached wrapper for production use
const getCachedUserSignals = unstable_cache(
  fetchUserSignals,
  ['user-signals'],
  {
    revalidate: SIGNALS_CACHE_TTL,
    tags: ['user-signals'],
  }
);

export async function getUserSignals(userId: string): Promise<UserSignals> {
  return getCachedUserSignals(userId);
}

export async function invalidateUserSignals(userId: string): Promise<void> {
  // Note: Next.js unstable_cache doesn't support direct tag invalidation by key
  // We rely on TTL expiration. For immediate invalidation, we'd need a different approach.
  // This function is a placeholder for future cache tag-based invalidation.
  // Current strategy: TTL-based (5 min) + mutation-triggered revalidation at API level
}

export async function getUserSignalCounts(userId: string): Promise<{
  ratingsCount: number;
  bookmarksCount: number;
  followsCount: number;
  historyCount: number;
  subscriptionsCount: number;
}> {
  const [ratingsCount, bookmarksCount, followsCount, historyCount, subscriptionsCount] =
    await Promise.all([
      prisma.userRating.count({ where: { userId } }),
      prisma.bookmark.count({ where: { userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.readingHistory.count({
        where: {
          userId,
          OR: [
            { progress: { gte: 50 } },
            { scrollDepth: { gte: 50 } },
            { dwellTime: { gte: 180000 } },
          ],
        },
      }),
      prisma.categorySubscription.count({ where: { userId } }),
    ]);

  return {
    ratingsCount,
    bookmarksCount,
    followsCount,
    historyCount,
    subscriptionsCount,
  };
}

export function hasSignificantSignals(signals: UserSignals): boolean {
  // Cold-start threshold: need at least 3 total signals across all types
  const totalSignals =
    signals.ratedReviews.size +
    signals.bookmarkedReviews.size +
    signals.followedUserIds.size +
    signals.readReviewIds.size +
    signals.subscribedCategories.size;

  return totalSignals >= 3;
}

export function getSignalStrength(signals: UserSignals): 'cold' | 'warm' | 'hot' {
  const totalSignals =
    signals.ratedReviews.size +
    signals.bookmarkedReviews.size +
    signals.followedUserIds.size +
    signals.readReviewIds.size +
    signals.subscribedCategories.size;

  if (totalSignals >= 20) return 'hot';
  if (totalSignals >= 5) return 'warm';
  return 'cold';
}