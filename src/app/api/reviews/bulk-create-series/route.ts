import { NextRequest, NextResponse } from "next/server";
import { getTMDBSeriesBulk, BulkQueryOptions } from "@/lib/tmdb";
import { processSeries, generateSlug } from "@/lib/review-generation";
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

    // Fetch series from TMDB
    let series;
    try {
      series = await getTMDBSeriesBulk(queryOptions);
    } catch (error: any) {
      console.error("Error fetching series from TMDB:", error);
      return NextResponse.json(
        { error: `Failed to fetch series from TMDB: ${error.message}` },
        { status: 400 }
      );
    }

    if (!series || series.length === 0) {
      return NextResponse.json(
        { error: "No series found matching the criteria" },
        { status: 404 }
      );
    }

    const results = {
      total: series.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      reviews: [] as Array<{ id: string; title: string; slug: string }>,
      errors: [] as Array<{ series: string; error: string }>,
    };

    // Process series in batches
    for (let i = 0; i < series.length; i += batchSize) {
      const batch = series.slice(i, i + batchSize);
      
      const batchPromises = batch.map((serie) =>
        processSeries(serie, { status, skipExisting })
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        const serie = batch[index];
        if (result.status === "fulfilled") {
          const processResult = result.value;
          if (processResult.success && processResult.reviewId) {
            results.successful++;
            results.reviews.push({
              id: processResult.reviewId,
              title: serie.name,
              slug: generateSlug(serie.name),
            });
          } else if (processResult.error === "Already exists") {
            results.skipped++;
          } else {
            results.failed++;
            results.errors.push({
              series: serie.name,
              error: processResult.error || "Unknown error",
            });
          }
        } else {
          results.failed++;
          results.errors.push({
            series: serie.name,
            error: result.reason?.message || "Processing failed",
          });
        }
      });

      // Delay between batches (except for the last batch)
      if (i + batchSize < series.length) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return NextResponse.json({
      message: `Bulk creation completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
      results,
    });
  } catch (error: any) {
    console.error("Bulk create series error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
