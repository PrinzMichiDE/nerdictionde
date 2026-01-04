// Simple in-memory job status store
// In production, this could be replaced with Redis or database

interface JobItem {
  name: string;
  igdbId?: number;
  tmdbId?: number;
  status: "pending" | "processing" | "completed" | "failed" | "skipped";
  error?: string;
  reviewId?: string;
}

interface JobStatus {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
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
}

const jobStore = new Map<string, JobStatus>();

export function createJob(jobId: string, total: number, totalBatches: number): JobStatus {
  const job: JobStatus = {
    jobId,
    status: "pending",
    total,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    queue: [],
    currentBatch: 0,
    totalBatches,
    startTime: Date.now(),
    errors: [],
    reviews: [],
  };
  
  jobStore.set(jobId, job);
  return job;
}

export function getJob(jobId: string): JobStatus | undefined {
  return jobStore.get(jobId);
}

export function updateJob(
  jobId: string,
  updates: Partial<JobStatus>
): JobStatus | undefined {
  const job = jobStore.get(jobId);
  if (!job) return undefined;

  const updated = { ...job, ...updates };
  
  // Calculate estimated time remaining
  if (updated.processed > 0 && updated.status === "running") {
    const elapsed = (Date.now() - updated.startTime) / 1000; // seconds
    const avgTimePerItem = elapsed / updated.processed;
    const remaining = updated.total - updated.processed;
    updated.estimatedTimeRemaining = Math.ceil(remaining * avgTimePerItem);
  }

  jobStore.set(jobId, updated);
  return updated;
}

export function updateQueueItem(
  jobId: string,
  itemName: string,
  updates: Partial<JobItem>
): void {
  const job = jobStore.get(jobId);
  if (!job) return;

  const itemIndex = job.queue.findIndex((item) => item.name === itemName);
  if (itemIndex >= 0) {
    job.queue[itemIndex] = { ...job.queue[itemIndex], ...updates };
    jobStore.set(jobId, job);
  }
}

export function addToQueue(jobId: string, items: JobItem[]): void {
  const job = jobStore.get(jobId);
  if (!job) return;

  job.queue.push(...items);
  jobStore.set(jobId, job);
}

export function deleteJob(jobId: string): void {
  jobStore.delete(jobId);
}

// Clean up old completed jobs (older than 1 hour)
export function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  
  for (const [jobId, job] of jobStore.entries()) {
    if (
      (job.status === "completed" || job.status === "failed") &&
      job.startTime < oneHourAgo
    ) {
      jobStore.delete(jobId);
    }
  }
}

// Run cleanup every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupOldJobs, 30 * 60 * 1000);
}
