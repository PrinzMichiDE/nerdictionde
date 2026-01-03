import { NextRequest, NextResponse } from "next/server";
import {
  getNextPendingJob,
  updateQueueJobStatus,
  QueueProgress,
  QueueResult,
} from "@/lib/queue";
import { getIGDBGamesBulk } from "@/lib/igdb";
import { processGame, generateSlug } from "@/lib/review-generation";
import prisma from "@/lib/prisma";

/**
 * Background worker to process bulk create queue jobs
 * This should be called periodically (e.g., every minute via cron)
 */
export async function GET(req: NextRequest) {
  try {
    // Check for authorization (Vercel Cron Secret)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the next pending job
    const job = await getNextPendingJob();

    if (!job) {
      return NextResponse.json({
        message: "No pending jobs in queue",
        processed: false,
      });
    }

    // Mark job as processing
    await updateQueueJobStatus(job.id, "processing", {
      startedAt: new Date(),
    });

    try {
      const config = job.config as any;
      const {
        queryOptions,
        batchSize = 5,
        delayBetweenBatches = 2000,
        status = "draft",
        skipExisting = true,
      } = config;

      // Fetch games from IGDB
      let games;
      try {
        games = await getIGDBGamesBulk(queryOptions);
      } catch (error: any) {
        throw new Error(`Failed to fetch games from IGDB: ${error.message}`);
      }

      if (!games || games.length === 0) {
        throw new Error("No games found matching the criteria");
      }

      // Update total items if not set
      if (job.totalItems === 0) {
        const totalBatches = Math.ceil(games.length / batchSize);
        await updateQueueJobStatus(job.id, "processing", {
          totalItems: games.length,
          totalBatches,
        });
      }

      const result: QueueResult = {
        reviews: [],
        errors: [],
      };

      // Process games in batches
      const totalBatches = Math.ceil(games.length / batchSize);
      let processedCount = 0;
      let successfulCount = 0;
      let failedCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < games.length; i += batchSize) {
        // Check if job was cancelled
        const currentJob = await prisma.bulkCreateQueue.findUnique({
          where: { id: job.id },
        });
        if (currentJob?.status === "cancelled") {
          return NextResponse.json({
            message: "Job was cancelled",
            jobId: job.id,
          });
        }

        const batch = games.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;

        // Update progress
        await updateQueueJobStatus(job.id, "processing", {
          currentBatch,
          progress: {
            currentGame: batch[0]?.name,
            currentGameIndex: i + 1,
            batchProgress: {
              current: currentBatch,
              total: totalBatches,
            },
          } as QueueProgress,
        });

        // Process batch
        const batchPromises = batch.map((game: any) =>
          processGame(game, { status, skipExisting })
        );

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((resultItem, index) => {
          const game = batch[index];
          processedCount++;

          if (resultItem.status === "fulfilled") {
            const processResult = resultItem.value;
            if (processResult.success && processResult.reviewId) {
              successfulCount++;
              result.reviews.push({
                id: processResult.reviewId,
                title: game.name,
                slug: generateSlug(game.name),
              });
            } else if (processResult.error === "Already exists") {
              skippedCount++;
            } else {
              failedCount++;
              result.errors.push({
                game: game.name,
                error: processResult.error || "Unknown error",
              });
            }
          } else {
            failedCount++;
            result.errors.push({
              game: game.name,
              error: resultItem.reason?.message || "Processing failed",
            });
          }
        });

        // Update progress after batch
        await updateQueueJobStatus(job.id, "processing", {
          processedItems: processedCount,
          successfulItems: successfulCount,
          failedItems: failedCount,
          skippedItems: skippedCount,
        });

        // Delay between batches (except for the last batch)
        if (i + batchSize < games.length) {
          await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
        }
      }

      // Mark job as completed
      await updateQueueJobStatus(job.id, "completed", {
        result,
        processedItems: processedCount,
        successfulItems: successfulCount,
        failedItems: failedCount,
        skippedItems: skippedCount,
        completedAt: new Date(),
      });

      return NextResponse.json({
        message: `Queue job ${job.id} processed successfully`,
        jobId: job.id,
        results: {
          total: games.length,
          successful: successfulCount,
          failed: failedCount,
          skipped: skippedCount,
        },
      });
    } catch (error: any) {
      // Mark job as failed
      await updateQueueJobStatus(job.id, "failed", {
        error: error.message,
        completedAt: new Date(),
      });

      return NextResponse.json(
        {
          message: `Queue job ${job.id} failed`,
          jobId: job.id,
          error: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Queue processing error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
