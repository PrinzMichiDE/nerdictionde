import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulkLarge, BulkQueryOptions } from "@/lib/igdb";
import { processGame, processMovie, processSeries, processAmazonProduct, generateSlug } from "@/lib/review-generation";
import { processHardware } from "@/app/api/reviews/bulk-create-hardware/route";
import { requireAdminAuth } from "@/lib/auth";
import { createJob, updateJob, addToQueue, updateQueueItem, getJob, getAllJobs } from "@/lib/job-status";
import { resumeRunningJobs } from "@/lib/job-resume";
import { randomUUID } from "crypto";
import { BulkQueryOptions as TMDBBulkQueryOptions } from "@/lib/tmdb";
import { getTMDBMoviesBulkLarge, getTMDBSeriesBulkLarge } from "@/lib/tmdb-large";

type ReviewCategory = "game" | "movie" | "series" | "hardware" | "product";

interface BulkCreateMassOptions {
  category: ReviewCategory;
  count: number;
  queryOptions?: BulkQueryOptions | any;
  status?: "draft" | "published";
  skipExisting?: boolean;
  batchSize?: number;
  delayBetweenBatches?: number;
  delayBetweenItems?: number;
  maxRetries?: number;
  // Category-specific options
  hardwareNames?: string[]; // For hardware category
  productNames?: string[]; // For product category
}

/**
 * Generic API endpoint for creating mass reviews for any category
 * with progress tracking and queue management.
 */
export async function POST(req: NextRequest) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  // Resume any running jobs in the background (only runs once per server instance)
  resumeRunningJobs().catch(err => console.error("Error resuming jobs:", err));

  try {
    const body: BulkCreateMassOptions = await req.json();

    const {
      category,
      count,
      queryOptions = {},
      batchSize = 5,
      delayBetweenBatches = 3000,
      delayBetweenItems = 2000,
      status = "draft",
      skipExisting = true,
      maxRetries = 3,
      hardwareNames = [],
      productNames = [],
    } = body;

    if (!category || !count || count <= 0) {
      return NextResponse.json(
        { error: "Category and count are required" },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting mass creation of ${count} ${category} Reviews`);
    console.log(`⚙️  Settings: Batch size=${batchSize}, Delay batches=${delayBetweenBatches}ms, Delay items=${delayBetweenItems}ms`);

    // Fetch items based on category
    let items: any[] = [];
    
    try {
      switch (category) {
        case "game":
          const gameQueryOptions: BulkQueryOptions = {
            sortBy: "popularity",
            order: "desc",
            minRating: 50,
            ...queryOptions,
          };
          items = await getIGDBGamesBulkLarge(count, gameQueryOptions);
          break;
        
        case "movie":
          // Fetch movies with proper pagination using bulk large function
          const movieQueryOptions: TMDBBulkQueryOptions = {
            ...queryOptions,
          };
          items = await getTMDBMoviesBulkLarge(count, movieQueryOptions);
          console.log(`✅ Fetched ${items.length} movies from TMDB (requested: ${count})`);
          break;
        
        case "series":
          // Fetch series with proper pagination using bulk large function
          const seriesQueryOptions: TMDBBulkQueryOptions = {
            ...queryOptions,
          };
          items = await getTMDBSeriesBulkLarge(count, seriesQueryOptions);
          console.log(`✅ Fetched ${items.length} series from TMDB (requested: ${count})`);
          break;
        
        case "hardware":
          if (hardwareNames.length === 0) {
            return NextResponse.json(
              { error: "hardwareNames array is required for hardware category" },
              { status: 400 }
            );
          }
          // For hardware, we use the provided names
          items = hardwareNames.slice(0, count).map((name) => ({ name }));
          break;
        
        case "product":
          if (productNames.length === 0) {
            return NextResponse.json(
              { error: "productNames array is required for product category" },
              { status: 400 }
            );
          }
          // Convert product names to product objects
          items = productNames.slice(0, count).map((name) => ({ name }));
          break;
        
        default:
          return NextResponse.json(
            { error: `Unsupported category: ${category}` },
            { status: 400 }
          );
      }
    } catch (error: any) {
      console.error(`Error fetching ${category} items:`, error);
      return NextResponse.json(
        { error: `Failed to fetch ${category} items: ${error.message}` },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: `No ${category} items found matching the criteria` },
        { status: 404 }
      );
    }

    // Create job for progress tracking
    const jobId = randomUUID();
    const totalBatches = Math.ceil(items.length / batchSize);
    await createJob(jobId, items.length, totalBatches, category, {
      batchSize,
      delayBetweenBatches,
      delayBetweenItems,
      status,
      skipExisting,
      maxRetries,
      items: items, // Store items in config for resume capability
    });
    
    // Initialize queue with all items
    const queueItems = items.map((item) => ({
      name: item.name || item.title || item.title_en || "Unknown",
      igdbId: item.id || item.igdbId,
      tmdbId: item.id || item.tmdbId,
      status: "pending" as const,
    }));
    await addToQueue(jobId, queueItems);
    
    // Update job status to running
    await updateJob(jobId, { status: "running" });

    // Start processing asynchronously (runs independently of client)
    processItemsAsync(jobId, items, category, {
      batchSize,
      delayBetweenBatches,
      delayBetweenItems,
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
      total: items.length,
      category,
    });
  } catch (error: any) {
    console.error("Bulk create mass error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Async processing function for all categories
// This runs independently in the background, even if no client is connected
async function processItemsAsync(
  jobId: string,
  items: any[],
  category: ReviewCategory,
  options: {
    batchSize: number;
    delayBetweenBatches: number;
    delayBetweenItems: number;
    status: "draft" | "published";
    skipExisting: boolean;
    maxRetries: number;
  }
) {
  const {
    batchSize,
    delayBetweenBatches,
    delayBetweenItems,
    status,
    skipExisting,
    maxRetries,
  } = options;

  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    reviews: [] as Array<{ id: string; title: string; slug: string; igdbId?: number; tmdbId?: number }>,
    errors: [] as Array<{ item: string; error: string }>,
  };

  // Retry wrapper with exponential backoff
  const retryWithBackoff = async (
    fn: () => Promise<{ success: boolean; reviewId?: string; error?: string }>,
    itemName: string
  ): Promise<{ success: boolean; reviewId?: string; error?: string }> => {
    let lastError: Error | null = null;
    const baseDelay = 2000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        if (error.message?.includes("Already exists")) {
          return { success: false, error: "Already exists" };
        }

        if (error.message?.includes("validation") || error.message?.includes("invalid")) {
          return { success: false, error: error.message };
        }

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
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

  // Process items in batches sequentially
  // Skip already processed items based on queue status
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(items.length / batchSize);
    
    console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (Items ${i + 1}-${Math.min(i + batch.length, items.length)})`);
    
    await updateJob(jobId, { currentBatch: batchNumber });
    
    // Process batch sequentially
    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      const itemName = item.name || item.title || item.title_en || "Unknown";
      
      // Check if this item was already processed
      const queueItem = job.queue.find(q => q.name === itemName);
      if (queueItem && (queueItem.status === "completed" || queueItem.status === "skipped")) {
        console.log(`   ⏭️  Skipping already processed: ${itemName}`);
        continue;
      }
      
      await updateQueueItem(jobId, itemName, { status: "processing" });
      
      if (j > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenItems));
      }

      try {
        let result: { success: boolean; reviewId?: string; error?: string };
        
        switch (category) {
          case "game":
            // Always skip existing for games to prevent duplicates
            result = await retryWithBackoff(
              () => processGame(item, { status, skipExisting: true }),
              itemName
            );
            break;
          
          case "movie":
            // Always skip existing for movies to prevent duplicates
            result = await retryWithBackoff(
              () => processMovie(item, { status, skipExisting: true }),
              itemName
            );
            break;
          
          case "series":
            // Always skip existing for series to prevent duplicates
            result = await retryWithBackoff(
              () => processSeries(item, { status, skipExisting: true }),
              itemName
            );
            break;
          
          case "hardware":
            // Always skip existing for hardware to prevent duplicates
            result = await retryWithBackoff(
              () => processHardware(item.name, { status, skipExisting: true }),
              itemName
            );
            break;
          
          case "product":
            // Always skip existing for products to prevent duplicates
            result = await retryWithBackoff(
              () => processAmazonProduct(item, { status, skipExisting: true }),
              itemName
            );
            break;
          
          default:
            result = { success: false, error: `Unsupported category: ${category}` };
        }

        if (result.success && result.reviewId) {
          results.successful++;
          results.reviews.push({
            id: result.reviewId,
            title: itemName,
            slug: generateSlug(itemName),
            igdbId: item.id || item.igdbId,
            tmdbId: item.id || item.tmdbId,
          });
          await updateQueueItem(jobId, itemName, {
            status: "completed",
            reviewId: result.reviewId,
          });
          console.log(`   ✅ ${itemName}`);
        } else if (result.error === "Already exists") {
          results.skipped++;
          await updateQueueItem(jobId, itemName, { status: "skipped" });
          console.log(`   ⏭️  ${itemName} (already exists)`);
        } else {
          results.failed++;
          results.errors.push({
            item: itemName,
            error: result.error || "Unknown error",
          });
          await updateQueueItem(jobId, itemName, {
            status: "failed",
            error: result.error || "Unknown error",
          });
          console.log(`   ❌ ${itemName}: ${result.error}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          item: itemName,
          error: error.message || "Processing failed",
        });
        await updateQueueItem(jobId, itemName, {
          status: "failed",
          error: error.message || "Processing failed",
        });
        console.log(`   ❌ ${itemName}: ${error.message}`);
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

    // Delay between batches
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  // Mark job as completed
  await updateJob(jobId, {
    status: "completed",
  });

  console.log(`\n✅ Job ${jobId} completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`);
}
