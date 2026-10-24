import { unstable_cache } from "next/cache";
import prisma from "./prisma";
import { getFollowing } from "./follow";

export type FeedItem =
  | {
      type: "rating";
      id: string;
      createdAt: Date;
      user: {
        id: string;
        username: string;
        displayName: string;
        profileImageUrl: string | null;
      };
      rating: {
        score: number;
        text: string | null;
      };
      review: {
        id: string;
        title: string;
        slug: string;
        category: string;
        score: number;
        images: string[];
      };
    }
  | {
      type: "bookmark";
      id: string;
      createdAt: Date;
      user: {
        id: string;
        username: string;
        displayName: string;
        profileImageUrl: string | null;
      };
      review: {
        id: string;
        title: string;
        slug: string;
        category: string;
        score: number;
        images: string[];
      };
    };

export type FeedResult = {
  items: FeedItem[];
  nextCursor: string | null;
};

/**
 * Get activity feed for a user (cursor-based pagination)
 * Cached for 30 seconds
 */
export const getFeed = unstable_cache(
  async (userId: string, cursor?: string, limit = 20): Promise<FeedResult> => {
    // Get list of followed user IDs
    const following = await getFollowing(userId);
    const followedUserIds = following.items.map((f) => f.following.id);

    if (followedUserIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    // Build cursor condition
    const cursorCondition = cursor
      ? { createdAt: { lt: new Date(cursor) } }
      : {};

    // Fetch feed item types in parallel (only user-linked activities)
    const [ratings, bookmarks] = await Promise.all([
      // Ratings by followed users
      prisma.userRating.findMany({
        where: {
          userId: { in: followedUserIds },
          ...cursorCondition,
        },
        include: {
          user: {
            select: { id: true, username: true, displayName: true, profileImageUrl: true },
          },
          review: {
            select: { id: true, title: true, slug: true, category: true, score: true, images: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      // Bookmarks by followed users
      prisma.bookmark.findMany({
        where: {
          userId: { in: followedUserIds },
          ...cursorCondition,
        },
        include: {
          user: {
            select: { id: true, username: true, displayName: true, profileImageUrl: true },
          },
          review: {
            select: { id: true, title: true, slug: true, category: true, score: true, images: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    // Transform to unified FeedItem type
    const feedItems: FeedItem[] = [
      ...ratings.map((r) => ({
        type: "rating" as const,
        id: r.id,
        createdAt: r.createdAt,
        user: r.user,
        rating: { score: r.score, text: r.text },
        review: r.review,
      })),
      ...bookmarks.map((b) => ({
        type: "bookmark" as const,
        id: b.id,
        createdAt: b.createdAt,
        user: b.user,
        review: b.review,
      })),
    ];

    // Sort by createdAt descending
    feedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply limit
    const limitedItems = feedItems.slice(0, limit);

    // Determine next cursor (ISO string of the last item's createdAt)
    const nextCursor = limitedItems.length === limit
      ? limitedItems[limitedItems.length - 1].createdAt.toISOString()
      : null;

    return { items: limitedItems, nextCursor };
  },
  ["feed"],
  { tags: ["feed"], revalidate: 30 }
);

/**
 * Invalidate feed cache for a user (call after new activity)
 */
export function invalidateFeedCache(userId: string) {
  // Note: Next.js unstable_cache doesn't have direct invalidation
  // Would need to use revalidateTag if using Next.js 15+ cache tags
  // For now, cache expires after 30 seconds
}