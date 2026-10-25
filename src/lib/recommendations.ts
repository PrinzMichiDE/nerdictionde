// ============================================
// Server Logic — Main Entry Points & Dismiss
// ============================================

import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { getUserSignals, hasSignificantSignals } from '@/lib/recommendations-signals';
import {
  getContentCandidates,
  getCollaborativeCandidates,
  getTrendingCandidates,
  mergeCandidates,
  getReviewSignals,
  getContentCandidatesForReview,
} from '@/lib/recommendations-candidates';
import {
  computeContentScore,
  computeUserUserScore,
  computeItemItemScore,
  computeTrendingScore,
  calculateFinalScore,
  applyMMR,
  generateReason,
  determineStrategy,
  DEFAULT_SCORING_CONFIG,
} from '@/lib/recommendations-scoring';
import type {
  UserSignals,
  ReviewWithTags,
  RecommendationItem,
  RecommendationResult,
  RecommendationReason,
  RecommendationStrategy,
} from '@/types/recommendations';

const HOME_CACHE_TTL = 300; // 5 minutes
const DETAIL_CACHE_TTL = 900; // 15 minutes

interface ScoredCandidate {
  review: ReviewWithTags;
  scores: {
    content: number;
    userUser: number;
    itemItem: number;
    trending: number;
  };
  finalScore: number;
}

/**
 * Score and rank candidates for a user
 * Exported for testing
 */
export async function scoreAndRankCandidates(
  candidates: ReviewWithTags[],
  signals: UserSignals,
  config = DEFAULT_SCORING_CONFIG
): Promise<ScoredCandidate[]> {
  const scored: ScoredCandidate[] = [];

  for (const candidate of candidates) {
    const contentScore = computeContentScore(candidate, signals);
    const userUserScore = computeUserUserScore(candidate, signals);
    const itemItemScore = computeItemItemScore(candidate, signals);
    const trendingScore = computeTrendingScore(candidate);

    const finalScore = calculateFinalScore(
      { content: contentScore, userUser: userUserScore, itemItem: itemItemScore, trending: trendingScore },
      config.weights
    );

    scored.push({
      review: candidate,
      scores: { content: contentScore, userUser: userUserScore, itemItem: itemItemScore, trending: trendingScore },
      finalScore,
    });
  }

  // Sort by final score descending
  scored.sort((a, b) => b.finalScore - a.finalScore);

  // Apply MMR for diversity
  const scoreMap = new Map(scored.map(s => [s.review.id, s.finalScore]));
  const reviews = scored.map(s => s.review);
  const diversified = applyMMR(reviews, scoreMap, config.mmrLambda);

  // Map back to scored candidates in diversified order
  const reviewToScored = new Map(scored.map(s => [s.review.id, s]));
  return diversified.map(r => reviewToScored.get(r.id)!);
}

/**
 * Generate recommendations with reasons
 * Exported for testing
 */
export async function generateRecommendations(
  candidates: ReviewWithTags[],
  signals: UserSignals,
  limit: number,
  config = DEFAULT_SCORING_CONFIG
): Promise<{ recommendations: RecommendationItem[]; strategy: RecommendationStrategy }> {
  const scored = await scoreAndRankCandidates(candidates, signals, config);
  const topCandidates = scored.slice(0, limit);

  const recommendations: RecommendationItem[] = topCandidates.map(scored => ({
    review: scored.review,
    reason: generateReason(scored.review, signals, scored.scores),
    score: scored.finalScore,
  }));

  const strategy = determineStrategy(signals, signals.followedUserIds.size > 0);

  return { recommendations, strategy };
}

/**
 * Core home recommendations logic (uncached, for testing)
 * Exported for testing
 */
export async function getHomeRecommendationsCore(
  userId: string,
  limit: number
): Promise<RecommendationResult> {
  const signals = await getUserSignals(userId);
  const config = DEFAULT_SCORING_CONFIG;

  // Cold start: use trending if insufficient signals
  if (!hasSignificantSignals(signals)) {
    const trendingCandidates = await getTrendingCandidates({ limit: config.candidateLimit });
    const { recommendations, strategy } = await generateRecommendations(
      trendingCandidates,
      signals,
      limit,
      config
    );
    return { recommendations, strategy: 'cold-start' };
  }

  // Generate candidates from multiple sources
  const excludeIds = new Set<string>(
    [...signals.readReviewIds, ...signals.ratedReviews.keys(), ...signals.bookmarkedReviews]
  );

  const [contentCandidates, collaborativeCandidates, trendingCandidates] = await Promise.all([
    getContentCandidates(signals, { excludeIds, limit: config.candidateLimit }),
    getCollaborativeCandidates(signals, { excludeIds, limit: config.candidateLimit }),
    getTrendingCandidates({ excludeIds, limit: 20 }),
  ]);

  const allCandidates = mergeCandidates(contentCandidates, collaborativeCandidates, trendingCandidates);

  const { recommendations, strategy } = await generateRecommendations(
    allCandidates,
    signals,
    limit,
    config
  );

  return { recommendations, nextCursor: undefined, strategy };
}

/**
 * Core detail recommendations logic (uncached, for testing)
 * Exported for testing
 */
export async function getDetailRecommendationsCore(
  reviewId: string,
  userId: string | undefined,
  limit: number
): Promise<RecommendationResult> {
  const config = DEFAULT_SCORING_CONFIG;
  const reviewSignals = await getReviewSignals(reviewId);
  const userSignals = userId ? await getUserSignals(userId) : createEmptySignals();

  // Exclude the current review
  const excludeIds = new Set<string>([reviewId]);
  if (userId) {
    const uSignals = await getUserSignals(userId);
    for (const id of uSignals.readReviewIds) excludeIds.add(id);
    for (const id of uSignals.ratedReviews.keys()) excludeIds.add(id);
    for (const id of uSignals.bookmarkedReviews) excludeIds.add(id);
  }

  // Get content-based candidates for this review
  const contentCandidates = await getContentCandidatesForReview(reviewSignals, {
    excludeIds,
    limit: config.candidateLimit,
  });

  // Also add some trending as fallback
  const trendingCandidates = await getTrendingCandidates({ excludeIds, limit: 10 });

  const allCandidates = mergeCandidates(contentCandidates, trendingCandidates);

  const { recommendations, strategy } = await generateRecommendations(
    allCandidates,
    userSignals,
    limit,
    config
  );

  return { recommendations, nextCursor: undefined, strategy: 'content-based' };
}

/**
 * Get home page recommendations for a user (cached)
 */
const getCachedHomeRecommendations = unstable_cache(
  getHomeRecommendationsCore,
  ['recommendations-home'],
  {
    revalidate: HOME_CACHE_TTL,
    tags: ['recommendations-home'],
  }
);

export async function getRecommendations(
  userId: string,
  { limit = 10, cursor }: { limit?: number; cursor?: string } = {}
): Promise<RecommendationResult> {
  // For now, ignore cursor (pagination not fully implemented)
  return getCachedHomeRecommendations(userId, Math.min(limit, 20));
}

/**
 * Get review detail page recommendations (cached)
 */
const getCachedDetailRecommendations = unstable_cache(
  getDetailRecommendationsCore,
  ['recommendations-detail'],
  {
    revalidate: DETAIL_CACHE_TTL,
    tags: ['recommendations-detail'],
  }
);

function createEmptySignals(): UserSignals {
  return {
    ratedReviews: new Map(),
    bookmarkedReviews: new Set(),
    followedUserIds: new Set(),
    readReviewIds: new Set(),
    subscribedCategories: new Set(),
  };
}

export async function getReviewRecommendations(
  reviewId: string,
  userId: string | undefined,
  { limit = 5 }: { limit?: number } = {}
): Promise<RecommendationResult> {
  return getCachedDetailRecommendations(reviewId, userId, Math.min(limit, 10));
}

/**
 * Dismiss a recommendation for a user
 */
export async function dismissRecommendation(
  userId: string,
  reviewId: string,
  reason: 'not_interested' | 'already_read' | 'irrelevant' = 'not_interested'
): Promise<void> {
  await prisma.recommendationDismiss.upsert({
    where: {
      userId_reviewId: { userId, reviewId },
    },
    create: {
      userId,
      reviewId,
      reason,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    update: {
      reason,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Invalidate user's home recommendations cache
  // Note: Next.js unstable_cache doesn't support granular invalidation by key
  // The cache will expire naturally via TTL
  // For immediate invalidation, we'd need a different caching strategy
}

/**
 * Check if a review is dismissed by a user
 */
export async function isDismissed(userId: string, reviewId: string): Promise<boolean> {
  const dismiss = await prisma.recommendationDismiss.findUnique({
    where: { userId_reviewId: { userId, reviewId } },
    select: { id: true },
  });
  return !!dismiss;
}

/**
 * Get dismissed review IDs for a user (for filtering)
 */
export async function getDismissedReviewIds(userId: string): Promise<Set<string>> {
  const dismisses = await prisma.recommendationDismiss.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    select: { reviewId: true },
  });
  return new Set(dismisses.map(d => d.reviewId));
}

/**
 * Invalidate user recommendations cache (placeholder for future tag-based invalidation)
 */
export async function invalidateUserRecommendations(userId: string): Promise<void> {
  // Currently relies on TTL expiration
  // Future: use revalidateTag when Next.js supports it for unstable_cache
}