/**
 * feed — Query builders
 *
 * Prisma queries for each feed source. Pure, testable, strictly typed.
 * All queries use cursor-based pagination and select only required fields.
 */

import prisma from "@/lib/prisma";
import type { FeedItem, FeedItemUser, FeedItemReview } from "./types";

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  profileImageUrl: true,
} as const;

const REVIEW_SELECT = {
  id: true,
  title: true,
  slug: true,
  category: true,
  score: true,
  images: true,
} as const;

/**
 * Build the cursor condition for createdAt-based pagination.
 */
export function cursorCondition(cursor?: string): Record<string, unknown> {
  if (!cursor) return {};
  try {
    new Date(cursor); // validate
  } catch {
    return {};
  }
  return { createdAt: { lt: new Date(cursor) } };
}

/**
 * Fetch ratings from followed users.
 */
export async function fetchFollowedUserRatings(
  followedUserIds: string[],
  cursor?: string,
  limit: number = 20
): Promise<{ items: FeedItem[]; earliestCursor: Date | null }> {
  if (followedUserIds.length === 0) {
    return { items: [], earliestCursor: null };
  }

  const ratings = await prisma.userRating.findMany({
    where: {
      userId: { in: followedUserIds },
      ...cursorCondition(cursor),
    },
    include: {
      user: { select: USER_SELECT },
      review: { select: REVIEW_SELECT },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const items: FeedItem[] = ratings.map((r) => ({
    type: "rating" as const,
    id: r.id,
    createdAt: r.createdAt,
    user: r.user as FeedItemUser,
    rating: { score: r.score, text: r.text },
    review: r.review as FeedItemReview,
  }));

  const earliestCursor = items.length > 0 ? items[items.length - 1].createdAt : null;

  return { items, earliestCursor };
}

/**
 * Fetch bookmarks from followed users.
 */
export async function fetchFollowedUserBookmarks(
  followedUserIds: string[],
  cursor?: string,
  limit: number = 20
): Promise<{ items: FeedItem[]; earliestCursor: Date | null }> {
  if (followedUserIds.length === 0) {
    return { items: [], earliestCursor: null };
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: { in: followedUserIds },
      ...cursorCondition(cursor),
    },
    include: {
      user: { select: USER_SELECT },
      review: { select: REVIEW_SELECT },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const items: FeedItem[] = bookmarks.map((b) => ({
    type: "bookmark" as const,
    id: b.id,
    createdAt: b.createdAt,
    user: b.user as FeedItemUser,
    review: b.review as FeedItemReview,
  }));

  const earliestCursor = items.length > 0 ? items[items.length - 1].createdAt : null;

  return { items, earliestCursor };
}

/**
 * Fetch collection items from followed collections.
 */
export async function fetchFollowedCollectionItems(
  followedCollectionIds: string[],
  cursor?: string,
  limit: number = 20
): Promise<{ items: FeedItem[]; earliestCursor: Date | null }> {
  if (followedCollectionIds.length === 0) {
    return { items: [], earliestCursor: null };
  }

  const collectionItems = await prisma.collectionItem.findMany({
    where: {
      collectionId: { in: followedCollectionIds },
      collection: {
        isPublic: true,
        deletedAt: null,
      },
      review: {
        status: "published",
      },
      ...cursorCondition(cursor),
    },
    include: {
      collection: {
        select: {
          id: true,
          slug: true,
          title: true,
          owner: {
            select: USER_SELECT,
          },
        },
      },
      review: { select: REVIEW_SELECT },
    },
    orderBy: { addedAt: "desc" },
    take: limit,
  });

  const items: FeedItem[] = collectionItems.map((ci) => ({
    type: "collection_item" as const,
    id: ci.id,
    createdAt: ci.addedAt,
    user: ci.collection.owner
      ? ({ id: ci.collection.owner.id, username: ci.collection.owner.username, displayName: ci.collection.owner.displayName, profileImageUrl: ci.collection.owner.profileImageUrl } as FeedItemUser)
      : ({ id: "", username: "", displayName: "", profileImageUrl: null } as FeedItemUser),
    collection: {
      id: ci.collection.id,
      slug: ci.collection.slug,
      title: ci.collection.title,
    },
    review: ci.review as FeedItemReview,
  }));

  const earliestCursor = items.length > 0 ? items[items.length - 1].createdAt : null;

  return { items, earliestCursor };
}

/**
 * Fetch user series items from followed user series.
 */
export async function fetchFollowedUserSeriesItems(
  followedUserSeriesIds: string[],
  cursor?: string,
  limit: number = 20
): Promise<{ items: FeedItem[]; earliestCursor: Date | null }> {
  if (followedUserSeriesIds.length === 0) {
    return { items: [], earliestCursor: null };
  }

  const seriesItems = await prisma.reviewSeriesItem.findMany({
    where: {
      seriesId: { in: followedUserSeriesIds },
      series: {
        deletedAt: null,
        type: "USER",
        visibility: "PUBLIC",
      },
      review: {
        status: "published",
      },
      ...cursorCondition(cursor),
    },
    include: {
      series: {
        select: {
          id: true,
          slug: true,
          title: true,
          owner: {
            select: USER_SELECT,
          },
        },
      },
      review: { select: REVIEW_SELECT },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const items: FeedItem[] = seriesItems.map((si) => ({
    type: "user_series_item" as const,
    id: si.id,
    createdAt: si.createdAt,
    user: si.series.owner
      ? ({ id: si.series.owner.id, username: si.series.owner.username, displayName: si.series.owner.displayName, profileImageUrl: si.series.owner.profileImageUrl } as FeedItemUser)
      : ({ id: "", username: "", displayName: "", profileImageUrl: null } as FeedItemUser),
    series: {
      id: si.series.id,
      slug: si.series.slug,
      title: si.series.title,
    },
    review: si.review as FeedItemReview,
  }));

  const earliestCursor = items.length > 0 ? items[items.length - 1].createdAt : null;

  return { items, earliestCursor };
}
