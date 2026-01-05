import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulkLarge, BulkQueryOptions } from "@/lib/igdb";
import { processGame, generateSlug } from "@/lib/review-generation";
import { requireAdminAuth } from "@/lib/auth";
import { createJob, updateJob, addToQueue, updateQueueItem, getJob } from "@/lib/job-status";
import { resumeRunningJobs } from "@/lib/job-resume";
import { randomUUID } from "crypto";

interface BulkCreate200Options {
  queryOptions?: BulkQueryOptions;
  status?: "draft" | "published";
  skipExisting?: boolean;
  batchSize?: number;
  delayBetweenBatches?: number;
  delayBetweenGames?: number;
  maxRetries?: number;
}

/**
 * Dedicated API endpoint for creating 200 game reviews with optimized settings
 * for stability and reliability.
 */
export async function POST(req: NextRequest) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  // Resume any running jobs in the background (only runs once per server instance)
  resumeRunningJobs().catch(err => console.error("Error resuming jobs:", err));

  try {
    const body: BulkCreate200Options = await req.json();

    const {
      queryOptions = {
        sortBy: "popularity",
        order: "desc",
        minRating: 50, // Only games with at least 50 rating
      },
      batchSize = 5, // Process 5 games at a time for stability
      delayBetweenBatches = 3000, // 3 seconds between batches
      delayBetweenGames = 2000, // 2 seconds between individual games
      status = "published",
      skipExisting = true,
      maxRetries = 3,
    } = body;

    const TARGET_COUNT = 200;

    console.log(`🚀 Starting mass creation of ${TARGET_COUNT} Game Reviews`);
    console.log(`⚙️  Settings: Batch size=${batchSize}, Delay batches=${delayBetweenBatches}ms, Delay games=${delayBetweenGames}ms`);

    // Fetch games from IGDB using bulk large function
    let games;
    try {
      console.log("📥 Fetching games from IGDB...");
      games = await getIGDBGamesBulkLarge(TARGET_COUNT, queryOptions);
      console.log(`✅ Fetched ${games.length} games from IGDB`);
    } catch (error: any) {
      console.error("Error fetching games from IGDB:", error);
      return NextResponse.json(
        { error: `Failed to fetch games from IGDB: ${error.message}` },
        { status: 400 }
      );
    }

    if (!games || games.length === 0) {
      return NextResponse.json(
        { error: "No games found matching the criteria" },
        { status: 404 }
      );
    }

    // Create job for progress tracking
    const jobId = randomUUID();
    const totalBatches = Math.ceil(games.length / batchSize);
    await createJob(jobId, games.length, totalBatches, "game", {
      batchSize,
      delayBetweenBatches,
      delayBetweenGames,
      status,
      skipExisting,
      maxRetries,
      items: games, // Store games in config for resume capability
    });
    
    // Initialize queue with all games
    const queueItems = games.map((game) => ({
      name: game.name,
      igdbId: game.id,
      status: "pending" as const,
    }));
    await addToQueue(jobId, queueItems);
    
    // Update job status to running
    await updateJob(jobId, { status: "running" });

    // Start processing asynchronously (don't await - return job ID immediately)
    processGamesAsync(jobId, games, {
      batchSize,
      delayBetweenBatches,
      delayBetweenGames,
      status,
      skipExisting,
      maxRetries,
    }).catch(async (error) => {
      console.error("Error in async processing:", error);
      await updateJob(jobId, {
        status: "failed",
      });
    });

    // Return job ID immediately so client can poll for progress
    return NextResponse.json({
      message: "Job started",
      jobId,
      total: games.length,
    });

    // Retry wrapper with exponential backoff
    const retryWithBackoff = async (
      fn: () => Promise<{ success: boolean; reviewId?: string; error?: string }>,
      gameName: string
    ): Promise<{ success: boolean; reviewId?: string; error?: string }> => {
      let lastError: Error | null = null;
      const baseDelay = 2000;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error: any) {
          lastError = error;
          
          // Don't retry on "Already exists" errors
          if (error.message?.includes("Already exists")) {
            return { success: false, error: "Already exists" };
          }

          // Don't retry on certain validation errors
          if (error.message?.includes("validation") || error.message?.includes("invalid")) {
            return { success: false, error: error.message };
          }

          if (attempt < maxRetries - 1) {
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`  ⚠️  Retrying ${gameName} (attempt ${attempt + 2}/${maxRetries}) in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      return {
        success: false,
        error: lastError?.message || "Unknown error after retries",
      };
    };

// Async processing function
async function processGamesAsync(
  jobId: string,
  games: any[],
  options: {
    batchSize: number;
    delayBetweenBatches: number;
    delayBetweenGames: number;
    status: "draft" | "published";
    skipExisting: boolean;
    maxRetries: number;
  }
) {
  const {
    batchSize,
    delayBetweenBatches,
    delayBetweenGames,
    status,
    skipExisting,
    maxRetries,
  } = options;

  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    reviews: [] as Array<{ id: string; title: string; slug: string; igdbId?: number }>,
    errors: [] as Array<{ item: string; igdbId?: number; error: string }>,
  };

  // Retry wrapper with exponential backoff
  const retryWithBackoff = async (
    fn: () => Promise<{ success: boolean; reviewId?: string; error?: string }>,
    gameName: string
  ): Promise<{ success: boolean; reviewId?: string; error?: string }> => {
    let lastError: Error | null = null;
    const baseDelay = 2000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on "Already exists" errors
        if (error.message?.includes("Already exists")) {
          return { success: false, error: "Already exists" };
        }

        // Don't retry on certain validation errors
        if (error.message?.includes("validation") || error.message?.includes("invalid")) {
          return { success: false, error: error.message };
        }

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`  ⚠️  Retrying ${gameName} (attempt ${attempt + 2}/${maxRetries}) in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || "Unknown error after retries",
    };
  };

  // Get current job state to determine where to resume
  const job = await getJob(jobId);
  if (!job) {
    console.error(`Job ${jobId} not found, cannot process`);
    return;
  }

  // Process games in batches sequentially for better stability
  // Skip already processed games based on queue status
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(games.length / batchSize);
    
    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (Games ${i + 1}-${Math.min(i + batch.length, games.length)})`);
    
    // Update job with current batch
    await updateJob(jobId, { currentBatch: batchNumber });
    
    // Process batch sequentially with delays to avoid rate limits
    for (let j = 0; j < batch.length; j++) {
      const game = batch[j];
      
      // Check if this game was already processed
      const queueItem = job.queue.find(q => q.name === game.name);
      if (queueItem && (queueItem.status === "completed" || queueItem.status === "skipped")) {
        console.log(`   ⏭️  Skipping already processed: ${game.name}`);
        continue;
      }
      
      // Update queue item status to processing
      await updateQueueItem(jobId, game.name, { status: "processing" });
      
      // Delay between games in batch
      if (j > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenGames));
      }

      try {
        // Always skip existing to prevent duplicates
        const result = await retryWithBackoff(
          () => processGame(game, { status, skipExisting: true }),
          game.name
        );

        if (result.success && result.reviewId) {
          results.successful++;
          results.reviews.push({
            id: result.reviewId,
            title: game.name,
            slug: generateSlug(game.name),
            igdbId: game.id,
          });
          await updateQueueItem(jobId, game.name, {
            status: "completed",
            reviewId: result.reviewId,
          });
          console.log(`   ✅ ${game.name}`);
        } else if (result.error === "Already exists") {
          results.skipped++;
          await updateQueueItem(jobId, game.name, { status: "skipped" });
          console.log(`   ⏭️  ${game.name} (already exists)`);
        } else {
          results.failed++;
          results.errors.push({
            item: game.name,
            igdbId: game.id,
            error: result.error || "Unknown error",
          });
          await updateQueueItem(jobId, game.name, {
            status: "failed",
            error: result.error || "Unknown error",
          });
          console.log(`   ❌ ${game.name}: ${result.error}`);
        }
      } catch (error: any) {
        results.failed++;
          results.errors.push({
            item: game.name,
            igdbId: game.id,
            error: error.message || "Processing failed",
          });
        await updateQueueItem(jobId, game.name, {
          status: "failed",
          error: error.message || "Processing failed",
        });
        console.log(`   ❌ ${game.name}: ${error.message}`);
      }

      // Update job progress
      const processed = results.successful + results.failed + results.skipped;
      await updateJob(jobId, {
        processed,
        successful: results.successful,
        failed: results.failed,
        skipped: results.skipped,
        reviews: results.reviews,
        errors: results.errors,
      });
    }

    // Delay between batches (except for the last batch)
    if (i + batchSize < games.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  // Mark job as completed
  await updateJob(jobId, {
    status: "completed",
  });

  console.log(`\n✅ Job ${jobId} completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`);
}
  } catch (error: any) {
    console.error("Bulk create 200 error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
