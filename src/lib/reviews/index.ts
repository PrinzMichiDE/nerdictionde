/**
 * reviews — Public API
 *
 * Re-exports all review-related modules. Consumers should import from
 * this barrel file.
 */

export {
  getReviewList,
} from "./list-service";
export {
  createReviewService,
  ensureUniqueSlug,
  generateSlug,
} from "./create-service";
export type {
  CreateReviewResult,
} from "./create-service";
export type {
  ReviewListResult,
} from "./list-service";
export type {
  ReviewListParams,
} from "./query-builder";
export {
  buildWhereClause,
  buildOrderBy,
  computeAggregates,
  fetchBookmarkCounts,
  fetchTopPicks,
} from "./query-builder";
export type {
  CategoryCounts,
  ScoreDistribution,
} from "./query-builder";
export {
  validateCreateReviewBody,
} from "./create-validation";
export type {
  CreateReviewInput,
} from "./create-validation";

// Re-export from validation.ts for backward compatibility
export {
  validateUpdateReviewBody,
  type UpdateReviewInput,
} from "./validation";
