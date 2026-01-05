import { getRunningJobs, getJob, updateJob, updateQueueItem } from "@/lib/job-status";
import { processGame, processMovie, processSeries, processAmazonProduct, generateSlug } from "@/lib/review-generation";
import { processHardware } from "@/app/api/reviews/bulk-create-hardware/route";
import { getIGDBGamesBulkLarge, BulkQueryOptions } from "@/lib/igdb";
import { getTMDBMoviesBulkLarge, getTMDBSeriesBulkLarge, BulkQueryOptions as TMDBBulkQueryOptions } from "@/lib/tmdb-large";

type ReviewCategory = "game" | "movie" | "series" | "hardware" | "product";

// Singleton flag to ensure resume only runs once per server instance
let resumeInitialized = false;

/**
 * Resume all running jobs that were interrupted (e.g., after server restart)
 * This function is called automatically and ensures jobs continue in the background
 */
export async function resumeRunningJobs() {
  // Prevent multiple simultaneous resume attempts
  if (resumeInitialized) {
    return;
  }
  resumeInitialized = true;

  try {
    const runningJobs = await getRunningJobs();
    
    if (runningJobs.length === 0) {
      console.log("✅ No running jobs to resume");
      return;
    }

    console.log(`🔄 Found ${runningJobs.length} running job(s) to resume`);

    for (const job of runningJobs) {
      console.log(`📋 Resuming job ${job.jobId} (${job.category}, ${job.processed}/${job.total} processed)`);
      
      // Get items from config (stored when job was created)
      const config = job.config as any;
      if (!config || !config.items) {
        console.error(`⚠️  Job ${job.jobId} has no items in config, cannot resume`);
        await updateJob(job.jobId, { status: "failed" });
        continue;
      }

      const items = config.items as any[];
      const category = job.category as ReviewCategory;

      // Resume processing
      processItemsAsync(job.jobId, items, category, {
        batchSize: config.batchSize || 5,
        delayBetweenBatches: config.delayBetweenBatches || 3000,
        delayBetweenItems: config.delayBetweenItems || 2000,
        status: config.status || "draft",
        skipExisting: config.skipExisting !== false,
        maxRetries: config.maxRetries || 3,
      }).catch(async (error) => {
        console.error(`❌ Error resuming job ${job.jobId}:`, error);
        await updateJob(job.jobId, {
          status: "failed",
        });
      });
    }
  } catch (error) {
    console.error("Error resuming jobs:", error);
  }
}

// Async processing function (same as in bulk-create-mass route)
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

  // Initialize results from current job state (to preserve already processed items)
  const currentJob = await getJob(jobId);
  if (!currentJob) {
    console.error(`Job ${jobId} not found, cannot process`);
    return;
  }

  const results = {
    successful: currentJob.successful,
    failed: currentJob.failed,
    skipped: currentJob.skipped,
    reviews: [...(currentJob.reviews || [])],
    errors: [...(currentJob.errors || [])],
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
            result = await retryWithBackoff(
              () => processGame(item, { status, skipExisting: true }),
              itemName
            );
            break;
          
          case "movie":
            result = await retryWithBackoff(
              () => processMovie(item, { status, skipExisting: true }),
              itemName
            );
            break;
          
          case "series":
            result = await retryWithBackoff(
              () => processSeries(item, { status, skipExisting: true }),
              itemName
            );
            break;
          
          case "hardware":
            result = await retryWithBackoff(
              () => processHardware(item.name, { status, skipExisting: true }),
              itemName
            );
            break;
          
          case "product":
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

