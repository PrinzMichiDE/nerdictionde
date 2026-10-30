/**
 * review-generation — Public API
 *
 * Re-exports all types and processor functions. Consumers should import from
 * this barrel file only.
 */

import { clampScore } from "./base-processor";

// Types
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
} from "./types";

// Prompt utilities
export {
  computeScoreBand,
  computeGameScoreBand,
  formatTimeToBeat,
  formatAgeRating,
  formatHardwareType,
  buildStructuredReviewPrompt,
} from "./prompt-builder";

// Slug utilities
export {
  generateSlug,
  ensureUniqueSlug,
  buildBaseSlug,
} from "./slug-service";

// AI client
export { generateContent } from "./ai-client";

// Backward-compatible aliases
export { generateReviewContent } from "./game-processor";
export {
  generateReviewContentForMovie as generateMovieReviewContent,
} from "./movie-processor";
export {
  generateReviewContentForSeries as generateSeriesReviewContent,
} from "./series-processor";

// Processors
export {
  processGame,
  enrichAndPublishDraftGameReview,
} from "./game-processor";
export {
  processMovie,
  regenerateZeroScoreMovieReview,
} from "./movie-processor";
export {
  processSeries,
  regenerateZeroScoreSeriesReview,
} from "./series-processor";
export { processHardware } from "./hardware-processor";

// Base utilities (exported for advanced use / testing)
export {
  generateSeoMetadataSafe,
  applyImagePlaceholders,
  runSideEffects,
  createReviewInTransaction,
  updateReview,
} from "./base-processor";

// External dependencies used by regenerateZeroScoreReview
import prisma from "@/lib/prisma";
import { getIGDBGameById } from "@/lib/igdb";
import { getTMDBMovieById, getTMDBSeriesById } from "@/lib/tmdb";
import { uploadGameCover, uploadGameScreenshots } from "./image-service";
import { applyImagePlaceholders as applyPlaceholders } from "./base-processor";
import { generateSeoMetadataSafe as generateSeoSafe } from "./base-processor";
import { runSideEffects as runEffects } from "./base-processor";

/**
 * Regenerates a review that has score=0 and is older than 30 days.
 * Fetches fresh data from IGDB/TMDB and updates the review in-place.
 */
export async function regenerateZeroScoreReview(
  reviewId: string
): Promise<{ success: boolean; newScore?: number; error?: string }> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      igdbId: true,
      tmdbId: true,
      score: true,
      images: true,
      createdAt: true,
      releaseDate: true,
    },
  });

  if (!review) return { success: false, error: "Review not found" };
  if (review.score !== 0) return { success: false, error: "Review score is not 0" };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (review.createdAt > thirtyDaysAgo) {
    return { success: false, error: "Review is not older than 30 days" };
  }

  if (review.releaseDate) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    if (review.releaseDate > oneDayAgo) {
      return { success: false, error: "Release date +1 day has not passed yet" };
    }
  }

  if (review.category === "game" && review.igdbId) {
    const gameData = await getIGDBGameById(review.igdbId);
    if (!gameData) return { success: false, error: "IGDB game not found" };

    // Re-use game processor content generation
    const { generateReviewContent } = await import("./game-processor");
    const generated = await generateReviewContent(gameData, 0, {
      steamData: null,
    });

    const imageUrls: string[] = [];
    if (gameData.cover?.url) {
      try {
        const coverUrl = gameData.cover.url.startsWith("//")
          ? "https:" + gameData.cover.url
          : gameData.cover.url;
        const highResCoverUrl = coverUrl.replace("t_thumb", "t_720p");
        const syncedUrl = await uploadGameCover(highResCoverUrl, review.slug);
        imageUrls.push(...syncedUrl);
      } catch {
        imageUrls.push(gameData.cover.url.replace("t_thumb", "t_720p"));
      }
    }
    if (gameData.screenshots && gameData.screenshots.length > 0) {
      const screenshots = await uploadGameScreenshots(gameData.screenshots, review.slug);
      imageUrls.push(...screenshots);
    }

    const imagesToUse = imageUrls.length > 0 ? imageUrls : (review.images as string[]);
    const { contentDe, contentEn } = applyPlaceholders(
      generated.de.content,
      generated.en.content,
      imagesToUse,
      review.title
    );

    let seoMeta: { metaDescription: string | null; metaKeywords: string | null } = { metaDescription: null, metaKeywords: null };
    try {
      seoMeta = await generateSeoSafe(generated.de.title, contentDe, "game");
    } catch {
      // Non-blocking
    }

    await prisma.review.update({
      where: { id: review.id },
      data: {
        title: generated.de.title,
        title_en: generated.en.title,
        content: contentDe,
        content_en: contentEn,
        score: clampScore(generated.score),
        pros: generated.de.pros,
        pros_en: generated.en.pros,
        cons: generated.de.cons,
        cons_en: generated.en.cons,
        images: imagesToUse,
        metaDescription: seoMeta.metaDescription,
        metaKeywords: seoMeta.metaKeywords,
      },
    });

    await runEffects(review.id, {
      reviewTitle: generated.de.title,
      score: clampScore(generated.score),
      pros: generated.de.pros,
      cons: generated.de.cons,
      category: "game",
      contentExcerpt: generated.de.content.substring(0, 500),
    });

    return { success: true, newScore: clampScore(generated.score) };
  }

  if (review.category === "movie" && review.tmdbId) {
    const movieData = await getTMDBMovieById(review.tmdbId);
    if (!movieData) return { success: false, error: "TMDB movie not found" };

    const { regenerateZeroScoreMovieReview } = await import("./movie-processor");
    return regenerateZeroScoreMovieReview(reviewId, movieData);
  }

  if (review.category === "series" && review.tmdbId) {
    const seriesData = await getTMDBSeriesById(review.tmdbId);
    if (!seriesData) return { success: false, error: "TMDB series not found" };

    const { regenerateZeroScoreSeriesReview } = await import("./series-processor");
    return regenerateZeroScoreSeriesReview(reviewId, seriesData);
  }

  return { success: false, error: `Unsupported category or missing ID: ${review.category}` };
}
