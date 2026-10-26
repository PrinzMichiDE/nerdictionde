import { NextRequest, NextResponse } from "next/server";
import { getIGDBGamesBulkLarge, BulkQueryOptions, type IGDBGame } from "@/lib/igdb";
import type { TMDBMovie, TMDBSeries } from "@/lib/tmdb";

interface HardwareData {
  id?: string | number;
  name?: string;
  manufacturer?: string | null;
  model?: string | null;
  type?: string;
  releaseDate?: Date | string | null;
  msrp?: number | null;
  specs?: Prisma.JsonValue;
  images?: string[];
}

import {
  processGame,
  processMovie,
  processSeries,
  processHardware,
  generateSlug,
} from "@/lib/review-generation";
import { requireAdminAuth } from "@/lib/auth";
import { createJob, updateJob, addToQueue, updateQueueItem, getJob } from "@/lib/job-status";
import { resumeRunningJobs } from "@/lib/job-resume";
import { randomUUID } from "crypto";
import { BulkQueryOptions as TMDBBulkQueryOptions } from "@/lib/tmdb";
import { getTMDBMoviesBulkLarge, getTMDBSeriesBulkLarge } from "@/lib/tmdb-large";
import { HARDWARE_CATALOG, type HardwareCatalogItem } from "@/lib/hardware-catalog";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

type ReviewCategory = "game" | "movie" | "series" | "hardware";

interface BulkCreateMassOptions {
  category: ReviewCategory;
  count: number;
  queryOptions?: BulkQueryOptions | TMDBBulkQueryOptions | Record<string, unknown>;
  status?: "draft" | "published";
  skipExisting?: boolean;
  batchSize?: number;
  delayBetweenBatches?: number;
  delayBetweenItems?: number;
  maxRetries?: number;
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
      status = "published",
      skipExisting = true,
      maxRetries = 3,
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
    let items: Array<{ id: number | string; name?: string; title?: string; title_en?: string; igdbId?: number; tmdbId?: number }> = [];
    
    try {
      switch (category) {
        case "game":
          const gameQueryOptions: BulkQueryOptions = {
            sortBy: "popularity",
            // Only spread compatible properties from queryOptions
            genreId: (queryOptions as Record<string, unknown>).genreId as number | undefined,
            platformId: (queryOptions as Record<string, unknown>).platformId as number | undefined,
            releaseYear: (queryOptions as Record<string, unknown>).releaseYear as number | undefined,
            minRating: (queryOptions as Record<string, unknown>).minRating as number | undefined,
            releasedOnly: (queryOptions as Record<string, unknown>).releasedOnly as boolean | undefined,
            limit: (queryOptions as Record<string, unknown>).limit as number | undefined,
            offset: (queryOptions as Record<string, unknown>).offset as number | undefined,
            order: (queryOptions as Record<string, unknown>).order as "asc" | "desc" | undefined,
          };
          items = await getIGDBGamesBulkLarge(count, gameQueryOptions);
          break;
        
        case "movie":
          // Fetch movies with proper pagination using bulk large function
          const movieQueryOptions: TMDBBulkQueryOptions = {
            // Only spread compatible properties from queryOptions
            genreId: (queryOptions as Record<string, unknown>).genreId as number | undefined,
            releaseYear: (queryOptions as Record<string, unknown>).releaseYear as number | undefined,
            minRating: (queryOptions as Record<string, unknown>).minRating as number | undefined,
            sortBy: (queryOptions as Record<string, unknown>).sortBy as "popularity" | "rating" | "release_date" | "title" | undefined,
            order: (queryOptions as Record<string, unknown>).order as "asc" | "desc" | undefined,
            limit: (queryOptions as Record<string, unknown>).limit as number | undefined,
            offset: (queryOptions as Record<string, unknown>).offset as number | undefined,
          };
          items = await getTMDBMoviesBulkLarge(count, movieQueryOptions);
          console.log(`✅ Fetched ${items.length} movies from TMDB (requested: ${count})`);
          break;
        
        case "series":
          // Fetch series with proper pagination using bulk large function
          const seriesQueryOptions: TMDBBulkQueryOptions = {
            // Only spread compatible properties from queryOptions
            genreId: (queryOptions as Record<string, unknown>).genreId as number | undefined,
            releaseYear: (queryOptions as Record<string, unknown>).releaseYear as number | undefined,
            minRating: (queryOptions as Record<string, unknown>).minRating as number | undefined,
            sortBy: (queryOptions as Record<string, unknown>).sortBy as "popularity" | "rating" | "release_date" | "title" | undefined,
            order: (queryOptions as Record<string, unknown>).order as "asc" | "desc" | undefined,
            limit: (queryOptions as Record<string, unknown>).limit as number | undefined,
            offset: (queryOptions as Record<string, unknown>).offset as number | undefined,
          };
          items = await getTMDBSeriesBulkLarge(count, seriesQueryOptions);
          console.log(`✅ Fetched ${items.length} series from TMDB (requested: ${count})`);
          break;

        case "hardware":
          // Use catalog to create/get hardware entries without reviews
          let createdHw = 0;
          for (const item of HARDWARE_CATALOG) {
            if (items.length >= count) break;
            const slugBase = `${item.manufacturer}-${item.model || item.name}`
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");
            let slug = slugBase;
            let attempt = 0;
            while (await prisma.hardware.findUnique({ where: { slug } })) {
              attempt++;
              slug = `${slugBase}-${attempt}`;
              if (attempt > 20) break;
            }
            const hw = await prisma.hardware.upsert({
              where: { slug },
              create: {
                name: item.name,
                name_en: item.name,
                slug,
                type: item.type,
                manufacturer: item.manufacturer,
                model: item.model || null,
                specs: (item.specs || {}) as Prisma.InputJsonValue,
                msrp: item.msrp ?? null,
                releaseDate: item.releaseDate ? new Date(item.releaseDate) : null,
              },
              update: {},
            });
            // Check if already has review
            const hasReview = await prisma.review.findFirst({
              where: { hardwareId: hw.id },
            });
            if (!hasReview) {
              items.push(hw);
              createdHw++;
            }
          }
          // If still not enough, try to find any existing without reviews
          if (items.length < count) {
            const more = await prisma.hardware.findMany({
              where: { reviews: { none: {} } },
              take: count - items.length,
            });
            items.push(...more);
          }
          console.log(`✅ Prepared ${items.length} hardware products without reviews`);
          break;

        default:
          return NextResponse.json(
            { error: `Unsupported category: ${category}` },
            { status: 400 }
          );
      }
    } catch (error: unknown) {
      console.error(`Error fetching ${category} items:`, error);
      const err = error as Error;
      return NextResponse.json(
        { error: `Failed to fetch ${category} items: ${err.message}` },
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
    const queueItems = items.map((item) => {
      const baseItem = {
        name: item.name || item.title || item.title_en || "Unknown",
        status: "pending" as const,
      };
      
      if (category === "game") {
        return { ...baseItem, igdbId: item.id as number | undefined };
      } else if (category === "movie" || category === "series") {
        return { ...baseItem, tmdbId: item.id as number | undefined };
      } else {
        return baseItem;
      }
    });
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
  } catch (error: unknown) {
    console.error("Bulk create mass error:", error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Async processing function for all categories
// This runs independently in the background, even if no client is connected
async function processItemsAsync(
  jobId: string,
  items: Array<{ id: number | string; name?: string; title?: string; title_en?: string; igdbId?: number; tmdbId?: number }>,
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
    fn: () => Promise<{ success: boolean; reviewId?: string; error?: string }>
  ): Promise<{ success: boolean; reviewId?: string; error?: string }> => {
    let lastError: Error | null = null;
    const baseDelay = 2000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        const err = error as { message?: string; code?: string };
        lastError = new Error(err.message || String(error));
        
        // Handle specific error types that shouldn't be retried
        if (err.message?.includes("Already exists")) {
          return { success: false, error: "Already exists" };
        }

        if (err.message?.includes("validation") || err.message?.includes("invalid")) {
          return { success: false, error: err.message };
        }

        // Handle unique constraint errors (like duplicate slugs)
        if (err.message?.includes("Unique constraint") || err.message?.includes("duplicate") || err.code === "P2002") {
          return { success: false, error: "Duplicate entry (unique constraint)" };
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
              () => processGame(item as IGDBGame, { status, skipExisting: true })
            );
            break;
          
          case "movie":
            // Always skip existing for movies to prevent duplicates
            result = await retryWithBackoff(
              () => processMovie(item as TMDBMovie, { status, skipExisting: true })
            );
            break;
          
          case "series":
            // Always skip existing for series to prevent duplicates
            result = await retryWithBackoff(
              () => processSeries(item as TMDBSeries, { status, skipExisting: true })
            );
            break;

          case "hardware":
            result = await retryWithBackoff(
              () => processHardware(item as HardwareData, { status, skipExisting: true })
            );
            break;

          default:
            result = { success: false, error: `Unsupported category: ${category}` };
          }

        if (result.success && result.reviewId) {
          results.successful++;
          const reviewData: { id: string; title: string; slug: string; igdbId?: number; tmdbId?: number } = {
            id: result.reviewId,
            title: itemName,
            slug: generateSlug(itemName),
          };
          if (category === "game") {
            reviewData.igdbId = (item.id as number) || item.igdbId;
          } else if (category === "movie" || category === "series") {
            reviewData.tmdbId = (item.id as number) || item.tmdbId;
          }
          results.reviews.push(reviewData);
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
      } catch (error: unknown) {
        const err = error as Error;
        results.failed++;
        results.errors.push({
          item: itemName,
          error: err.message || "Processing failed",
        });
        await updateQueueItem(jobId, itemName, {
          status: "failed",
          error: err.message || "Processing failed",
        });
        console.log(`   ❌ ${itemName}: ${err.message}`);
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
