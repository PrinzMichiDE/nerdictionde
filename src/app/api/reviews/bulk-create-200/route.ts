import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulkLarge, BulkQueryOptions } from "@/lib/igdb";
import { processGame, generateSlug } from "@/lib/review-generation";
import { requireAdminAuth } from "@/lib/auth";

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

  try {
    const body: BulkCreate200Options = await req.json();

    const {
      queryOptions = {
        sortBy: "total_rating_count",
        order: "desc",
        minRating: 50, // Only games with at least 50 rating
      },
      batchSize = 5, // Process 5 games at a time for stability
      delayBetweenBatches = 3000, // 3 seconds between batches
      delayBetweenGames = 2000, // 2 seconds between individual games
      status = "draft",
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

    const results = {
      total: games.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      reviews: [] as Array<{ id: string; title: string; slug: string; igdbId?: number }>,
      errors: [] as Array<{ game: string; igdbId?: number; error: string }>,
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

    const startTime = Date.now();

    // Process games in batches sequentially for better stability
    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(games.length / batchSize);
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (Games ${i + 1}-${Math.min(i + batch.length, games.length)})`);
      
      // Process batch sequentially with delays to avoid rate limits
      for (let j = 0; j < batch.length; j++) {
        const game = batch[j];
        
        // Delay between games in batch
        if (j > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenGames));
        }

        try {
          const result = await retryWithBackoff(
            () => processGame(game, { status, skipExisting }),
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
            console.log(`   ✅ ${game.name}`);
          } else if (result.error === "Already exists") {
            results.skipped++;
            console.log(`   ⏭️  ${game.name} (already exists)`);
          } else {
            results.failed++;
            results.errors.push({
              game: game.name,
              igdbId: game.id,
              error: result.error || "Unknown error",
            });
            console.log(`   ❌ ${game.name}: ${result.error}`);
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            game: game.name,
            igdbId: game.id,
            error: error.message || "Processing failed",
          });
          console.log(`   ❌ ${game.name}: ${error.message}`);
        }
      }

      // Delay between batches (except for the last batch)
      if (i + batchSize < games.length) {
        const elapsed = Date.now() - startTime;
        const avgTimePerGame = elapsed / (results.successful + results.failed + results.skipped || 1);
        const remaining = games.length - (i + batchSize);
        const estimatedMinutes = Math.ceil((remaining * avgTimePerGame) / 60000);

        console.log(`   ⏱️  Progress: ${results.successful + results.failed + results.skipped}/${games.length} | ETA: ~${estimatedMinutes} min`);
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const totalTime = Date.now() - startTime;
    const minutes = Math.floor(totalTime / 60000);
    const seconds = Math.floor((totalTime % 60000) / 1000);

    console.log(`\n✅ Completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped in ${minutes}m ${seconds}s`);

    return NextResponse.json({
      message: `Bulk creation completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
      results: {
        ...results,
        totalTime: `${minutes}m ${seconds}s`,
        totalTimeMs: totalTime,
      },
    });
  } catch (error: any) {
    console.error("Bulk create 200 error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
