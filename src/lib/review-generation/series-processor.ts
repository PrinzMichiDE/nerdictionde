/**
 * review-generation — Series processor
 *
 * End-to-end processing of a single series review: duplicate check, AI
 * content generation, image upload, SEO, DB creation and side effects.
 */

import prisma from "@/lib/prisma";
import { getTMDBImageUrl, getTMDBSeriesById } from "@/lib/tmdb";
import { extractYouTubeVideoIdsFromTMDB } from "@/lib/youtube-extraction";
import {
  uploadPoster,
  uploadBackdrops,
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
  computeScoreBand,
} from "./prompt-builder";
import {
  generateSeoMetadataSafe,
  applyImagePlaceholders,
  createReviewInTransaction,
  runSideEffects,
  clampScore,
} from "./base-processor";
import type {
  TMDBSeries,
  ProcessOptions,
  ProcessResult,
  GeneratedReviewContent,
} from "./types";

/**
 * Builds context lines for the series review prompt.
 */
function buildSeriesContextLines(
  series: TMDBSeries,
  tavilyResults: unknown
): string[] {
  const cast = (series.credits?.cast || [])
    .slice(0, 8)
    .map((c) => (c.character ? `${c.name} als ${c.character}` : c.name));
  const creators = (series.created_by || []).map((c) => c.name);
  const directors = (series.credits?.crew || [])
    .filter((c) => c.job === "Director")
    .map((c) => c.name);
  const writers = (series.credits?.crew || [])
    .filter((c) => ["Writer", "Screenplay", "Story", "Creator"].includes(c.job))
    .map((c) => c.name);

  const lines: string[] = [
    `Titel: ${series.name}`,
    `Originaltitel: ${series.original_name || "N/A"}`,
    `Genres: ${series.genres?.map((g) => g.name).join(", ") || "N/A"}`,
    `Erstausstrahlung: ${series.first_air_date || "N/A"}`,
    series.status ? `Status: ${series.status}` : "",
    series.last_air_date ? `Letzte Ausstrahlung: ${series.last_air_date}` : "",
    creators.length > 0
      ? `Erdacht von / Creator: ${creators.slice(0, 5).join(", ")}`
      : "",
    `Regie: ${directors.slice(0, 5).join(", ") || "N/A"}`,
    `Autoren: ${[...new Set(writers)].slice(0, 5).join(", ") || "N/A"}`,
    cast.length > 0 ? `Besetzung: ${[...new Set(cast)].join(", ")}` : "",
    series.number_of_seasons ? `Staffeln: ${series.number_of_seasons}` : "",
    series.number_of_episodes ? `Folgen: ${series.number_of_episodes}` : "",
    series.vote_average
      ? `TMDB-Bewertung: ${Number(series.vote_average).toFixed(1)}/10 (${series.vote_count || 0} Stimmen)`
      : "",
    series.external_ids?.imdb_id ? `IMDb-ID: ${series.external_ids.imdb_id}` : "",
    series.production_companies?.length
      ? `Produktionsfirmen: ${series.production_companies.map((c) => c.name).join(", ")}`
      : "",
    series.production_countries?.length
      ? `Produktionsländer: ${series.production_countries.map((c) => c.name).join(", ")}`
      : "",
    series.spoken_languages?.length
      ? `Sprachen: ${series.spoken_languages.map((l) => l.name).join(", ")}`
      : "",
    `Handlung: ${series.overview || "N/A"}`,
  ];

  if (tavilyResults) {
    // Research summary would be appended here from tavily
  }

  return lines.filter(Boolean);
}

/**
 * Builds series metadata for storage.
 */
function buildSeriesMetadata(series: TMDBSeries): Record<string, unknown> {
  return {
    genres: series.genres?.map((g) => g.name) || [],
    production_companies: series.production_companies?.map((c) => c.name) || [],
    production_countries: series.production_countries?.map((c) => c.name) || [],
    spoken_languages: series.spoken_languages?.map((l) => l.name) || [],
    first_air_date: series.first_air_date || undefined,
    last_air_date: series.last_air_date || undefined,
    status: series.status || undefined,
    number_of_seasons: series.number_of_seasons || undefined,
    number_of_episodes: series.number_of_episodes || undefined,
    tmdb_score: series.vote_average,
    vote_count: series.vote_count,
    popularity: series.popularity,
    created_by: (series.created_by || []).map((c) => c.name),
    cast: (series.credits?.cast || []).slice(0, 8).map((c) => c.name),
    original_name: series.original_name || undefined,
  };
}

/**
 * Processes a single series: generates a full review and persists it.
 */
export async function processSeries(
  seriesData: TMDBSeries,
  options: ProcessOptions
): Promise<ProcessResult> {
  try {
    // 1. Duplicate check by TMDB ID
    const existingById = await prisma.review.findFirst({
      where: { tmdbId: seriesData.id, category: "series" },
    });
    if (existingById) return { success: false, error: "Already exists" };

    // 2. Generate review content (with Tavily context)
    const reviewContent = await generateReviewContentForSeries(seriesData);

    // 3. Slug generation (deterministic)
    const baseSlug = buildBaseSlug(
      reviewContent.de.title,
      seriesData.name
    );
    const slug = await ensureUniqueSlug(baseSlug);

    // 4. Upload images in parallel
    const [posterUrls, backdropUrls] = await Promise.all([
      uploadPoster(seriesData.poster_path, getTMDBImageUrl, slug),
      uploadBackdrops(
        seriesData.images?.backdrops,
        getTMDBImageUrl,
        slug
      ),
    ]);
    const imageUrls = [...posterUrls, ...backdropUrls];

    // 5. Future release check
    const now = new Date();
    const releaseDate = seriesData.first_air_date
      ? new Date(seriesData.first_air_date)
      : null;
    const isFutureRelease =
      releaseDate !== null && releaseDate > now;
    const finalStatus = isFutureRelease ? "draft" : options.status;

    // 6. YouTube videos
    const youtubeVideos = extractYouTubeVideoIdsFromTMDB(seriesData.videos);

    // 7. Replace image placeholders
    const { contentDe, contentEn } = applyImagePlaceholders(
      reviewContent.de.content,
      reviewContent.en.content,
      imageUrls,
      seriesData.name
    );

    // 8. SEO metadata
    const { metaDescription, metaKeywords } = await generateSeoMetadataSafe(
      reviewContent.de.title,
      contentDe,
      "series"
    );

    // 9. Metadata
    const metadata = buildSeriesMetadata(seriesData);

    // 10. Create review in a transaction
    const review = await createReviewInTransaction({
      title: reviewContent.de.title,
      title_en: reviewContent.en.title,
      slug,
      category: "series",
      content: contentDe,
      content_en: contentEn,
      score: clampScore(reviewContent.score),
      pros: reviewContent.de.pros,
      pros_en: reviewContent.en.pros,
      cons: reviewContent.de.cons,
      cons_en: reviewContent.en.cons,
      images: imageUrls,
      youtubeVideos,
      status: finalStatus,
      tmdbId: seriesData.id,
      metadata,
      metaDescription,
      metaKeywords,
      createdAt: seriesData.first_air_date
        ? new Date(seriesData.first_air_date)
        : new Date(),
    });

    // 11. Side effects (non-blocking)
    await runSideEffects(review.id, {
      reviewTitle: reviewContent.de.title,
      score: clampScore(reviewContent.score),
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "series",
      contentExcerpt: reviewContent.de.content.substring(0, 500),
      metadata: {
        genres: seriesData.genres?.map((g) => g.name),
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error processing series ${seriesData.name}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Generates review content for a series, including Tavily research context.
 * Exported for backward compatibility as generateSeriesReviewContent.
 */
export async function generateReviewContentForSeries(
  series: TMDBSeries
): Promise<GeneratedReviewContent> {
  let tavilyResults: unknown;
  try {
    const { searchSeriesProduct } = await import("../tavily");
    tavilyResults = await searchSeriesProduct(
      series.name,
      series.first_air_date ? new Date(series.first_air_date).getFullYear() : undefined
    );
  } catch (error) {
    console.warn(
      `⚠️  Tavily search failed for ${series.name}:`,
      error instanceof Error ? error.message : String(error)
    );
    tavilyResults = null;
  }

  const contextLines = buildSeriesContextLines(series, tavilyResults);

  const sections = [
    { de: "Einleitung", en: "Introduction", description: "Stimme den Leser ein: Worum geht es, warum ist die Serie relevant, Erwartungen." },
    { de: "Handlung & Setting", en: "Plot & Setting", description: "Grundkonzept, Welt, Prämisse und Erzählstruktur – ohne zentrale Twists zu spoilern." },
    { de: "Charaktere & Schauspiel", en: "Characters & Acting", description: "Cast, Figurenentwicklung und die Chemie im Ensemble." },
    { de: "Staffeln & Episodenstruktur", en: "Seasons & Episode Structure", description: "Pacing, Staffelbögen, Füllmaterial und Dramaturgie über mehrere Folgen hinweg." },
    { de: "Regie, Inszenierung & Bildsprache", en: "Direction, Cinematography & Visuals", description: "Kamera, Schnitt, Farbgebung und visueller Stil der Serie." },
    { de: "Musik & Sounddesign", en: "Music & Sound Design", description: "Score, Titelsong, Sounddesign und deren atmosphärische Wirkung." },
    { de: "Themen & Tiefe", en: "Themes & Depth", description: "Zentrale Themen, Erzähltiefe und gesellschaftliche Relevanz." },
    { de: "Vergleich mit ähnlichen Serien", en: "Comparison with Similar Series", description: "Einordnung in das Genre und Vergleiche mit verwandten Serien." },
    { de: "Binge-Würdigkeit", en: "Binge-worthiness", description: "Suchtfaktor, empfohlene Sehweise und ob sich das Warten auf neue Staffeln lohnt." },
    { de: "Fazit", en: "Verdict", description: "Gesamturteil, Begründung des Scores und klare Empfehlung." },
  ];

  const prompt = buildStructuredReviewPrompt({
    category: "series",
    itemName: series.name,
    contextLines,
    sections,
    wordTarget: 1800,
    imageCount: 4,
    isRetry: false,
    referenceRating: series.vote_average ? `${Number(series.vote_average).toFixed(1)}/10` : undefined,
    scoreBand: series.vote_average ? computeScoreBand(Number(series.vote_average)) : undefined,
  });

  return generateContent(prompt, series.name);
}

/**
 * Regenerates a zero-score series review.
 */
export async function regenerateZeroScoreSeriesReview(
  reviewId: string,
  seriesData: TMDBSeries
): Promise<{ success: boolean; newScore?: number; error?: string }> {
  try {
    const reviewContent = await generateReviewContentForSeries(seriesData);

    const { contentDe, contentEn } = applyImagePlaceholders(
      reviewContent.de.content,
      reviewContent.en.content,
      [],
      seriesData.name
    );

    const { metaDescription, metaKeywords } = await generateSeoMetadataSafe(
      reviewContent.de.title,
      contentDe,
      "series"
    );

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        content: contentDe,
        content_en: contentEn,
        score: clampScore(reviewContent.score),
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        metaDescription,
        metaKeywords,
      },
    });

    await runSideEffects(reviewId, {
      reviewTitle: reviewContent.de.title,
      score: clampScore(reviewContent.score),
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "series",
      contentExcerpt: reviewContent.de.content.substring(0, 500),
    });

    return { success: true, newScore: clampScore(reviewContent.score) };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}
