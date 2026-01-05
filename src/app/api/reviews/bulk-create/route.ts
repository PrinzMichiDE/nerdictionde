import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulk, getIGDBGamesBulkLarge, BulkQueryOptions } from "@/lib/igdb";
import { processGame, generateSlug } from "@/lib/review-generation";
import { requireAdminAuth } from "@/lib/auth";

interface BulkCreateOptions {
  queryOptions: BulkQueryOptions;
  totalLimit?: number; // Total number of games to fetch (uses getIGDBGamesBulkLarge if > 500)
  batchSize?: number;
  delayBetweenBatches?: number;
  delayBetweenGames?: number;
  status?: "draft" | "published";
  skipExisting?: boolean;
  maxRetries?: number; // Max retries per game
}

export async function POST(req: NextRequest) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const body: BulkCreateOptions = await req.json();

    if (!body.queryOptions) {
      return NextResponse.json(
        { error: "queryOptions are required" },
        { status: 400 }
      );
    }

    const {
      queryOptions,
      totalLimit,
      batchSize = 5,
      delayBetweenBatches = 3000,
      delayBetweenGames = 2000,
      status = "published",
      skipExisting = true,
      maxRetries = 3,
    } = body;

    // Fetch games from IGDB
    let games;
    try {
      if (totalLimit && totalLimit > 500) {
        // Use bulk large function for requests > 500
        games = await getIGDBGamesBulkLarge(totalLimit, queryOptions);
      } else {
        // Use regular bulk function
        games = await getIGDBGamesBulk({
          ...queryOptions,
          limit: totalLimit || queryOptions.limit || 50,
        });
      }
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
      reviews: [] as Array<{ id: string; title: string; slug: string }>,
      errors: [] as Array<{ game: string; error: string }>,
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

    // Process games in batches
    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(games.length / batchSize);
      
      console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} games)`);
      
      // Process batch sequentially with delays to avoid rate limits
      const batchResults = [];
      for (let j = 0; j < batch.length; j++) {
        const game = batch[j];
        
        // Delay between games in batch
        if (j > 0) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenGames));
        }

        const result = await retryWithBackoff(
          () => processGame(game, { status, skipExisting }),
          game.name
        );
        
        batchResults.push({ result, game });
      }

      // Process results
      batchResults.forEach(({ result, game }) => {
        if (result.success && result.reviewId) {
          results.successful++;
          results.reviews.push({
            id: result.reviewId,
            title: game.name,
            slug: generateSlug(game.name),
          });
        } else if (result.error === "Already exists") {
          results.skipped++;
        } else {
          results.failed++;
          results.errors.push({
            game: game.name,
            error: result.error || "Unknown error",
          });
        }
      });

      // Delay between batches (except for the last batch)
      if (i + batchSize < games.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return NextResponse.json({
      message: `Bulk creation completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
      results,
    });
  } catch (error: any) {
    console.error("Bulk create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
