/**
 * review-generation — Movie processor
 *
 * End-to-end processing of a single movie review: duplicate check, AI
 * content generation, image upload, SEO, DB creation and side effects.
 */

import prisma from "@/lib/prisma";
import { getTMDBImageUrl, getTMDBMovieById } from "@/lib/tmdb";
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
  TMDBMovie,
  ProcessOptions,
  ProcessResult,
  GeneratedReviewContent,
} from "./types";

/**
 * Builds context lines for the movie review prompt.
 */
function buildMovieContextLines(
  movie: TMDBMovie,
  tavilyResults: unknown
): string[] {
  const cast = (movie.credits?.cast || [])
    .slice(0, 8)
    .map((c) => (c.character ? `${c.name} als ${c.character}` : c.name));
  const directors = (movie.credits?.crew || [])
    .filter((c) => c.job === "Director")
    .map((c) => c.name);
  const writers = (movie.credits?.crew || [])
    .filter((c) => ["Writer", "Screenplay", "Story", "Screenstory", "Novel"].includes(c.job))
    .map((c) => c.name);

  const lines: string[] = [
    `Titel: ${movie.title}`,
    `Originaltitel: ${movie.original_title || "N/A"}`,
    `Genres: ${movie.genres?.map((g) => g.name).join(", ") || "N/A"}`,
    `Erscheinungsdatum: ${movie.release_date || "N/A"}`,
    movie.runtime ? `Laufzeit: ${movie.runtime} Minuten` : "",
    `Regie: ${directors.slice(0, 5).join(", ") || "N/A"}`,
    `Drehbuch: ${[...new Set(writers)].slice(0, 5).join(", ") || "N/A"}`,
    cast.length > 0 ? `Besetzung: ${[...new Set(cast)].join(", ")}` : "",
    movie.vote_average
      ? `TMDB-Bewertung: ${Number(movie.vote_average).toFixed(1)}/10 (${movie.vote_count || 0} Stimmen)`
      : "",
    movie.external_ids?.imdb_id ? `IMDb-ID: ${movie.external_ids.imdb_id}` : "",
    movie.production_companies?.length
      ? `Produktionsfirmen: ${movie.production_companies.map((c) => c.name).join(", ")}`
      : "",
    movie.production_countries?.length
      ? `Produktionsländer: ${movie.production_countries.map((c) => c.name).join(", ")}`
      : "",
    movie.spoken_languages?.length
      ? `Sprachen: ${movie.spoken_languages.map((l) => l.name).join(", ")}`
      : "",
    `Handlung: ${movie.overview || "N/A"}`,
  ];

  if (tavilyResults) {
    // Research summary would be appended here from tavily
  }

  return lines.filter(Boolean);
}

/**
 * Builds movie metadata for storage.
 */
function buildMovieMetadata(movie: TMDBMovie): Record<string, unknown> {
  return {
    genres: movie.genres?.map((g) => g.name) || [],
    production_companies: movie.production_companies?.map((c) => c.name) || [],
    production_countries: movie.production_countries?.map((c) => c.name) || [],
    spoken_languages: movie.spoken_languages?.map((l) => l.name) || [],
    release_date: movie.release_date || undefined,
    runtime: movie.runtime || undefined,
    tmdb_score: movie.vote_average,
    vote_count: movie.vote_count,
    popularity: movie.popularity,
    director: (movie.credits?.crew || [])
      .filter((c) => c.job === "Director")
      .map((c) => c.name),
    cast: (movie.credits?.cast || []).slice(0, 8).map((c) => c.name),
    original_title: movie.original_title || undefined,
  };
}

/**
 * Processes a single movie: generates a full review and persists it.
 */
export async function processMovie(
  movieData: TMDBMovie,
  options: ProcessOptions
): Promise<ProcessResult> {
  try {
    // 1. Duplicate check by TMDB ID
    const existingById = await prisma.review.findFirst({
      where: { tmdbId: movieData.id, category: "movie" },
    });
    if (existingById) return { success: false, error: "Already exists" };

    // 2. Generate review content (with Tavily context)
    const reviewContent = await generateReviewContentForMovie(movieData);

    // 3. Score
    const referenceScore = Number(movieData.vote_average);
    const score = clampScore(
      Number.isFinite(Number(reviewContent.score))
        ? Math.min(100, Math.max(0, Math.round(Number(reviewContent.score))))
        : Number.isFinite(referenceScore) && referenceScore > 0
          ? Math.round(referenceScore * 10)
          : 70
    );

    // 4. Slug generation (deterministic)
    const baseSlug = buildBaseSlug(
      reviewContent.de.title,
      movieData.title
    );
    const slug = await ensureUniqueSlug(baseSlug);

    // 5. Upload images in parallel
    const [posterUrls, backdropUrls] = await Promise.all([
      uploadPoster(movieData.poster_path, getTMDBImageUrl, slug),
      uploadBackdrops(
        movieData.images?.backdrops,
        getTMDBImageUrl,
        slug
      ),
    ]);
    const imageUrls = [...posterUrls, ...backdropUrls];

    // 6. Future release check
    const now = new Date();
    const releaseDate = movieData.release_date
      ? new Date(movieData.release_date)
      : null;
    const isFutureRelease =
      releaseDate !== null && releaseDate > now;
    const finalStatus = isFutureRelease ? "draft" : options.status;

    // 7. YouTube videos
    const youtubeVideos = extractYouTubeVideoIdsFromTMDB(movieData.videos);

    // 8. Replace image placeholders
    const { contentDe, contentEn } = applyImagePlaceholders(
      reviewContent.de.content,
      reviewContent.en.content,
      imageUrls,
      movieData.title
    );

    // 9. SEO metadata
    const { metaDescription, metaKeywords } = await generateSeoMetadataSafe(
      reviewContent.de.title,
      contentDe,
      "movie"
    );

    // 10. Metadata
    const metadata = buildMovieMetadata(movieData);

    // 11. Create review in a transaction
    const review = await createReviewInTransaction({
      title: reviewContent.de.title,
      title_en: reviewContent.en.title,
      slug,
      category: "movie",
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
      tmdbId: movieData.id,
      metadata,
      metaDescription,
      metaKeywords,
      createdAt: movieData.release_date
        ? new Date(movieData.release_date)
        : new Date(),
    });

    // 12. Side effects (non-blocking)
    await runSideEffects(review.id, {
      reviewTitle: reviewContent.de.title,
      score,
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "movie",
      contentExcerpt: reviewContent.de.content.substring(0, 500),
      metadata: { genres: movieData.genres?.map((g) => g.name) },
    });

    return { success: true, reviewId: review.id };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error processing movie ${movieData.title}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Generates review content for a movie, including Tavily research context.
 * Exported for backward compatibility as generateMovieReviewContent.
 */
export async function generateReviewContentForMovie(
  movie: TMDBMovie
): Promise<GeneratedReviewContent> {
  let tavilyResults: unknown;
  try {
    const { searchMovieProduct } = await import("../tavily");
    tavilyResults = await searchMovieProduct(
      movie.title,
      movie.release_date ? new Date(movie.release_date).getFullYear() : undefined
    );
  } catch (error) {
    console.warn(
      `⚠️  Tavily search failed for ${movie.title}:`,
      error instanceof Error ? error.message : String(error)
    );
    tavilyResults = null;
  }

  const contextLines = buildMovieContextLines(movie, tavilyResults);

  const sections = [
    { de: "Einleitung", en: "Introduction", description: "Stimme den Leser ein: Kontext, Erwartungen und erster Eindruck ohne Spoiler." },
    { de: "Handlung & Erzählung", en: "Plot & Narrative", description: "Erzählstruktur, Tempo, Wendepunkte und Dialoge – ohne das komplette Ende zu spoilern." },
    { de: "Schauspiel & Charaktere", en: "Acting & Characters", description: "Performances, Chemie zwischen den Darstellern und Charakterentwicklung." },
    { de: "Regie & Inszenierung", en: "Direction & Cinematography", description: "Regie, Kamera, Schnitt, Bildsprache und visueller Stil." },
    { de: "Musik & Sounddesign", en: "Music & Sound Design", description: "Score, Soundtrack, Soundeffekte und deren emotionale Wirkung." },
    { de: "Visuelle Effekte & Technik", en: "Visual Effects & Technical Craft", description: "VFX, Produktionsdesign, Ausstattung und technische Umsetzung." },
    { de: "Themen & Botschaft", en: "Themes & Message", description: "Zentrale Themen, gesellschaftliche Relevanz und emotionale Tiefe." },
    { de: "Vergleich mit ähnlichen Filmen", en: "Comparison with Similar Films", description: "Einordnung in das Genre und Vergleiche mit verwandten Werken." },
    { de: "Für wen lohnt sich der Film?", en: "Who Is This Film For?", description: "Zielgruppe, Sehgewohnheit und Preis-Leistung (Kino oder Streaming)." },
    { de: "Fazit", en: "Verdict", description: "Gesamturteil, Begründung des Scores und klare Empfehlung." },
  ];

  const prompt = buildStructuredReviewPrompt({
    category: "movie",
    itemName: movie.title,
    contextLines,
    sections,
    wordTarget: 1800,
    imageCount: 4,
    isRetry: false,
    referenceRating: movie.vote_average ? `${Number(movie.vote_average).toFixed(1)}/10` : undefined,
    scoreBand: movie.vote_average ? computeScoreBand(Number(movie.vote_average)) : undefined,
  });

  return generateContent(prompt, movie.title);
}

/**
 * Regenerates a zero-score movie review.
 */
export async function regenerateZeroScoreMovieReview(
  reviewId: string,
  movieData: TMDBMovie
): Promise<{ success: boolean; newScore?: number; error?: string }> {
  try {
    const reviewContent = await generateReviewContentForMovie(movieData);
    const imagesToUse = reviewContent.de.content ? [] : [];

    const { contentDe, contentEn } = applyImagePlaceholders(
      reviewContent.de.content,
      reviewContent.en.content,
      [],
      movieData.title
    );

    const { metaDescription, metaKeywords } = await generateSeoMetadataSafe(
      reviewContent.de.title,
      contentDe,
      "movie"
    );

    await updateReviewInTransaction(reviewId, {
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
    });

    await runSideEffects(reviewId, {
      reviewTitle: reviewContent.de.title,
      score: clampScore(reviewContent.score),
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "movie",
      contentExcerpt: reviewContent.de.content.substring(0, 500),
    });

    return { success: true, newScore: clampScore(reviewContent.score) };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

async function updateReviewInTransaction(
  reviewId: string,
  data: {
    title: string;
    title_en: string;
    content: string;
    content_en: string;
    score: number;
    pros: string[];
    pros_en: string[];
    cons: string[];
    cons_en: string[];
    metaDescription?: string | null;
    metaKeywords?: string | null;
  }
): Promise<void> {
  await prisma.review.update({
    where: { id: reviewId },
    data: {
      title: data.title,
      title_en: data.title_en,
      content: data.content,
      content_en: data.content_en,
      score: data.score,
      pros: data.pros,
      pros_en: data.pros_en,
      cons: data.cons,
      cons_en: data.cons_en,
      metaDescription: data.metaDescription ?? null,
      metaKeywords: data.metaKeywords ?? null,
    },
  });
}
