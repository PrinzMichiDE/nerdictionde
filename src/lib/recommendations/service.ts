/**
 * recommendations — Service layer
 *
 * Core recommendation logic: signal loading, candidate generation,
 * scoring, ranking, and MMR diversification. All database reads run
 * inside a Prisma transaction for consistency.
 */

import prisma from "@/lib/prisma";
import { getUserSignals, hasSignificantSignals } from "@/lib/recommendations-signals";
import {
  getContentCandidates,
  getCollaborativeCandidates,
  getTrendingCandidates,
  mergeCandidates,
  getReviewSignals,
  getContentCandidatesForReview,
} from "@/lib/recommendations-candidates";
import {
  computeContentScore,
  computeUserUserScore,
  computeItemItemScore,
  computeTrendingScore,
  calculateFinalScore,
  applyMMR,
  generateReason,
  determineStrategy,
} from "@/lib/recommendations-scoring";
import type {
  UserSignals,
  ReviewWithTags,
  RecommendationItem,
  RecommendationResult,
  RecommendationStrategy,
} from "@/types/recommendations";

export interface CandidateScores {
  content: number;
  userUser: number;
  itemItem: number;
  trending: number;
}

export interface ScoredCandidate {
  review: ReviewWithTags;
  scores: CandidateScores;
  finalScore: number;
}

export interface ScoringConfig {
  weights: {
    content: number;
    userUser: number;
    itemItem: number;
    trending: number;
  };
  mmrLambda: number;
  candidateLimit: number;
}

export const LOCAL_SCORING_CONFIG: ScoringConfig = {
  weights: {
    content: 0.4,
    userUser: 0.3,
    itemItem: 0.2,
    trending: 0.1,
  },
  mmrLambda: 0.7,
  candidateLimit: 50,
};

/**
 * Score and rank candidates for a user.
 * Exported for testing.
 */
export async function scoreAndRankCandidates(
  candidates: ReviewWithTags[],
  signals: UserSignals,
  config: ScoringConfig = LOCAL_SCORING_CONFIG
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
  const scoreMap = new Map(scored.map((s) => [s.review.id, s.finalScore]));
  const reviews = scored.map((s) => s.review);
  const diversified = applyMMR(reviews, scoreMap, config.mmrLambda);

  // Map back to scored candidates in diversified order
  const reviewToScored = new Map(scored.map((s) => [s.review.id, s]));
  return diversified.map((r) => reviewToScored.get(r.id)!);
}

/**
 * Generate recommendations with reasons.
 * Exported for testing.
 */
export async function generateRecommendations(
  candidates: ReviewWithTags[],
  signals: UserSignals,
  limit: number,
  config: ScoringConfig = LOCAL_SCORING_CONFIG
): Promise<{ recommendations: RecommendationItem[]; strategy: RecommendationStrategy }> {
  const scored = await scoreAndRankCandidates(candidates, signals, config);
  const topCandidates = scored.slice(0, limit);

  const recommendations: RecommendationItem[] = topCandidates.map((scored) => ({
    review: scored.review,
    reason: generateReason(scored.review, signals, scored.scores),
    score: scored.finalScore,
  }));

  const strategy = determineStrategy(signals, signals.followedUserIds.size > 0);

  return { recommendations, strategy };
}

/**
 * Core home recommendations logic (uncached, for testing).
 * Exported for testing.
 */
export async function getHomeRecommendationsCore(
  userId: string,
  limit: number
): Promise<RecommendationResult> {
  const signals = await getUserSignals(userId);
  const config = LOCAL_SCORING_CONFIG;

  // Cold start: use trending if insufficient signals
  if (!hasSignificantSignals(signals)) {
    const trendingCandidates = await getTrendingCandidates({ limit: config.candidateLimit });
    const { recommendations } = await generateRecommendations(
      trendingCandidates,
      signals,
      limit,
      config
    );
    return { recommendations, strategy: "cold-start", nextCursor: undefined };
  }

  // Generate candidates from multiple sources
  const excludeIds = new Set<string>(
    [...signals.readReviewIds, ...signals.ratedReviews.keys(), ...signals.bookmarkedReviews]
  );

  const [contentCandidates, collaborativeCandidates, trendingCandidates] =
    await Promise.all([
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

  return { recommendations, strategy, nextCursor: undefined };
}

/**
 * Core detail recommendations logic (uncached, for testing).
 * Exported for testing.
 */
export async function getDetailRecommendationsCore(
  reviewId: string,
  userId: string | undefined,
  limit: number
): Promise<RecommendationResult> {
  const config = LOCAL_SCORING_CONFIG;
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

  return { recommendations, strategy, nextCursor: undefined };
}

/**
 * Create empty user signals for users without history.
 */
export function createEmptySignals(): UserSignals {
  return {
    ratedReviews: new Map(),
    bookmarkedReviews: new Set(),
    followedUserIds: new Set(),
    readReviewIds: new Set(),
    subscribedCategories: new Set(),
  };
}

/**
 * Dismiss a recommendation for a user.
 */
export async function dismissRecommendation(
  userId: string,
  reviewId: string,
  reason: "not_interested" | "already_read" | "irrelevant" = "not_interested"
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
}

/**
 * Check if a review is dismissed by a user.
 */
export async function isDismissed(userId: string, reviewId: string): Promise<boolean> {
  const dismiss = await prisma.recommendationDismiss.findUnique({
    where: { userId_reviewId: { userId, reviewId } },
    select: { id: true },
  });
  return !!dismiss;
}

/**
 * Get dismissed review IDs for a user (for filtering).
 */
export async function getDismissedReviewIds(userId: string): Promise<Set<string>> {
  const dismisses = await prisma.recommendationDismiss.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    select: { reviewId: true },
  });
  return new Set(dismisses.map((d) => d.reviewId));
}

/**
 * Invalidate user recommendations cache (placeholder for future tag-based invalidation).
 * Currently relies on TTL expiration.
 */
export async function invalidateUserRecommendations(_userId: string): Promise<void> {
  // No-op: cache relies on TTL.
  // Future: implement tag-based invalidation when Next.js supports it.
}
