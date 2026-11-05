/**
 * @file recommendations.ts
 *
 * DEPRECATED: This file has been split into modular files under
 * src/lib/recommendations/. This barrel file re-exports everything for
 * backward compatibility.
 */

export {
  scoreAndRankCandidates,
  generateRecommendations,
  getHomeRecommendationsCore,
  getDetailRecommendationsCore,
  getRecommendations,
  getReviewRecommendations,
  dismissRecommendation,
  isDismissed,
  getDismissedReviewIds,
  invalidateUserRecommendations,
  createEmptySignals,
} from "./recommendations/index";

export type {
  UserSignals,
  ReviewWithTags,
  RecommendationItem,
  RecommendationResult,
  RecommendationReason,
  RecommendationStrategy,
} from "@/types/recommendations";

export type {
  CandidateScores,
  ScoredCandidate,
  ScoringConfig,
} from "./recommendations/service";
export { LOCAL_SCORING_CONFIG } from "./recommendations/service";
