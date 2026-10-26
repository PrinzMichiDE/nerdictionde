import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getIGDBGamesBulk, type BulkQueryOptions } from "../src/lib/igdb";
import { processGame } from "../src/lib/review-generation";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const TARGET_COUNT = Number(process.env.TARGET_COUNT) || 500;
const CONCURRENCY = Number(process.env.BATCH_SIZE) || 3;
const STATUS = process.env.REVIEW_STATUS === "draft" ? "draft" : "published";
const PROGRESS_FILE = path.resolve(
  process.cwd(),
  process.env.PROGRESS_FILE || "scripts/game-reviews-500-progress.json"
);
const PAGE_SIZE = 100;
const MAX_PAGES = 60; // safety stop while paging through IGDB

const QUERY: Omit<BulkQueryOptions, "limit" | "offset"> = {
  sortBy: "popularity",
  order: "desc",
  minRating: 50,
  releasedOnly: true,
};

interface CreatedReview {
  igdbId: number;
  name: string;
  reviewId: string;
}

interface FailedReview {
  igdbId: number;
  name: string;
  error: string;
}

interface Progress {
  target: number;
  created: CreatedReview[];
  failed: FailedReview[];
}

function loadProgress(): Progress | null {
  try {
    if (!fs.existsSync(PROGRESS_FILE)) return null;
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8")) as Progress;
  } catch (error) {
    console.error("Could not read progress file:", error);
    return null;
  }
}

function saveProgress(progress: Progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface IGDBGame {
  id: number;
  name: string;
  // Add other properties as needed
}

async function processWithRetry(game: IGDBGame, maxAttempts = 3) {
  let lastResult: { success: boolean; reviewId?: string; error?: string } = {
    success: false,
    error: "Unknown error",
  };

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    lastResult = await processGame(game, { status: STATUS, skipExisting: true });
    if (lastResult.success || lastResult.error === "Already exists") return lastResult;
    if (attempt < maxAttempts) {
      console.log(`   ↻ retry ${attempt}/${maxAttempts - 1} for ${game.name}`);
      await sleep(5000 * attempt);
    }
  }

  return lastResult;
}

async function main() {
  const previous = loadProgress();
  const progress: Progress =
    previous && previous.target === TARGET_COUNT
      ? previous
      : { target: TARGET_COUNT, created: [], failed: [] };

  let createdCount = progress.created.length;
  console.log(`🚀 Creating ${TARGET_COUNT} game reviews for released games`);
  console.log(`⚙️  Status=${STATUS}, concurrency=${CONCURRENCY}, progress=${PROGRESS_FILE}`);
  if (createdCount > 0) {
    console.log(`📂 Resuming: ${createdCount}/${TARGET_COUNT} already created`);
  }

  const existingIgdbIds = new Set<number>(
    (
      await prisma.review.findMany({
        where: { category: "game", igdbId: { not: null } },
        select: { igdbId: true },
      })
    ).map((review) => review.igdbId as number)
  );
  for (const item of progress.created) existingIgdbIds.add(item.igdbId);

  let offset = 0;
  let pageNumber = 0;

  while (createdCount < TARGET_COUNT && pageNumber < MAX_PAGES) {
    pageNumber++;
    const games = await getIGDBGamesBulk({
      ...QUERY,
      limit: PAGE_SIZE,
      offset,
    });

    if (games.length === 0) {
      console.log("⚠️  No more IGDB games available");
      break;
    }

    offset += games.length;
    const candidates = games.filter(
      (game: IGDBGame) => typeof game.id === "number" && !existingIgdbIds.has(game.id)
    );
    console.log(
      `\n📄 IGDB page ${pageNumber}: ${games.length} games, ${candidates.length} not reviewed yet`
    );

    for (let i = 0; i < candidates.length && createdCount < TARGET_COUNT; i += CONCURRENCY) {
      const batch = candidates.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (game: IGDBGame) => ({
          game,
          result: await processWithRetry(game),
        }))
      );

      for (const { game, result } of results) {
        if (result.success && result.reviewId) {
          createdCount++;
          existingIgdbIds.add(game.id);
          progress.created.push({
            igdbId: game.id,
            name: game.name,
            reviewId: result.reviewId,
          });
          console.log(`   ✅ ${createdCount}/${TARGET_COUNT} ${game.name}`);
        } else if (result.error === "Already exists") {
          existingIgdbIds.add(game.id);
          console.log(`   ⏭️  ${game.name} (already exists)`);
        } else {
          progress.failed.push({
            igdbId: game.id,
            name: game.name,
            error: result.error || "Unknown error",
          });
          console.error(`   ❌ ${game.name}: ${result.error}`);
        }
        saveProgress(progress);
      }

      if (createdCount < TARGET_COUNT) await sleep(1500);
    }
  }

  saveProgress(progress);
  console.log("\n" + "=".repeat(60));
  console.log(`✅ Created: ${createdCount}/${TARGET_COUNT}`);
  console.log(`❌ Failed: ${progress.failed.length}`);
  console.log(`📝 Progress: ${PROGRESS_FILE}`);

  if (progress.failed.length > 0) {
    console.log("\nFailed games:");
    for (const item of progress.failed.slice(-20)) {
      console.log(`   - ${item.name}: ${item.error.split("\n")[0]}`);
    }
  }

  if (createdCount >= TARGET_COUNT) {
    console.log("\n🎉 Target reached.");
  }
}

main()
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
