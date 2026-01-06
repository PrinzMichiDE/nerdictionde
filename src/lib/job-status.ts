import prisma from "./prisma";

export interface JobItem {
  name: string;
  igdbId?: number;
  tmdbId?: number;
  status: "pending" | "processing" | "completed" | "failed" | "skipped";
  error?: string;
  reviewId?: string;
}

export interface JobStatus {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  category: string;
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  queue: JobItem[];
  currentBatch: number;
  totalBatches: number;
  startTime: number;
  estimatedTimeRemaining?: number; // in seconds
  errors: Array<{ item: string; igdbId?: number; tmdbId?: number; error: string }>;
  reviews: Array<{ id: string; title: string; slug: string; igdbId?: number; tmdbId?: number }>;
  config?: any;
}

export async function createJob(
  jobId: string, 
  total: number, 
  totalBatches: number, 
  category: string = "game",
  config?: any
): Promise<JobStatus> {
  const job = await prisma.bulkJob.create({
    data: {
      jobId,
      status: "pending",
      category,
      total,
      totalBatches,
      currentBatch: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      startTime: new Date(),
      config: config || {},
      errors: [],
      reviews: [],
    },
  });

  return {
    jobId: job.jobId,
    status: job.status as any,
    category: job.category,
    total: job.total,
    processed: job.processed,
    successful: job.successful,
    failed: job.failed,
    skipped: job.skipped,
    queue: [],
    currentBatch: job.currentBatch,
    totalBatches: job.totalBatches,
    startTime: job.startTime.getTime(),
    estimatedTimeRemaining: job.estimatedTimeRemaining || undefined,
    errors: (job.errors as any) || [],
    reviews: (job.reviews as any) || [],
    config: job.config,
  };
}

export async function getJob(jobId: string): Promise<JobStatus | undefined> {
  const job = await prisma.bulkJob.findUnique({
    where: { jobId },
    include: {
      queue: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!job) return undefined;

  return {
    jobId: job.jobId,
    status: job.status as any,
    category: job.category,
    total: job.total,
    processed: job.processed,
    successful: job.successful,
    failed: job.failed,
    skipped: job.skipped,
    queue: job.queue.map(item => ({
      name: item.name,
      igdbId: item.igdbId || undefined,
      tmdbId: item.tmdbId || undefined,
      status: item.status as any,
      error: item.error || undefined,
      reviewId: item.reviewId || undefined,
    })),
    currentBatch: job.currentBatch,
    totalBatches: job.totalBatches,
    startTime: job.startTime.getTime(),
    estimatedTimeRemaining: job.estimatedTimeRemaining || undefined,
    errors: (job.errors as any) || [],
    reviews: (job.reviews as any) || [],
    config: job.config,
  };
}

export async function getAllJobs(limit: number = 50): Promise<JobStatus[]> {
  const jobs = await prisma.bulkJob.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      queue: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return jobs.map(job => ({
    jobId: job.jobId,
    status: job.status as any,
    category: job.category,
    total: job.total,
    processed: job.processed,
    successful: job.successful,
    failed: job.failed,
    skipped: job.skipped,
    queue: job.queue.map(item => ({
      name: item.name,
      igdbId: item.igdbId || undefined,
      tmdbId: item.tmdbId || undefined,
      status: item.status as any,
      error: item.error || undefined,
      reviewId: item.reviewId || undefined,
    })),
    currentBatch: job.currentBatch,
    totalBatches: job.totalBatches,
    startTime: job.startTime.getTime(),
    estimatedTimeRemaining: job.estimatedTimeRemaining || undefined,
    errors: (job.errors as any) || [],
    reviews: (job.reviews as any) || [],
    config: job.config,
  }));
}

export async function updateJob(
  jobId: string,
  updates: Partial<JobStatus>
): Promise<JobStatus | undefined> {
  const currentJob = await prisma.bulkJob.findUnique({ where: { jobId } });
  if (!currentJob) return undefined;

  const prismaUpdates: any = { ...updates };
  
  // Convert startTime if present
  if (updates.startTime) {
    prismaUpdates.startTime = new Date(updates.startTime);
  }

  // Handle status based estimated time remaining
  if (updates.processed !== undefined || updates.status === "running") {
    const processed = updates.processed ?? currentJob.processed;
    const status = updates.status ?? currentJob.status;
    const startTime = updates.startTime ? new Date(updates.startTime) : currentJob.startTime;
    
    if (processed > 0 && status === "running") {
      const elapsed = (Date.now() - startTime.getTime()) / 1000; // seconds
      const avgTimePerItem = elapsed / processed;
      const remaining = currentJob.total - processed;
      prismaUpdates.estimatedTimeRemaining = Math.ceil(remaining * avgTimePerItem);
    }
  }

  if (updates.status === "completed" || updates.status === "failed") {
    prismaUpdates.endTime = new Date();
  }

  const updated = await prisma.bulkJob.update({
    where: { jobId },
    data: prismaUpdates,
    include: {
      queue: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return {
    jobId: updated.jobId,
    status: updated.status as any,
    category: updated.category,
    total: updated.total,
    processed: updated.processed,
    successful: updated.successful,
    failed: updated.failed,
    skipped: updated.skipped,
    queue: updated.queue.map(item => ({
      name: item.name,
      igdbId: item.igdbId || undefined,
      tmdbId: item.tmdbId || undefined,
      status: item.status as any,
      error: item.error || undefined,
      reviewId: item.reviewId || undefined,
    })),
    currentBatch: updated.currentBatch,
    totalBatches: updated.totalBatches,
    startTime: updated.startTime.getTime(),
    estimatedTimeRemaining: updated.estimatedTimeRemaining || undefined,
    errors: (updated.errors as any) || [],
    reviews: (updated.reviews as any) || [],
    config: updated.config,
  };
}

export async function updateQueueItem(
  jobId: string,
  itemName: string,
  updates: Partial<JobItem>
): Promise<void> {
  // We identify the item by jobId and name (name should be unique within a job's queue)
  // First find the item to get its ID
  const item = await prisma.bulkJobItem.findFirst({
    where: {
      jobId,
      name: itemName,
    },
  });

  if (item) {
    await prisma.bulkJobItem.update({
      where: { id: item.id },
      data: updates as any,
    });
  }
}

export async function addToQueue(jobId: string, items: JobItem[]): Promise<void> {
  await prisma.bulkJobItem.createMany({
    data: items.map(item => ({
      jobId,
      name: item.name,
      igdbId: item.igdbId,
      tmdbId: item.tmdbId,
      status: item.status,
      error: item.error,
      reviewId: item.reviewId,
    })),
  });
}

export async function deleteJob(jobId: string): Promise<void> {
  await prisma.bulkJob.delete({
    where: { jobId },
  });
}

export async function cleanupOldJobs(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  await prisma.bulkJob.deleteMany({
    where: {
      OR: [
        { status: "completed" },
        { status: "failed" },
      ],
      startTime: {
        lt: oneHourAgo,
      },
    },
  });
}

/**
 * Reset stuck jobs that have been running/pending for too long without progress
 * Jobs are considered stuck if they haven't been updated in the last 30 minutes
 */
export async function resetStuckJobs(): Promise<number> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const stuckJobs = await prisma.bulkJob.findMany({
    where: {
      status: {
        in: ["running", "pending"],
      },
      updatedAt: {
        lt: thirtyMinutesAgo,
      },
    },
  });

  let resetCount = 0;
  for (const job of stuckJobs) {
    // Check if job actually made progress - if not, mark as failed
    // If it made some progress, mark as failed but keep the progress
    if (job.processed === 0 && job.status === "pending") {
      // Job never started - mark as failed
      await prisma.bulkJob.update({
        where: { jobId: job.jobId },
        data: { status: "failed" },
      });
      resetCount++;
    } else if (job.processed > 0 && job.processed < job.total) {
      // Job made some progress but got stuck - mark as failed
      await prisma.bulkJob.update({
        where: { jobId: job.jobId },
        data: { status: "failed" },
      });
      resetCount++;
    }
  }

  return resetCount;
}

export async function getRunningJobs(): Promise<JobStatus[]> {
  const jobs = await prisma.bulkJob.findMany({
    where: {
      status: {
        in: ["running", "pending"],
      },
    },
    include: {
      queue: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return jobs.map(job => ({
    jobId: job.jobId,
    status: job.status as any,
    category: job.category,
    total: job.total,
    processed: job.processed,
    successful: job.successful,
    failed: job.failed,
    skipped: job.skipped,
    queue: job.queue.map(item => ({
      name: item.name,
      igdbId: item.igdbId || undefined,
      tmdbId: item.tmdbId || undefined,
      status: item.status as any,
      error: item.error || undefined,
      reviewId: item.reviewId || undefined,
    })),
    currentBatch: job.currentBatch,
    totalBatches: job.totalBatches,
    startTime: job.startTime.getTime(),
    estimatedTimeRemaining: job.estimatedTimeRemaining || undefined,
    errors: (job.errors as any) || [],
    reviews: (job.reviews as any) || [],
    config: job.config,
  }));
}
