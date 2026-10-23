import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getTMDBMoviesBulkLarge } from "../src/lib/tmdb-large";
import { processMovie } from "../src/lib/review-generation";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ProgressState {
  target: number;
  successful: number;
  failed: number;
  skipped: number;
  successfulMovies: Array<{ title: string; tmdbId: number; reviewId: string }>;
  failedMovies: Array<{ title: string; tmdbId: number; error: string }>;
}

const PROGRESS_FILE = process.env.PROGRESS_FILE
  ? path.resolve(process.cwd(), process.env.PROGRESS_FILE)
  : path.join(process.cwd(), "scripts", "movie-reviews-progress.json");

function loadProgress(): ProgressState | null {
  try {
    if (!fs.existsSync(PROGRESS_FILE)) return null;
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
  } catch (error) {
    console.error("Error loading progress:", error);
    return null;
  }
}

function saveProgress(state: ProgressState) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const TARGET_COUNT = Number(process.env.TARGET_COUNT) || 500;
  const DELAY_MS = Number(process.env.DELAY_MS) || 2000;
  const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY) || 8);
  const STATUS = process.env.REVIEW_STATUS === "published" ? ("published" as const) : ("draft" as const);

  if (!process.env.TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not set");
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const state = loadProgress();
  const progress: ProgressState =
    state && state.target === TARGET_COUNT && state.successful < TARGET_COUNT
      ? state
      : {
          target: TARGET_COUNT,
          successful: 0,
          failed: 0,
          skipped: 0,
          successfulMovies: [],
          failedMovies: [],
        };

  const successfulIds = new Set(progress.successfulMovies.map((m) => m.tmdbId));

  const existing = await prisma.review.findMany({
    where: { category: "movie", tmdbId: { not: null } },
    select: { tmdbId: true },
  });
  const existingIds = new Set(existing.map((r) => r.tmdbId as number));

  console.log(`🎬 Starting mass creation of ${TARGET_COUNT} Movie Reviews`);
  console.log(`   Existing movie reviews: ${existingIds.size}`);
  console.log(
    `   Progress: ${progress.successful} created, ${progress.failed} failed (target ${TARGET_COUNT})`
  );
  console.log(`   Status: ${STATUS}, delay: ${DELAY_MS}ms, concurrency: ${CONCURRENCY}`);
  console.log("=".repeat(60));

  // Fetch enough released movies so existing reviews do not eat into the target.
  const fetchCount = TARGET_COUNT + existingIds.size;
  console.log(`📥 Fetching up to ${fetchCount} released movies from TMDB...`);
  const movies = await getTMDBMoviesBulkLarge(fetchCount, {
    sortBy: "popularity",
    order: "desc",
    releaseDateLte: todayIsoDate(),
  });
  console.log(`✅ Fetched ${movies.length} released movies\n`);

  const now = new Date();
  const seen = new Set<number>();
  const candidates: typeof movies = [];

  for (const movie of movies) {
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    if (!movie.release_date || new Date(movie.release_date) > now) continue;
    if (existingIds.has(movie.id) || successfulIds.has(movie.id)) {
      progress.skipped++;
      continue;
    }
    candidates.push(movie);
  }

  console.log(
    `🎯 ${candidates.length} new released movies queued (${progress.skipped} already exist)\n`
  );

  let nextIndex = 0;
  let rateLimited = false;

  const worker = async () => {
    while (!rateLimited && progress.successful < TARGET_COUNT) {
      const index = nextIndex++;
      if (index >= candidates.length) return;
      const movie = candidates[index];

      const result = await processMovie(movie, { status: STATUS, skipExisting: true });

      if (result.success && result.reviewId) {
        progress.successful++;
        progress.successfulMovies.push({
          title: movie.title,
          tmdbId: movie.id,
          reviewId: result.reviewId,
        });
        progress.failedMovies = progress.failedMovies.filter((m) => m.tmdbId !== movie.id);
        console.log(`✅ ${movie.title} (${progress.successful}/${TARGET_COUNT})`);
      } else if (result.error === "Already exists") {
        progress.skipped++;
        console.log(`⏭️  ${movie.title} (already exists)`);
      } else {
        const error = result.error || "Unknown error";
        progress.failed++;
        progress.failedMovies.push({ title: movie.title, tmdbId: movie.id, error: error.slice(0, 300) });
        console.log(`❌ ${movie.title}: ${error.split("\n")[0]}`);
        if (/429|rate limit|quota|too many requests/i.test(error)) {
          rateLimited = true;
          console.error("\n⚠️  AI rate limit reached – stopping. Rerun later to resume.");
        }
      }

      saveProgress(progress);

      if (DELAY_MS > 0 && !rateLimited && progress.successful < TARGET_COUNT) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, Math.max(candidates.length, 1)) }, worker)
  );

  console.log("\n" + "=".repeat(60));
  console.log("📊 RESULTS");
  console.log(`✅ Created: ${progress.successful}/${TARGET_COUNT}`);
  console.log(`⏭️  Skipped (existing): ${progress.skipped}`);
  console.log(`❌ Failed: ${progress.failed}`);
  if (progress.failedMovies.length > 0) {
    console.log(`\nFailed movies:`);
    for (const movie of progress.failedMovies) {
      console.log(`   - ${movie.title}: ${movie.error.split("\n")[0]}`);
    }
  }
  console.log(
    progress.successful >= TARGET_COUNT
      ? "\n✅ Target reached."
      : `\n⚠️  Target not reached. Rerun to resume (${PROGRESS_FILE}).`
  );
}

main()
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
