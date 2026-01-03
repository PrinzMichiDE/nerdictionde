import { NextRequest, NextResponse } from "next/server";
import { getTMDBMoviesBulk, BulkQueryOptions } from "@/lib/tmdb";
import { processMovie, generateSlug } from "@/lib/review-generation";
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

    // Fetch movies from TMDB
    let movies;
    try {
      movies = await getTMDBMoviesBulk(queryOptions);
    } catch (error: any) {
      console.error("Error fetching movies from TMDB:", error);
      return NextResponse.json(
        { error: `Failed to fetch movies from TMDB: ${error.message}` },
        { status: 400 }
      );
    }

    if (!movies || movies.length === 0) {
      return NextResponse.json(
        { error: "No movies found matching the criteria" },
        { status: 404 }
      );
    }

    const results = {
      total: movies.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      reviews: [] as Array<{ id: string; title: string; slug: string }>,
      errors: [] as Array<{ movie: string; error: string }>,
    };

    // Process movies in batches
    for (let i = 0; i < movies.length; i += batchSize) {
      const batch = movies.slice(i, i + batchSize);
      
      const batchPromises = batch.map((movie) =>
        processMovie(movie, { status, skipExisting })
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const movie = batch[index];
        if (result.status === "fulfilled") {
          const processResult = result.value;
          if (processResult.success && processResult.reviewId) {
            results.successful++;
            results.reviews.push({
              id: processResult.reviewId,
              title: movie.title,
              slug: generateSlug(movie.title),
            });
          } else if (processResult.error === "Already exists") {
            results.skipped++;
          } else {
            results.failed++;
            results.errors.push({
              movie: movie.title,
              error: processResult.error || "Unknown error",
            });
          }
        } else {
          results.failed++;
          results.errors.push({
            movie: movie.title,
            error: result.reason?.message || "Processing failed",
          });
        }
      });

      // Delay between batches (except for the last batch)
      if (i + batchSize < movies.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return NextResponse.json({
      message: `Bulk creation completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
      results,
    });
  } catch (error: any) {
    console.error("Bulk create movies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
