/**
 * @file review-generation.ts
 *
 * DEPRECATED: This file has been split into modular files under
 * src/lib/review-generation/. This barrel file re-exports everything for
 * backward compatibility. New code should import from
 * "@/lib/review-generation" (which resolves to the directory's index.ts)
 * or from specific sub-modules.
 *
 * To migrate, replace:
 *   import { processGame } from "@/lib/review-generation";
 * with the same import — it already resolves to the new modular index.
 *
 * All public exports from the old monolith are preserved below.
 */

export { generateContent } from "./review-generation/ai-client";
export { generateReviewContent } from "./review-generation/game-processor";
export {
  generateReviewContentForMovie as generateMovieReviewContent,
} from "./review-generation/movie-processor";
export {
  generateReviewContentForSeries as generateSeriesReviewContent,
} from "./review-generation/series-processor";
export {
  processGame,
  enrichAndPublishDraftGameReview,
} from "./review-generation/game-processor";
export {
  processMovie,
  regenerateZeroScoreMovieReview,
} from "./review-generation/movie-processor";
export {
  processSeries,
  regenerateZeroScoreSeriesReview,
} from "./review-generation/series-processor";
export { processHardware } from "./review-generation/hardware-processor";
export { regenerateZeroScoreReview } from "./review-generation/index";
export {
  generateSlug,
  ensureUniqueSlug,
  buildBaseSlug,
} from "./review-generation/slug-service";
export {
  computeScoreBand,
  computeGameScoreBand,
  formatTimeToBeat,
  formatAgeRating,
  formatHardwareType,
  buildStructuredReviewPrompt,
} from "./review-generation/prompt-builder";
export type {
  ReviewCategory,
  ReviewLanguageContent,
  GeneratedReviewContent,
  ReviewSection,
  StructuredReviewPromptOptions,
  ScoreBand,
  ProcessResult,
  ProcessOptions,
  SlugCandidate,
  ImageUploadResult,
  ReviewMetadataInput,
  StoreIds,
  SteamGameInfo,
  IGDBGame,
  IGDBGameInvolvedCompany,
  IGDBGamePlatform,
  IGDBGameGenre,
  TMDBMovie,
  TMDBSeries,
  HardwareData,
  TavilySearchResponse,
  PrismaReviewCreateInput,
  GenerationSideEffects,
} from "./review-generation/types";
export {
  generateSeoMetadataSafe,
  applyImagePlaceholders,
  runSideEffects,
  clampScore,
  createReviewInTransaction,
  updateReview,
} from "./review-generation/base-processor";
