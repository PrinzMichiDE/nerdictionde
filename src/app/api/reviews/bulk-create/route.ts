import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulk, BulkQueryOptions } from "@/lib/igdb";
import { processGame, generateSlug } from "@/lib/review-generation";
import { requireAdminAuth } from "@/lib/auth";

interface BulkCreateOptions {
  queryOptions: BulkQueryOptions;
  batchSize?: number;
  delayBetweenBatches?: number;
  status?: "draft" | "published";
  skipExisting?: boolean;
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
      batchSize = 5,
      delayBetweenBatches = 2000,
      status = "draft",
      skipExisting = true,
    } = body;

    // Fetch games from IGDB
    let games;
    try {
      games = await getIGDBGamesBulk(queryOptions);
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

    // Process games in batches
    for (let i = 0; i < games.length; i += batchSize) {
      const batch = games.slice(i, i + batchSize);
      
      const batchPromises = batch.map((game: any) =>
        processGame(game, { status, skipExisting })
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const game = batch[index];
        if (result.status === "fulfilled") {
          const processResult = result.value;
          if (processResult.success && processResult.reviewId) {
            results.successful++;
            results.reviews.push({
              id: processResult.reviewId,
              title: game.name,
              slug: generateSlug(game.name),
            });
          } else if (processResult.error === "Already exists") {
            results.skipped++;
          } else {
            results.failed++;
            results.errors.push({
              game: game.name,
              error: processResult.error || "Unknown error",
            });
          }
        } else {
          results.failed++;
          results.errors.push({
            game: game.name,
            error: result.reason?.message || "Processing failed",
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
