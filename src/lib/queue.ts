import prisma from "@/lib/prisma";
import { BulkQueryOptions } from "@/lib/igdb";

export interface QueueConfig {
  queryOptions: BulkQueryOptions;
  batchSize?: number;
  delayBetweenBatches?: number;
  status?: "draft" | "published";
  skipExisting?: boolean;
}

export interface QueueProgress {
  currentGame?: string;
  currentGameIndex?: number;
  batchProgress?: {
    current: number;
    total: number;
  };
}

export interface QueueResult {
  reviews: Array<{ id: string; title: string; slug: string }>;
  errors: Array<{ game: string; error: string }>;
}

/**
 * Create a new bulk create queue job
 */
export async function createBulkCreateQueueJob(config: QueueConfig) {
  return await prisma.bulkCreateQueue.create({
    data: {
      type: "bulk_create",
      config: config as any,
      progress: {},
      status: "pending",
    },
  });
}

/**
 * Get a queue job by ID
 */
export async function getQueueJob(id: string) {
  return await prisma.bulkCreateQueue.findUnique({
    where: { id },
  });
}

/**
 * Get all queue jobs, optionally filtered by status
 */
export async function getQueueJobs(status?: string, limit: number = 50) {
  const where = status ? { status } : {};
  return await prisma.bulkCreateQueue.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get the next pending queue job
 */
export async function getNextPendingJob() {
  return await prisma.bulkCreateQueue.findFirst({
    where: {
      status: "pending",
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

/**
 * Update queue job status
 */
export async function updateQueueJobStatus(
  id: string,
  status: "pending" | "processing" | "completed" | "failed" | "cancelled",
  updates?: {
    progress?: QueueProgress;
    result?: QueueResult;
    error?: string;
    totalItems?: number;
    processedItems?: number;
    successfulItems?: number;
    failedItems?: number;
    skippedItems?: number;
    currentBatch?: number;
    totalBatches?: number;
    startedAt?: Date;
    completedAt?: Date;
  }
) {
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (updates) {
    if (updates.progress) {
      updateData.progress = updates.progress;
    }
    if (updates.result) {
      updateData.result = updates.result as any;
    }
    if (updates.error !== undefined) {
      updateData.error = updates.error;
    }
    if (updates.totalItems !== undefined) {
      updateData.totalItems = updates.totalItems;
    }
    if (updates.processedItems !== undefined) {
      updateData.processedItems = updates.processedItems;
    }
    if (updates.successfulItems !== undefined) {
      updateData.successfulItems = updates.successfulItems;
    }
    if (updates.failedItems !== undefined) {
      updateData.failedItems = updates.failedItems;
    }
    if (updates.skippedItems !== undefined) {
      updateData.skippedItems = updates.skippedItems;
    }
    if (updates.currentBatch !== undefined) {
      updateData.currentBatch = updates.currentBatch;
    }
    if (updates.totalBatches !== undefined) {
      updateData.totalBatches = updates.totalBatches;
    }
    if (updates.startedAt) {
      updateData.startedAt = updates.startedAt;
    }
    if (updates.completedAt) {
      updateData.completedAt = updates.completedAt;
    }
  }

  return await prisma.bulkCreateQueue.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Cancel a queue job
 */
export async function cancelQueueJob(id: string) {
  return await updateQueueJobStatus(id, "cancelled");
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [pending, processing, completed, failed] = await Promise.all([
    prisma.bulkCreateQueue.count({ where: { status: "pending" } }),
    prisma.bulkCreateQueue.count({ where: { status: "processing" } }),
    prisma.bulkCreateQueue.count({ where: { status: "completed" } }),
    prisma.bulkCreateQueue.count({ where: { status: "failed" } }),
  ]);

  return {
    pending,
    processing,
    completed,
    failed,
    total: pending + processing + completed + failed,
  };
}
