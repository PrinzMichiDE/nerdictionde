/**
 * Backfill review images from IGDB (games), TMDB (movies/series) and Tavily
 * (hardware). Dry-run by default; pass --apply to write.
 *
 * Usage:
 *   npx tsx scripts/backfill-review-images.ts
 *   npx tsx scripts/backfill-review-images.ts --apply
 *   npx tsx scripts/backfill-review-images.ts --category=game --limit=3
 */

import prisma from "../src/lib/prisma";
import { searchIGDB } from "../src/lib/igdb";
import {
  getTMDBImageUrl,
  searchTMDBMovies,
  searchTMDBSeries,
} from "../src/lib/tmdb";
import { extractTavilyImages, searchHardwareProduct } from "../src/lib/tavily";
import { put } from "@vercel/blob";

type Category = "game" | "movie" | "series" | "hardware";

interface ResolvedImage {
  url: string;
  label: string;
}

interface CategoryResult {
  category: Category;
  titles: number;
  matched: number;
  reviewsUpdated: number;
  unmatched: string[];
  errors: string[];
}

const ALL_CATEGORIES: Category[] = ["game", "movie", "series", "hardware"];

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const categoryArg = args.find((arg) => arg.startsWith("--category="));
const limitArg = args.find((arg) => arg.startsWith("--limit="));
const categories: Category[] = categoryArg
  ? categoryArg
      .slice("--category=".length)
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is Category =>
        ALL_CATEGORIES.includes(value as Category)
      )
  : ALL_CATEGORIES;
const limit = limitArg ? Math.max(1, Number(limitArg.slice("--limit=".length))) : 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTitle(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenScore(target: string, candidate: string): number {
  const targetTokens = new Set(target.split(" ").filter(Boolean));
  const candidateTokens = new Set(candidate.split(" ").filter(Boolean));
  if (targetTokens.size === 0 || candidateTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of targetTokens) {
    if (candidateTokens.has(token)) overlap += 1;
  }
  return overlap / Math.max(targetTokens.size, candidateTokens.size);
}

function scoreTitle(target: string, candidates: string[]): number {
  const normalizedTarget = normalizeTitle(target);
  let best = 0;
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeTitle(candidate);
    if (!normalizedCandidate) continue;
    if (normalizedCandidate === normalizedTarget) {
      best = Math.max(best, 100);
    } else if (
      normalizedCandidate.startsWith(normalizedTarget) ||
      normalizedTarget.startsWith(normalizedCandidate)
    ) {
      best = Math.max(best, 80);
    } else if (
      normalizedCandidate.includes(normalizedTarget) ||
      normalizedTarget.includes(normalizedCandidate)
    ) {
      best = Math.max(best, 60);
    } else {
      best = Math.max(best, Math.round(tokenScore(normalizedTarget, normalizedCandidate) * 50));
    }
  }
  return best;
}

function igdbImageUrl(url: string, size: "t_720p" | "t_1080p"): string {
  const absolute = url.startsWith("//") ? `https:${url}` : url;
  return absolute.replace("t_thumb", size);
}

function validHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

async function resolveGame(title: string): Promise<ResolvedImage[]> {
  const results = (await searchIGDB(title)) as Array<{
    name?: string;
    cover?: { url?: string } | null;
    screenshots?: Array<{ url?: string }>;
  }>;

  if (!Array.isArray(results) || results.length === 0) return [];

  const ranked = results
    .map((game, index) => ({
      game,
      index,
      score: scoreTitle(title, [game.name ?? ""]),
    }))
    .filter((entry) => entry.game.cover?.url)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const best = ranked[0];
  if (!best || best.score < 50) return [];

  const images: ResolvedImage[] = [];
  const cover = best.game.cover?.url;
  if (cover) {
    images.push({
      url: igdbImageUrl(cover, "t_720p"),
      label: `${best.game.name ?? title} (IGDB cover)`,
    });
  }
  for (const screenshot of best.game.screenshots?.slice(0, 3) ?? []) {
    if (!screenshot.url) continue;
    images.push({
      url: igdbImageUrl(screenshot.url, "t_1080p"),
      label: `${best.game.name ?? title} (IGDB screenshot)`,
    });
  }
  return images;
}

async function resolveMovie(title: string): Promise<ResolvedImage[]> {
  const results = await searchTMDBMovies(title, 10);
  if (results.length === 0) return [];

  const ranked = results
    .map((movie, index) => ({
      movie,
      index,
      score: scoreTitle(title, [movie.title ?? "", movie.original_title ?? ""]),
    }))
    .filter((entry) => entry.movie.poster_path || entry.movie.backdrop_path)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const best = ranked[0];
  if (!best || best.score < 50) return [];

  const images: ResolvedImage[] = [];
  const poster = getTMDBImageUrl(best.movie.poster_path, "w500");
  if (poster) {
    images.push({ url: poster, label: `${best.movie.title ?? title} (TMDB poster)` });
  }
  for (const backdrop of best.movie.images?.backdrops?.slice(0, 2) ?? []) {
    const url = getTMDBImageUrl(backdrop.file_path, "w1280");
    if (url) {
      images.push({ url, label: `${best.movie.title ?? title} (TMDB backdrop)` });
    }
  }
  return images;
}

async function resolveSeries(title: string): Promise<ResolvedImage[]> {
  const results = await searchTMDBSeries(title, 10);
  if (results.length === 0) return [];

  const ranked = results
    .map((series, index) => ({
      series,
      index,
      score: scoreTitle(title, [series.name ?? "", series.original_name ?? ""]),
    }))
    .filter((entry) => entry.series.poster_path || entry.series.backdrop_path)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const best = ranked[0];
  if (!best || best.score < 50) return [];

  const images: ResolvedImage[] = [];
  const poster = getTMDBImageUrl(best.series.poster_path, "w500");
  if (poster) {
    images.push({ url: poster, label: `${best.series.name ?? title} (TMDB poster)` });
  }
  for (const backdrop of best.series.images?.backdrops?.slice(0, 2) ?? []) {
    const url = getTMDBImageUrl(backdrop.file_path, "w1280");
    if (url) {
      images.push({ url, label: `${best.series.name ?? title} (TMDB backdrop)` });
    }
  }
  return images;
}

async function uploadToBlob(
  url: string,
  filename: string
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NerdictionBot/1.0)" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const blob = await response.blob();
    if (blob.size < 5_000) return null;

    const { url: blobUrl } = await put(filename, blob, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });
    return blobUrl;
  } catch {
    return null;
  }
}

async function resolveHardware(title: string): Promise<ResolvedImage[]> {
  const response = await searchHardwareProduct(title);
  const candidates = extractTavilyImages(response)
    .filter(validHttpsUrl)
    .slice(0, 3);

  const images: ResolvedImage[] = [];
  for (const [index, url] of candidates.entries()) {
    if (!apply) {
      images.push({ url, label: `${title} (Tavily image ${index + 1})` });
      continue;
    }

    const filename = `${normalizeTitle(title).replace(/\s+/g, "-")}-product-${index + 1}.jpg`;
    const blobUrl = await uploadToBlob(url, filename);
    if (blobUrl) {
      images.push({ url: blobUrl, label: `${title} (Tavily image ${index + 1})` });
    }
  }
  return images;
}

async function normalizeExistingImageUrls(): Promise<number> {
  if (!apply) return 0;
  const result = await prisma.$executeRawUnsafe(`
    UPDATE "Review"
    SET images = ARRAY(
      SELECT CASE WHEN image LIKE '//%' THEN 'https:' || image ELSE image END
      FROM unnest(images) WITH ORDINALITY AS ordered(image, position)
      ORDER BY position
    )
    WHERE EXISTS (
      SELECT 1 FROM unnest(images) AS image WHERE image LIKE '//%'
    )
  `);
  return Number(result);
}

async function distinctTitles(category: Category): Promise<string[]> {
  const rows = await prisma.review.groupBy({
    by: ["title"],
    where: { category, images: { isEmpty: true } },
    orderBy: { title: "asc" },
  });
  return rows.map((row) => row.title);
}

async function processCategory(category: Category): Promise<CategoryResult> {
  const result: CategoryResult = {
    category,
    titles: 0,
    matched: 0,
    reviewsUpdated: 0,
    unmatched: [],
    errors: [],
  };

  let titles = await distinctTitles(category);
  if (limit > 0) titles = titles.slice(0, limit);
  result.titles = titles.length;

  console.log(`\n=== ${category}: ${titles.length} distinct titles ===`);

  for (const [index, title] of titles.entries()) {
    try {
      let images: ResolvedImage[] = [];
      if (category === "game") {
        images = await resolveGame(title);
      } else if (category === "movie") {
        images = await resolveMovie(title);
      } else if (category === "series") {
        images = await resolveSeries(title);
      } else {
        images = await resolveHardware(title);
      }

      if (images.length === 0) {
        result.unmatched.push(title);
        console.log(`  [${index + 1}/${titles.length}] MISS  ${title}`);
        continue;
      }

      result.matched += 1;
      console.log(
        `  [${index + 1}/${titles.length}] OK    ${title} -> ${images[0].label}`
      );
      if (apply) {
        const update = await prisma.review.updateMany({
          where: { category, title, images: { isEmpty: true } },
          data: { images: images.map((image) => image.url) },
        });
        result.reviewsUpdated += update.count;
        console.log(`         updated ${update.count} review(s)`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push(`${title}: ${message}`);
      console.log(`  [${index + 1}/${titles.length}] ERROR ${title}: ${message}`);
    }

    // IGDB allows 4 req/s; Tavily is slower. Keep a small gap between titles.
    await sleep(category === "hardware" ? 800 : 350);
  }

  return result;
}

async function main(): Promise<void> {
  console.log(
    `Backfill review images (${apply ? "APPLY" : "DRY RUN"}) — categories: ${categories.join(", ")}`
  );

  const normalized = await normalizeExistingImageUrls();
  if (apply) {
    console.log(`Normalized ${normalized} review(s) with protocol-relative image URLs.`);
  }

  const results: CategoryResult[] = [];
  for (const category of categories) {
    results.push(await processCategory(category));
  }

  console.log("\n=== Summary ===");
  for (const result of results) {
    console.log(
      `${result.category}: ${result.matched}/${result.titles} titles matched, ${result.reviewsUpdated} review(s) updated, ${result.unmatched.length} unmatched, ${result.errors.length} errors`
    );
    if (result.unmatched.length > 0) {
      console.log(`  unmatched: ${result.unmatched.join(" | ")}`);
    }
    if (result.errors.length > 0) {
      console.log(`  errors: ${result.errors.join(" | ")}`);
    }
  }

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to write to the database.");
  }
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
