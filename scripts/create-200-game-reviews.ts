import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { getIGDBGamesBulkLarge, BulkQueryOptions } from "../src/lib/igdb";
import { processGame, generateSlug } from "../src/lib/review-generation";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ProgressState {
  totalGames: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  failedGames: Array<{ name: string; igdbId?: number; error: string }>;
  successfulGames: Array<{ name: string; igdbId?: number; reviewId: string }>;
  lastProcessedIndex: number;
}

const PROGRESS_FILE = process.env.PROGRESS_FILE
  ? path.resolve(process.cwd(), process.env.PROGRESS_FILE)
  : path.join(process.cwd(), "scripts", "game-reviews-progress.json");

// Load progress state
function loadProgress(): ProgressState | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading progress:", error);
  }
  return null;
}

// Save progress state
function saveProgress(state: ProgressState) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

// Delete progress file
function deleteProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
  } catch (error) {
    console.error("Error deleting progress:", error);
  }
}

// Retry wrapper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.message?.includes("Already exists")) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`  ⚠️  Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Unknown error");
}

async function main() {
  const TARGET_COUNT = Number(process.env.TARGET_COUNT) || 200;
  const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 5; // Process 5 games at a time
  const DELAY_BETWEEN_BATCHES = 3000; // 3 seconds between batches
  const DELAY_BETWEEN_GAMES = 2000; // 2 seconds between individual games
  const STATUS = process.env.REVIEW_STATUS === "published" ? "published" as const : "draft" as const;
  const SKIP_EXISTING = true;

  console.log(`🚀 Starting mass creation of ${TARGET_COUNT} Game Reviews`);
  console.log("=" .repeat(60));

  // Check for existing progress
  const existingProgress = loadProgress();
  let games: any[] = [];
  let progress: ProgressState;

  if (
    existingProgress &&
    existingProgress.totalGames === TARGET_COUNT &&
    existingProgress.lastProcessedIndex < existingProgress.totalGames - 1
  ) {
    console.log(`📂 Found existing progress:`);
    console.log(`   Processed: ${existingProgress.processed}/${existingProgress.totalGames}`);
    console.log(`   Successful: ${existingProgress.successful}`);
    console.log(`   Failed: ${existingProgress.failed}`);
    console.log(`   Skipped: ${existingProgress.skipped}`);
    console.log(`\n🔄 Resuming from game ${existingProgress.lastProcessedIndex + 1}...\n`);

    // Fetch games again (we'll filter out already processed ones)
    const queryOptions: BulkQueryOptions = {
      sortBy: "popularity",
      order: "desc",
      minRating: 50, // Only games with at least 50 rating
    };

    console.log("📥 Fetching games from IGDB...");
    games = await getIGDBGamesBulkLarge(TARGET_COUNT, queryOptions);
    console.log(`✅ Fetched ${games.length} games from IGDB\n`);

    progress = existingProgress;
  } else {
    // Start fresh
    if (existingProgress) {
      console.log("⚠️  Previous run completed. Starting fresh...\n");
      deleteProgress();
    }

    const queryOptions: BulkQueryOptions = {
      sortBy: "popularity",
      order: "desc",
      minRating: 50, // Only games with at least 50 rating
    };

    console.log("📥 Fetching games from IGDB...");
    games = await getIGDBGamesBulkLarge(TARGET_COUNT, queryOptions);
    console.log(`✅ Fetched ${games.length} games from IGDB\n`);

    progress = {
      totalGames: games.length,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      failedGames: [],
      successfulGames: [],
      lastProcessedIndex: -1,
    };
  }

  // Filter out already processed games if resuming
  const startIndex = progress.lastProcessedIndex + 1;
  const gamesToProcess = games.slice(startIndex);

  console.log(`📊 Processing ${gamesToProcess.length} games`);
  console.log(`⚙️  Settings: Batch size=${BATCH_SIZE}, Delay=${DELAY_BETWEEN_BATCHES}ms, Status=${STATUS}\n`);

  const startTime = Date.now();

  // Process games in batches
  for (let i = 0; i < gamesToProcess.length; i += BATCH_SIZE) {
    const batch = gamesToProcess.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor((startIndex + i) / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(games.length / BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNumber}/${totalBatches} (Games ${startIndex + i + 1}-${Math.min(startIndex + i + batch.length, games.length)})`);

    // Process batch with retry logic
    const batchPromises = batch.map(async (game, batchIndex) => {
      const gameIndex = startIndex + i + batchIndex;
      
      // Delay between individual games in batch
      if (batchIndex > 0) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_GAMES));
      }

      return retryWithBackoff(async () => {
        const result = await processGame(game, {
          status: STATUS,
          skipExisting: SKIP_EXISTING,
        });

        if (result.success && result.reviewId) {
          progress.successful++;
          progress.successfulGames.push({
            name: game.name,
            igdbId: game.id,
            reviewId: result.reviewId,
          });
          console.log(`   ✅ ${game.name}`);
        } else if (result.error === "Already exists") {
          progress.skipped++;
          console.log(`   ⏭️  ${game.name} (already exists)`);
        } else {
          progress.failed++;
          progress.failedGames.push({
            name: game.name,
            igdbId: game.id,
            error: result.error || "Unknown error",
          });
          console.log(`   ❌ ${game.name}: ${result.error}`);
        }

        progress.processed++;
        progress.lastProcessedIndex = gameIndex;
        saveProgress(progress);

        return result;
      });
    });

    // Wait for all games in batch to complete
    await Promise.allSettled(batchPromises);

    // Delay between batches (except for the last batch)
    if (i + BATCH_SIZE < gamesToProcess.length) {
      const elapsed = Date.now() - startTime;
      const avgTimePerGame = elapsed / (progress.processed || 1);
      const remaining = gamesToProcess.length - (i + BATCH_SIZE);
      const estimatedMinutes = Math.ceil((remaining * avgTimePerGame) / 60000);

      console.log(`   ⏱️  Progress: ${progress.processed}/${games.length} | ETA: ~${estimatedMinutes} min`);
      await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }

  const totalTime = Date.now() - startTime;
  const minutes = Math.floor(totalTime / 60000);
  const seconds = Math.floor((totalTime % 60000) / 1000);

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL RESULTS");
  console.log("=".repeat(60));
  console.log(`Total games processed: ${progress.processed}`);
  console.log(`✅ Successful: ${progress.successful}`);
  console.log(`⏭️  Skipped: ${progress.skipped}`);
  console.log(`❌ Failed: ${progress.failed}`);
  console.log(`⏱️  Total time: ${minutes}m ${seconds}s`);

  if (progress.successfulGames.length > 0) {
    console.log(`\n✅ Created Reviews (${progress.successfulGames.length}):`);
    progress.successfulGames.slice(0, 10).forEach((game) => {
      console.log(`   - ${game.name}`);
    });
    if (progress.successfulGames.length > 10) {
      console.log(`   ... and ${progress.successfulGames.length - 10} more`);
    }
  }

  if (progress.failedGames.length > 0) {
    console.log(`\n❌ Failed Games (${progress.failedGames.length}):`);
    progress.failedGames.forEach((game) => {
      console.log(`   - ${game.name}: ${game.error}`);
    });
  }

  // Clean up progress file if successful
  if (progress.failed === 0) {
    deleteProgress();
    console.log("\n✅ All games processed successfully! Progress file deleted.");
  } else {
    console.log(`\n⚠️  Some games failed. Progress saved to: ${PROGRESS_FILE}`);
    console.log(`   You can resume by running this script again.`);
  }

  console.log("\n✅ Process completed!");
}

main()
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
