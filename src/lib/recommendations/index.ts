/**
 * recommendations — Public API
 *
 * Re-exports all types and functions. Consumers import from this barrel.
 */

// Types (from existing shared types module)
export type {
  UserSignals,
  ReviewWithTags,
  RecommendationItem,
  RecommendationResult,
  RecommendationReason,
  RecommendationStrategy,
} from "@/types/recommendations";

// Local types
export type {
  CandidateScores,
  ScoredCandidate,
  ScoringConfig,
} from "./service";
export { LOCAL_SCORING_CONFIG } from "./service";

// Service (uncached, for testing)
export {
  scoreAndRankCandidates,
  generateRecommendations,
  getHomeRecommendationsCore,
  getDetailRecommendationsCore,
  createEmptySignals,
  dismissRecommendation,
  isDismissed,
  getDismissedReviewIds,
  invalidateUserRecommendations,
} from "./service";

// Cached entry points
export {
  getRecommendations,
  getReviewRecommendations,
} from "./cached";
