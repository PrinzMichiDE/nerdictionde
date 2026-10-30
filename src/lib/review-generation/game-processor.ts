/**
 * review-generation — Game processor
 *
 * End-to-end processing of a single game review: duplicate check, store
 * enrichment, Steam data, AI content generation, image upload, SEO, DB
 * creation and side effects.
 */

import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { calculatePublicationDate } from "@/lib/date-utils";
import { getIGDBGameById } from "@/lib/igdb";
import {
  extractYouTubeVideoIdsFromIGDB,
} from "@/lib/youtube-extraction";
import {
  uploadGameCover,
  uploadGameScreenshots,
} from "./image-service";
import {
  ensureUniqueSlug,
  buildBaseSlug,
} from "./slug-service";
import {
  generateContent,
} from "./ai-client";
import {
  buildStructuredReviewPrompt,
  computeGameScoreBand,
  formatAgeRating,
  formatTimeToBeat,
} from "./prompt-builder";
import {
  generateSeoMetadataSafe,
  applyImagePlaceholders,
  createReviewInTransaction,
  updateReview,
  runSideEffects,
  clampScore,
} from "./base-processor";
import type {
  IGDBGame,
  IGDBGameGenre,
  IGDBGamePlatform,
  ProcessOptions,
  ProcessResult,
  GeneratedReviewContent,
  StoreIds,
  SteamGameInfo,
  TavilySearchResponse,
} from "./types";

/**
 * Extracts developers from involved_companies.
 */
function extractDevelopers(
  involvedCompanies: unknown
): string[] {
  const companies = involvedCompanies as
    | Array<{ developer: boolean; company: { name: string } }>
    | undefined;
  if (!companies) return [];
  return companies
    .filter((c) => c.developer)
    .map((c) => c.company.name);
}

/**
 * Extracts publishers from involved_companies.
 */
function extractPublishers(
  involvedCompanies: unknown
): string[] {
  const companies = involvedCompanies as
    | Array<{ publisher: boolean; company: { name: string } }>
    | undefined;
  if (!companies) return [];
  return companies
    .filter((c) => c.publisher)
    .map((c) => c.company.name);
}

/**
 * Builds the context lines for the game review prompt.
 */
function buildGameContextLines(
  game: IGDBGame,
  steamData: SteamGameInfo | null,
  tavilyResults: unknown
): string[] {
  const developers = extractDevelopers(game.involved_companies);
  const publishers = extractPublishers(game.involved_companies);
  const platforms = (game.platforms || []).map((p) => p.name);
  const genres = (game.genres || []).map((g) => g.name);
  const gameModes = (game.game_modes || []).map((m) => m.name);
  const perspectives = (game.player_perspectives || []).map((p) => p.name);
  const engines = (game.game_engines || []).map((e) => e.name);
  const themes = (game.themes || []).map((t) => t.name);
  const keywords = ((game.keywords || []) as Array<{ name: string }>)
    .map((k) => k.name)
    .slice(0, 12);
  const similarGames = ((game.similar_games || []) as Array<{ name: string }>)
    .map((s) => s.name)
    .slice(0, 6);
  const franchise = (game.franchise as { name?: string } | undefined)?.name;
  const collections = ((game.collections || []) as Array<{ name: string }>)
    .map((c) => c.name);
  const languages = ((game.language_supports || []) as Array<{
    language: { name: string };
  }>)
    .map((l) => l.language?.name)
    .filter(Boolean)
    .slice(0, 12);

  const releaseDate = game.first_release_date
    ? new Date(game.first_release_date * 1000).toLocaleDateString("de-DE")
    : "N/A";

  const gameCategoryLabel: Record<number, string> = {
    0: "Hauptspiel",
    1: "DLC / Add-on",
    2: "Erweiterung",
    3: "Bundle",
    4: "Standalone-Erweiterung",
    5: "Mod",
    6: "Episode",
    7: "Sammlung",
    8: "Mod",
    9: "Remake",
    10: "Remaster",
    11: "Expanded Game",
    12: "Port",
    13: "Fork",
    14: "Pack",
    15: "Update",
  };
  const gameCategory =
    gameCategoryLabel[(game.category as number) ?? -1];

  const statusLabels: Record<number, string> = {
    0: "angekündigt",
    1: "Alpha",
    2: "Beta",
    3: "Early Access",
    4: "erscheint",
    5: "veröffentlicht",
    6: "eingestellt",
  };
  const gameStatus = statusLabels[(game.status as number) ?? -1];

  const lines: string[] = [
    `Name: ${game.name}`,
    `Entwickler: ${developers.join(", ") || "Unbekannt"}`,
    `Publisher: ${publishers.join(", ") || "Unbekannt"}`,
    `Plattformen: ${platforms.join(", ") || "N/A"}`,
    `Genres: ${genres.join(", ") || "N/A"}`,
    `Spielmodi: ${gameModes.join(", ") || "N/A"}`,
    `Perspektive: ${perspectives.join(", ") || "N/A"}`,
    `Erscheinungsdatum: ${releaseDate}`,
    gameCategory ? `Spieltyp: ${gameCategory}` : "",
    gameStatus ? `Status: ${gameStatus}` : "",
    engines.length ? `Game-Engines: ${engines.join(", ")}` : "",
    themes.length ? `Themen: ${themes.join(", ")}` : "",
    keywords.length ? `Schlagwörter: ${keywords.join(", ")}` : "",
    franchise ? `Franchise: ${franchise}` : "",
    collections.length ? `Collection: ${collections.join(", ")}` : "",
    formatAgeRating(game.age_ratings) ? `Altersfreigabe: ${formatAgeRating(game.age_ratings)}` : "",
    languages.length
      ? `Unterstützte Sprachen (UI/Untertitel): ${languages.join(", ")}`
      : "",
    formatTimeToBeat(game.time_to_beat?.hastly)
      ? `Spieldauer (Hauptstory): ${formatTimeToBeat(game.time_to_beat?.hastly)}`
      : "",
    formatTimeToBeat(game.time_to_beat?.completely)
      ? `Spieldauer (100%): ${formatTimeToBeat(game.time_to_beat?.completely)}`
      : "",
    game.rating
      ? `IGDB-Community-Bewertung: ${Number(game.rating).toFixed(1)}/100`
      : "",
    game.aggregated_rating
      ? `IGDB-Kritiker-Bewertung: ${Number(game.aggregated_rating).toFixed(1)}/100`
      : "",
    steamData?.metacriticScore
      ? `Metacritic: ${steamData.metacriticScore}/100`
      : "",
    steamData?.reviewSummary?.percentPositive != null &&
    steamData.reviewSummary.total > 0
      ? `Steam-Nutzerbewertung: ${steamData.reviewSummary.percentPositive}% positiv (${steamData.reviewSummary.description || "aus " + steamData.reviewSummary.total + " Rezensionen"})`
      : "",
    steamData?.recommendations ? `Steam-Empfehlungen: ${steamData.recommendations}` : "",
    steamData?.priceFormatted ? `Aktueller Preis (Steam): ${steamData.priceFormatted}` : "",
    `Zusammenfassung: ${game.summary || "N/A"}`,
    game.storyline ? `Storyline: ${game.storyline.substring(0, 1200)}` : "",
    similarGames.length
      ? `Ähnliche Spiele für den Vergleich: ${similarGames.join(", ")}`
      : "",
  ];

  // Tavily research summary
  if (tavilyResults) {
    // buildGameResearchSummary is imported from tavily; we inline the call
    // via the processor that has access to it.
  }

  return lines.filter(Boolean);
}

/**
 * Fetches store IDs and Steam data for a game. Both are best-effort.
 */
async function enrichGameData(
  game: IGDBGame
): Promise<{ storeIds: StoreIds; steamData: SteamGameInfo | null }> {
  let storeIds: StoreIds = {};
  let steamData: SteamGameInfo | null = null;

  try {
    const { findStoreIds } = await import("../store-search");
    storeIds = await findStoreIds(game.name, game.id);
  } catch (error) {
    console.warn(
      `⚠️  Could not fetch store IDs for ${game.name}:`,
      error instanceof Error ? error.message : String(error)
    );
  }

  if (storeIds.steamAppId) {
    try {
      const { getSteamAppDetails, getSteamReviewSummary } = await import(
        "../steam"
      );
      let steamDetails: SteamGameInfo | null = null;
      let steamReviews: { percentPositive: number; total: number; description: string } | null = null;

      try {
        steamDetails = await getSteamAppDetails(storeIds.steamAppId);
      } catch {
        // Non-blocking
      }
      try {
        steamReviews = await getSteamReviewSummary(storeIds.steamAppId);
      } catch {
        // Non-blocking
      }

      if (steamDetails) {
        steamData = steamDetails;
        if (steamReviews) {
          steamData.reviewSummary = steamReviews;
        }
      }
    } catch (error) {
      console.warn(
        `⚠️  Steam enrichment failed for ${game.name}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  return { storeIds, steamData };
}

/**
 * Builds game metadata for storage.
 */
function buildGameMetadata(
  game: IGDBGame,
  steamData: SteamGameInfo | null,
  storeIds: StoreIds
): Record<string, unknown> {
  return {
    developers: extractDevelopers(game.involved_companies),
    publishers: extractPublishers(game.involved_companies),
    platforms: (game.platforms || []).map((p) => p.name),
    genres: (game.genres || []).map((g) => g.name),
    gameModes: (game.game_modes || []).map((m) => m.name),
    perspectives: (game.player_perspectives || []).map((p) => p.name),
    engines: (game.game_engines || []).map((e) => e.name),
    releaseDate: game.first_release_date,
    igdbScore: game.rating,
    criticScore:
      game.aggregated_rating ?? steamData?.metacriticScore ?? undefined,
    ageRating: formatAgeRating(game.age_ratings),
    timeToBeat: {
      hastly: game.time_to_beat?.hastly ?? undefined,
      normally: game.time_to_beat?.normally ?? undefined,
      completely: game.time_to_beat?.completely ?? undefined,
    },
    similarGames: ((game.similar_games || []) as Array<{ name: string }>).map(
      (s) => s.name
    ),
    franchise: (game.franchise as { name?: string } | undefined)?.name,
    steamMetacritic: steamData?.metacriticScore ?? undefined,
    steamRatingPercent: steamData?.reviewSummary?.percentPositive ?? undefined,
    steamTotalReviews: steamData?.reviewSummary?.total ?? undefined,
    steamPrice: steamData?.priceFormatted ?? undefined,
    stores: storeIds.stores || [],
  };
}

/**
 * Processes a single game: generates a full review and persists it.
 */
export async function processGame(
  gameData: IGDBGame,
  options: ProcessOptions
): Promise<ProcessResult> {
  try {
    // 1. Duplicate check by IGDB ID
    const existingById = await prisma.review.findFirst({
      where: { igdbId: gameData.id },
    });
    if (existingById) {
      return { success: false, error: "Already exists" };
    }

    // 2. Enrichment: store IDs + Steam data
    const { storeIds, steamData } = await enrichGameData(gameData);

    // 3. Generate review content (with Steam + Tavily context)
    const reviewContent = await generateReviewContent(gameData, 0, {
      steamData,
    });

    // 4. Slug generation (deterministic)
    const baseSlug = buildBaseSlug(
      reviewContent.de.title,
      gameData.name
    );
    const slug = await ensureUniqueSlug(baseSlug);

    // 5. Upload images in parallel
    const [coverUrls, screenshotUrls] = await Promise.all([
      uploadGameCover(gameData.cover?.url, slug),
      uploadGameScreenshots(gameData.screenshots, slug),
    ]);
    const imageUrls = [...coverUrls, ...screenshotUrls];

    // 6. Future release check
    const now = new Date();
    const releaseDate = gameData.first_release_date
      ? new Date(gameData.first_release_date * 1000)
      : null;
    const isFutureRelease =
      releaseDate !== null && releaseDate > now;
    const finalStatus = isFutureRelease ? "draft" : options.status;

    // 7. YouTube videos
    const youtubeVideos = extractYouTubeVideoIdsFromIGDB(gameData);

    // 8. Replace image placeholders
    const { contentDe, contentEn } = applyImagePlaceholders(
      reviewContent.de.content,
      reviewContent.en.content,
      imageUrls,
      gameData.name
    );

    // 9. SEO metadata
    const { metaDescription, metaKeywords } = await generateSeoMetadataSafe(
      reviewContent.de.title,
      contentDe,
      "game"
    );

    // 10. Score
    const score = clampScore(reviewContent.score);

    // 11. Metadata
    const metadata = buildGameMetadata(gameData, steamData, storeIds);

    // 12. Create review in a transaction
    const review = await createReviewInTransaction({
      title: reviewContent.de.title,
      title_en: reviewContent.en.title,
      slug,
      category: "game",
      content: contentDe,
      content_en: contentEn,
      score,
      pros: reviewContent.de.pros,
      pros_en: reviewContent.en.pros,
      cons: reviewContent.de.cons,
      cons_en: reviewContent.en.cons,
      images: imageUrls,
      youtubeVideos,
      status: finalStatus,
      igdbId: gameData.id,
      steamAppId: storeIds.steamAppId ?? null,
      epicId: storeIds.epicId ?? null,
      gogId: storeIds.gogId ?? null,
      specs: reviewContent.specs as unknown as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined,
      metadata,
      metaDescription,
      metaKeywords,
      releaseDate: releaseDate ?? null,
      createdAt: calculatePublicationDate(
        gameData.first_release_date ?? undefined
      ),
    });

    // 13. Side effects (non-blocking)
    await runSideEffects(review.id, {
      reviewTitle: reviewContent.de.title,
      score,
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "game",
      contentExcerpt: reviewContent.de.content.substring(0, 500),
      metadata: {
        genres: (gameData.genres || []).map((g: IGDBGameGenre) => g.name),
        platforms: (gameData.platforms || []).map((p: IGDBGamePlatform) => p.name),
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error processing game ${gameData.name}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Generates review content for a game, including Tavily research context.
 * Backward-compatible signature: accepts IGDBGame + options, returns
 * GeneratedReviewContent. Used by legacy callers (auto-generate route, etc.).
 */
export async function generateReviewContent(
  gameData: IGDBGame,
  retryCount = 0,
  options?: {
    steamData?: SteamGameInfo | null;
    tavilySearchResults?: TavilySearchResponse;
  }
): Promise<GeneratedReviewContent> {
  const steamData = options?.steamData ?? null;
  const tavilyResults = options?.tavilySearchResults ?? null;

  const contextLines = buildGameContextLines(gameData, steamData, tavilyResults);

  const sections = [
    { de: "Einleitung", en: "Introduction", description: "Stimme den Leser ein: Worum geht es, warum ist das Spiel relevant, Einordnung in Serie und Genre." },
    { de: "Story & Erzählung", en: "Story & Narrative", description: "Handlung, Erzählstruktur, Charaktere, Dialoge, Tempo und Wendepunkte – ohne die Handlung komplett zu spoilern." },
    { de: "Gameplay & Mechaniken", en: "Gameplay & Mechanics", description: "Kernmechaniken, Steuerung, Systeme, Schwierigkeitsgrad, Spielspaß und Innovationen." },
    { de: "Grafik & Präsentation", en: "Graphics & Presentation", description: "Art Direction, technische Umsetzung, Performance, Framerate, Ladezeiten und die Haptik der Spielwelt." },
    { de: "Sound & Musik", en: "Sound & Music", description: "Soundtrack, Sounddesign, Sprachausgabe und deren Wirkung auf die Atmosphäre." },
    { de: "Inhalt & Wiederspielwert", en: "Content & Replayability", description: "Umfang, Abwechslung, Nebenaktivitäten, Endgame und Community beziehungsweise Mods." },
    { de: "Technik & Performance", en: "Performance & Technical Aspects", description: "Optimierung, Bugs, Plattform-Unterschiede und Stabilität." },
    { de: "Vergleich mit ähnlichen Spielen", en: "Comparison with Similar Games", description: "Direkte Vergleiche mit Genrekollegen und Vorgängern." },
    { de: "Für wen lohnt sich das Spiel?", en: "Who Is This Game For?", description: "Zielgruppe, nötige Spielerfahrung und Preis-Leistungs-Betrachtung." },
    { de: "Fazit", en: "Verdict", description: "Gesamturteil, Begründung des Scores und klare Kaufempfehlung." },
  ];

  const referenceRatings: string[] = [];
  if (gameData.rating) referenceRatings.push(`IGDB ${Number(gameData.rating).toFixed(1)}/100`);
  if (gameData.aggregated_rating) referenceRatings.push(`IGDB-Kritiker ${Number(gameData.aggregated_rating).toFixed(1)}/100`);
  if (steamData?.metacriticScore) referenceRatings.push(`Metacritic ${steamData.metacriticScore}/100`);
  if (steamData?.reviewSummary?.percentPositive != null) referenceRatings.push(`Steam ${steamData.reviewSummary.percentPositive}% positiv`);

  const scoreBand = computeGameScoreBand([
    gameData.rating,
    gameData.aggregated_rating,
    steamData?.metacriticScore,
    steamData?.reviewSummary?.percentPositive,
  ]);

  const prompt = buildStructuredReviewPrompt({
    category: "game",
    itemName: gameData.name,
    contextLines,
    sections,
    wordTarget: 1800,
    imageCount: 4,
    isRetry: retryCount > 0,
    includeSpecs: true,
    referenceRating: referenceRatings.join("; "),
    scoreBand: scoreBand ?? undefined,
  });

  return generateContent(prompt, gameData.name, retryCount);
}

/**
 * Enriches and publishes a draft game review (used by cron jobs).
 */
export async function enrichAndPublishDraftGameReview(
  reviewId: string
): Promise<ProcessResult> {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, slug: true, igdbId: true, category: true, status: true },
    });

    if (!review || review.category !== "game") {
      return { success: false, error: "Review not found or not a game" };
    }
    if (review.status !== "draft") {
      return { success: false, error: "Review is not a draft" };
    }
    if (review.igdbId == null) {
      return { success: false, error: "Review has no igdbId" };
    }

    const gameData = await getIGDBGameById(review.igdbId);
    if (!gameData) {
      return { success: false, error: "IGDB game not found" };
    }

    const { storeIds, steamData } = await enrichGameData(gameData);
    const reviewContent = await generateReviewContent(gameData, 0, {
      steamData,
    });
    const slug = review.slug;

    const [coverUrls, screenshotUrls] = await Promise.all([
      uploadGameCover(gameData.cover?.url, slug),
      uploadGameScreenshots(gameData.screenshots, slug),
    ]);
    const imageUrls = [...coverUrls, ...screenshotUrls];

    const metadata = buildGameMetadata(gameData, steamData, storeIds);
    const releaseDate = gameData.first_release_date
      ? new Date(gameData.first_release_date * 1000)
      : null;
    const youtubeVideos = extractYouTubeVideoIdsFromIGDB(gameData);

    const { contentDe, contentEn } = applyImagePlaceholders(
      reviewContent.de.content,
      reviewContent.en.content,
      imageUrls,
      gameData.name
    );

    const { metaDescription, metaKeywords } = await generateSeoMetadataSafe(
      reviewContent.de.title,
      contentDe,
      "game"
    );

    await updateReview(reviewId, {
      title: reviewContent.de.title,
      title_en: reviewContent.en.title,
      content: contentDe,
      content_en: contentEn,
      score: clampScore(reviewContent.score),
      pros: reviewContent.de.pros,
      pros_en: reviewContent.en.pros,
      cons: reviewContent.de.cons,
      cons_en: reviewContent.en.cons,
      images: imageUrls,
      youtubeVideos,
      status: "published",
      steamAppId: storeIds.steamAppId ?? null,
      epicId: storeIds.epicId ?? null,
      gogId: storeIds.gogId ?? null,
      specs: reviewContent.specs as unknown as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined,
      metadata,
      metaDescription,
      metaKeywords,
      releaseDate: releaseDate ?? null,
    });

    await runSideEffects(reviewId, {
      reviewTitle: reviewContent.de.title,
      score: clampScore(reviewContent.score),
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "game",
      contentExcerpt: reviewContent.de.content.substring(0, 500),
      metadata: {
        genres: (gameData.genres || []).map((g: IGDBGameGenre) => g.name),
        platforms: (gameData.platforms || []).map((p: IGDBGamePlatform) => p.name),
      },
    });

    return { success: true, reviewId };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error enriching draft game review ${reviewId}:`, err);
    return { success: false, error: err.message };
  }
}
