import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import type { ReactionCounts, ReviewReactionsResponse, ReactionType } from '@/types/review-reactions';

const REACTION_TYPES: ReactionType[] = [
  'THUMBS_UP',
  'HEART',
  'PARTY',
  'THINKING',
  'CRY',
  'ANGRY',
];

function emptyCounts(): ReactionCounts {
  return {
    THUMBS_UP: 0,
    HEART: 0,
    PARTY: 0,
    THINKING: 0,
    CRY: 0,
    ANGRY: 0,
  };
}

export async function getReactionCounts(reviewId: string): Promise<ReactionCounts> {
  const rows = await prisma.reviewReaction.groupBy({
    by: ['type'],
    where: { reviewId },
    _count: { type: true },
  });

  const counts = emptyCounts();
  for (const row of rows) {
    counts[row.type as ReactionType] = row._count.type;
  }
  return counts;
}

export async function getUserReaction(userId: string, reviewId: string): Promise<ReactionType | null> {
  const reaction = await prisma.reviewReaction.findUnique({
    where: { userId_reviewId: { userId, reviewId } },
    select: { type: true },
  });
  return reaction?.type ?? null;
}

export async function getReviewReactionsData(reviewId: string, userId: string | null): Promise<ReviewReactionsResponse> {
  const [counts, myReaction] = await Promise.all([
    getReactionCounts(reviewId),
    userId ? getUserReaction(userId, reviewId) : Promise.resolve(null),
  ]);

  const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

  return { counts, total, myReaction };
}

// Cached version for SSR / API GET
export const getCachedReviewReactions = unstable_cache(
  async (reviewId: string, userId: string | null) => getReviewReactionsData(reviewId, userId),
  ['review-reactions'],
  { tags: ['review-reactions'], revalidate: 60 }
);

export async function toggleReaction(
  userId: string,
  reviewId: string,
  type: ReactionType
): Promise<ReviewReactionsResponse> {
  // Upsert: insert new or update existing (switch reaction)
  await prisma.reviewReaction.upsert({
    where: { userId_reviewId: { userId, reviewId } },
    create: { userId, reviewId, type },
    update: { type },
  });

  // Return fresh data
  return getReviewReactionsData(reviewId, userId);
}

export async function removeReaction(
  userId: string,
  reviewId: string,
  type: ReactionType
): Promise<ReviewReactionsResponse> {
  const existing = await prisma.reviewReaction.findUnique({
    where: { userId_reviewId: { userId, reviewId } },
  });

  if (!existing || existing.type !== type) {
    // Not found or different type - return current state
    return getReviewReactionsData(reviewId, userId);
  }

  await prisma.reviewReaction.delete({
    where: { userId_reviewId: { userId, reviewId } },
  });

  return getReviewReactionsData(reviewId, userId);
}

export async function ensureReviewPublished(reviewId: string): Promise<boolean> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { status: true },
  });
  return review?.status === 'published';
}