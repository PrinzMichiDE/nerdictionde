import { PrismaClient } from "@prisma/client";
import { getTMDBMovieById, getTMDBSeriesById } from "../src/lib/tmdb";
import { generateMovieReviewContent, generateSeriesReviewContent } from "../src/lib/review-generation";
import { replaceImagePlaceholders } from "../src/lib/image-placeholder";
import { generateSEOMetadata } from "../src/lib/seo-generation";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ProgressState {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  failedReviews: Array<{ id: string; title: string; error: string }>;
  successfulReviews: Array<{ id: string; title: string }>;
  lastProcessedIndex: number;
}

const PROGRESS_FILE = path.join(process.cwd(), "scripts", "movie-series-regeneration-progress.json");

function loadProgress(): ProgressState | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("Error loading progress:", error);
  }
  return null;
}

function saveProgress(state: ProgressState) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

function deleteProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }
  } catch (error) {
    console.error("Error deleting progress:", error);
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 2000
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`  ⚠️  Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError || new Error("Unknown error");
}

async function regenerateReview(review: {
  id: string;
  title: string;
  category: string;
  tmdbId: number | null;
  images: string[];
}): Promise<{ success: boolean; error?: string }> {
  if (!review.tmdbId) {
    return { success: false, error: "No tmdbId" };
  }

  // Fetch full TMDB details (includes credits, external_ids via append_to_response)
  let generated:
    | {
        de: { title: string; content: string; pros: string[]; cons: string[] };
        en: { title: string; content: string; pros: string[]; cons: string[] };
        score: number;
      }
    | undefined;

  if (review.category === "movie") {
    const movie = await getTMDBMovieById(review.tmdbId);
    if (!movie) return { success: false, error: "TMDB movie not found" };
    generated = await generateMovieReviewContent(movie);
  } else if (review.category === "series") {
    const serie = await getTMDBSeriesById(review.tmdbId);
    if (!serie) return { success: false, error: "TMDB series not found" };
    generated = await generateSeriesReviewContent(serie);
  } else {
    return { success: false, error: "Unsupported category" };
  }

  const contentDe = replaceImagePlaceholders(generated.de.content, review.images, review.title);
  const contentEn = replaceImagePlaceholders(generated.en.content, review.images, review.title);

  let seoMeta: { metaDescription: string; metaKeywords: string } | null = null;
  try {
    seoMeta = await generateSEOMetadata(generated.de.title, contentDe, review.category);
  } catch {
    // Non-blocking
  }

  await prisma.review.update({
    where: { id: review.id },
    data: {
      title: generated.de.title,
      title_en: generated.en.title,
      content: contentDe,
      content_en: contentEn,
      score: generated.score,
      pros: generated.de.pros,
      pros_en: generated.en.pros,
      cons: generated.de.cons,
      cons_en: generated.en.cons,
      metaDescription: seoMeta?.metaDescription ?? null,
      metaKeywords: seoMeta?.metaKeywords ?? null,
    },
  });

  return { success: true };
}

async function main() {
  const args = process.argv.slice(2);
  const category = args.find((a) => a.startsWith("--category="))?.split("=")[1] || "all";
  const status = args.find((a) => a.startsWith("--status="))?.split("=")[1] || "published";
  const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
  const limit = limitArg ? parseInt(limitArg, 10) : undefined;
  const force = args.includes("--force");

  console.log("🚀 Regenerating movie/series review content with enriched research");
  console.log("=".repeat(60));
  console.log(`Category: ${category} | Status: ${status}${limit ? ` | Limit: ${limit}` : ""}${force ? " | Force" : ""}`);

  const where: any = {
    category: { in: category === "movie" ? ["movie"] : category === "series" ? ["series"] : ["movie", "series"] },
    tmdbId: { not: null },
  };
  if (status === "published") {
    where.status = "published";
  } else if (status === "draft") {
    where.status = "draft";
  } else if (status === "all") {
    delete where.status;
  }

  const reviews = await prisma.review.findMany({
    where,
    select: { id: true, title: true, category: true, tmdbId: true, images: true },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });

  if (reviews.length === 0) {
    console.log("⚠️  No reviews found matching the criteria.");
    await prisma.$disconnect();
    return;
  }

  console.log(`📊 Found ${reviews.length} reviews to regenerate`);

  const existingProgress = loadProgress();
  let progress: ProgressState;
  let startIndex = 0;

  if (existingProgress && !force) {
    console.log(`📂 Resuming: processed ${existingProgress.processed}/${existingProgress.total}`);
    progress = existingProgress;
    startIndex = existingProgress.lastProcessedIndex + 1;
  } else {
    if (existingProgress && force) {
      console.log("⚠️  --force given. Starting fresh...");
      deleteProgress();
    }
    progress = {
      total: reviews.length,
      processed: 0,
      successful: 0,
      failed: 0,
      failedReviews: [],
      successfulReviews: [],
      lastProcessedIndex: -1,
    };
  }

  const startTime = Date.now();
  const toProcess = reviews.slice(startIndex);

  for (let i = 0; i < toProcess.length; i++) {
    const review = toProcess[i];
    const index = startIndex + i;
    console.log(`\n[${index + 1}/${reviews.length}] ${review.title} (${review.category})`);

    try {
      const result = await retryWithBackoff(() => regenerateReview(review));
      if (result.success) {
        progress.successful++;
        progress.successfulReviews.push({ id: review.id, title: review.title });
        console.log(`  ✅ Regenerated`);
      } else {
        progress.failed++;
        progress.failedReviews.push({ id: review.id, title: review.title, error: result.error || "Unknown" });
        console.error(`  ❌ ${result.error}`);
      }
    } catch (error: any) {
      progress.failed++;
      progress.failedReviews.push({ id: review.id, title: review.title, error: error.message });
      console.error(`  ❌ ${error.message}`);
    }

    progress.processed = index + 1;
    progress.lastProcessedIndex = index;
    saveProgress(progress);

    // Polite delay between items to respect rate limits
    if (i < toProcess.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n" + "=".repeat(60));
  console.log(`✅ Done in ${duration}s`);
  console.log(`   Successful: ${progress.successful}`);
  console.log(`   Failed: ${progress.failed}`);
  if (progress.failedReviews.length > 0) {
    console.log("\nFailed reviews:");
    progress.failedReviews.forEach((f) => console.log(`   - ${f.title}: ${f.error}`));
  }

  if (progress.failed === 0) {
    deleteProgress();
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("Fatal error:", error);
  await prisma.$disconnect();
  process.exit(1);
});
