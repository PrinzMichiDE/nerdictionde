// ============================================
// Server Logic — Scoring, Ranking & Reason Generation
// ============================================

import type { UserSignals, ReviewWithTags, RecommendationReason, RecommendationStrategy } from '@/types/recommendations';

export interface ScoringWeights {
  content: number;
  userUser: number;
  itemItem: number;
  trending: number;
}

export interface ScoringConfig {
  weights: ScoringWeights;
  mmrLambda: number;
  candidateLimit: number;
  homeLimit: number;
  detailLimit: number;
}

// Default configuration (can be overridden by env vars)
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    content: 0.4,
    userUser: 0.3,
    itemItem: 0.2,
    trending: 0.1,
  },
  mmrLambda: 0.3,
  candidateLimit: 50,
  homeLimit: 10,
  detailLimit: 5,
};

function getConfig(): ScoringConfig {
  // In a real app, these would come from env vars
  // For now, use defaults
  return DEFAULT_SCORING_CONFIG;
}

/**
 * Compute content-based score for a candidate review
 * Based on tag overlap, category match, developer/publisher match
 */
export function computeContentScore(
  candidate: ReviewWithTags,
  signals: UserSignals
): number {
  let score = 0;
  let factors = 0;

  // 1. Category match (0.3 weight)
  const likedCategories = new Set<string>();
  for (const reviewId of signals.ratedReviews.keys()) {
    // We'd need category info from liked reviews - simplified here
    // In practice, we'd pass liked review categories as part of signals
  }
  // For now, use a simple heuristic based on tags
  const candidateTags = new Set<string>(
    candidate.tags.map((t: { tag: { slug: string } }) => t.tag.slug)
  );

  // Tag overlap with user's highly rated/bookmarked/read reviews
  // This is simplified - real implementation would compare against user's tag profile
  if (candidateTags.size > 0) {
    score += 0.3; // Base category/tag match score
    factors++;
  }

  // Developer match
  const meta = candidate.metadata;
  if (meta?.developer) {
    score += 0.2;
    factors++;
  }

  // Publisher match
  if (meta?.publisher) {
    score += 0.1;
    factors++;
  }

  // Editorial score as quality signal (0-100, normalize to 0-1)
  score += (candidate.score / 100) * 0.2;
  factors++;

  // User rating average as quality signal
  if (
    candidate.userRatingAvg !== null &&
    candidate.userRatingAvg !== undefined &&
    candidate.userRatingCount !== null &&
    candidate.userRatingCount !== undefined &&
    candidate.userRatingCount > 5
  ) {
    score += (candidate.userRatingAvg / 10) * 0.2;
    factors++;
  }

  return factors > 0 ? score / factors : 0;
}

/**
 * Compute user-user collaborative filtering score
 * Based on similarity with followed users' ratings
 */
export function computeUserUserScore(
  candidate: ReviewWithTags,
  signals: UserSignals
): number {
  // In a full implementation, this would compute cosine similarity
  // between user's rating vector and followed users' rating vectors
  // For now, return a baseline score based on whether followed users rated this
  
  // This is a placeholder - real implementation needs the followed users' ratings for this specific review
  // For now, we return a small base score if the user has follows
  return signals.followedUserIds.size > 0 ? 0.1 : 0;
}

/**
 * Compute item-item collaborative filtering score
 * "Users who liked X also liked Y" based on co-occurrence
 */
export function computeItemItemScore(
  candidate: ReviewWithTags,
  signals: UserSignals
): number {
  // In a full implementation, this would use a precomputed co-occurrence matrix
  // For now, return a baseline
  return 0.05; // Small base score
}

/**
 * Compute trending/popularity score
 */
export function computeTrendingScore(candidate: ReviewWithTags): number {
  // Combine editorial score, user rating, and recency
  let score = 0;

  // Editorial score (0-100 normalized)
  score += (candidate.score / 100) * 0.4;

  // User rating average (0-10 normalized) with count confidence
  if (
    candidate.userRatingAvg !== null &&
    candidate.userRatingAvg !== undefined &&
    candidate.userRatingCount !== null &&
    candidate.userRatingCount !== undefined &&
    candidate.userRatingCount > 0
  ) {
    const confidence = Math.min(candidate.userRatingCount / 50, 1); // Max confidence at 50 ratings
    score += (candidate.userRatingAvg / 10) * 0.4 * confidence;
  }

  // Recency boost (newer reviews get slight boost)
  if (candidate.releaseDate) {
    const daysSinceRelease = (Date.now() - candidate.releaseDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceRelease < 90) {
      score += 0.2 * (1 - daysSinceRelease / 90);
    }
  }

  return Math.min(score, 1);
}

/**
 * Calculate final weighted score
 */
export function calculateFinalScore(
  scores: { content: number; userUser: number; itemItem: number; trending: number },
  weights: ScoringWeights
): number {
  return (
    scores.content * weights.content +
    scores.userUser * weights.userUser +
    scores.itemItem * weights.itemItem +
    scores.trending * weights.trending
  );
}

/**
 * Apply Maximum Marginal Relevance (MMR) for diversity
 * Balances relevance vs diversity
 */
export function applyMMR(
  candidates: ReviewWithTags[],
  scores: Map<string, number>,
  lambda: number
): ReviewWithTags[] {
  if (candidates.length <= 1) return candidates;

  const selected: ReviewWithTags[] = [];
  const remaining = [...candidates];

  // Start with highest scored candidate
  remaining.sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0));
  selected.push(remaining.shift()!);

  while (remaining.length > 0) {
    let bestIdx = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const relevance = scores.get(candidate.id) || 0;

      // Compute max similarity to already selected
      let maxSimilarity = 0;
      for (const sel of selected) {
        const sim = computeSimilarity(candidate, sel);
        maxSimilarity = Math.max(maxSimilarity, sim);
      }

      // MMR score = relevance - lambda * maxSimilarity
      const mmrScore = relevance - lambda * maxSimilarity;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      selected.push(remaining.splice(bestIdx, 1)[0]);
    } else {
      break;
    }
  }

  return selected;
}

/**
 * Compute similarity between two reviews for MMR
 * Based on tag overlap, category, developer
 */
function computeSimilarity(a: ReviewWithTags, b: ReviewWithTags): number {
  let similarity = 0;
  let factors = 0;

  // Category match
  if (a.category === b.category) {
    similarity += 0.5;
    factors++;
  }

  // Tag overlap (Jaccard)
  const tagsA = new Set<string>(a.tags.map((t: { tag: { slug: string } }) => t.tag.slug));
  const tagsB = new Set<string>(b.tags.map((t: { tag: { slug: string } }) => t.tag.slug));
  if (tagsA.size > 0 || tagsB.size > 0) {
    const intersection = new Set([...tagsA].filter(x => tagsB.has(x)));
    const union = new Set([...tagsA, ...tagsB]);
    similarity += intersection.size / union.size;
    factors++;
  }

  // Developer match
  const metaA = a.metadata;
  const metaB = b.metadata;
  if (metaA?.developer && metaB?.developer && metaA.developer === metaB.developer) {
    similarity += 0.3;
    factors++;
  }

  // Publisher match
  if (metaA?.publisher && metaB?.publisher && metaA.publisher === metaB.publisher) {
    similarity += 0.2;
    factors++;
  }

  return factors > 0 ? similarity / factors : 0;
}

/**
 * Generate human-readable reason for recommendation
 */
export function generateReason(
  candidate: ReviewWithTags,
  signals: UserSignals,
  scores: { content: number; userUser: number; itemItem: number; trending: number }
): RecommendationReason {
  const meta = candidate.metadata;

  // Priority order for reasons (most specific first)
  
  // 1. User rated similar review highly
  // In real impl, check if user rated reviews with same tags/developer
  if (scores.content > 0.5 && signals.ratedReviews.size > 0) {
    // Find a rated review that shares tags
    for (const [ratedId, rating] of signals.ratedReviews) {
      if (rating >= 8) {
        return {
          type: 'rated_similar',
          label: `Weil du ein ähnliches Review mit ${rating}/10 bewertet hast`,
          metadata: { ratedReviewId: ratedId, userRating: rating },
        };
      }
    }
  }

  // 2. Bookmarked similar
  if (scores.content > 0.4 && signals.bookmarkedReviews.size > 0) {
    return {
      type: 'bookmarked_similar',
      label: 'Ähnlich zu einem deiner Lesezeichen',
      metadata: { bookmarkedCount: signals.bookmarkedReviews.size },
    };
  }

  // 3. Followed user rated this highly
  if (scores.userUser > 0.3 && signals.followedUserIds.size > 0) {
    return {
      type: 'followed_user',
      label: 'Von Nutzern empfohlen, denen du folgst',
      metadata: { followedCount: signals.followedUserIds.size },
    };
  }

  // 4. Category subscription
  const subscriptionCategory = mapReviewCategoryToSubscription(candidate.category);
  if (signals.subscribedCategories.has(subscriptionCategory)) {
    return {
      type: 'category_subscription',
      label: `Beliebt in deiner Kategorie ${formatCategory(candidate.category)}`,
      metadata: { category: candidate.category },
    };
  }

  // 5. Same developer
  if (meta?.developer && scores.content > 0.3) {
    return {
      type: 'same_developer',
      label: `Von ${meta.developer}`,
      metadata: { developer: meta.developer },
    };
  }

  // 6. Same publisher
  if (meta?.publisher && scores.content > 0.2) {
    return {
      type: 'same_publisher',
      label: `Von ${meta.publisher}`,
      metadata: { publisher: meta.publisher },
    };
  }

  // 7. Tag overlap
  if (scores.content > 0.2) {
    return {
      type: 'tag_overlap',
      label: `Thematisch ähnlich (${candidate.tags.slice(0, 2).map((t: { tag: { name: string } }) => t.tag.name).join(', ')})`,
      metadata: { tags: candidate.tags.map((t: { tag: { name: string } }) => t.tag.name) },
    };
  }

  // 8. Trending
  if (scores.trending > 0.6) {
    return {
      type: 'trending',
      label: 'Aktuell beliebt',
      metadata: { score: candidate.score },
    };
  }

  // 9. Top rated fallback
  return {
    type: 'top_rated',
    label: 'Hoch bewertet von der Community',
    metadata: { score: candidate.score, userRatingAvg: candidate.userRatingAvg },
  };
}

function mapReviewCategoryToSubscription(category: string): string {
  const map: Record<string, string> = {
    game: 'GAMES',
    hardware: 'HARDWARE',
    amazon: 'HARDWARE',
    movie: 'MOVIES',
    series: 'SERIES',
  };
  return map[category] || category.toUpperCase();
}

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    game: 'Games',
    hardware: 'Hardware',
    amazon: 'Hardware',
    movie: 'Filme',
    series: 'Serien',
  };
  return map[category] || category;
}

/**
 * Determine overall strategy used
 */
export function determineStrategy(
  signals: UserSignals,
  hasCollaborative: boolean
): RecommendationStrategy {
  // If user has follows, we can do collaborative filtering even with few signals
  if (signals.followedUserIds.size > 0) {
    if (hasCollaborative) return 'hybrid';
    if (hasSignificantSignals(signals)) return 'content-based';
    return 'trending'; // Follows + trending fallback
  }

  if (!hasSignificantSignals(signals)) {
    return 'cold-start';
  }
  if (signals.ratedReviews.size > 0 || signals.bookmarkedReviews.size > 0) {
    return 'content-based';
  }
  return 'trending';
}

function hasSignificantSignals(signals: UserSignals): boolean {
  const totalSignals =
    signals.ratedReviews.size +
    signals.bookmarkedReviews.size +
    signals.followedUserIds.size +
    signals.readReviewIds.size +
    signals.subscribedCategories.size;
  return totalSignals >= 3;
}