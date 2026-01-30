import { NextRequest, NextResponse } from "next/server";
import axios, { AxiosError } from "axios";
import { parseStringPromise } from "xml2js";
import prisma from "@/lib/prisma";
import { detectHardwareType, createHardware } from "@/lib/hardware";
import { generateHardwareReviewContent } from "@/lib/review-generation";
import { generateAndSaveCommentsForReview } from "@/lib/comment-generation";
import { searchAmazonHardware } from "@/lib/amazon-search";
import { checkAdminAuth } from "@/lib/auth";

interface RSSItem {
  title: string[];
  link: string[];
  description: string[];
  "content:encoded"?: string[];
  pubDate: string[];
  category?: string[];
}

interface RSSFeed {
  rss: {
    channel: Array<{
      item: RSSItem[];
    }>;
  };
}

// Configuration constants
const RSS_FEED_URL = process.env.HARDWARE_RSS_FEED_URL || "https://www.spieletester.de/hardware/feed/";
const DEFAULT_MAX_ITEMS = parseInt(process.env.HARDWARE_RSS_MAX_ITEMS || "10", 10);
const DEFAULT_DELAY_MS = parseInt(process.env.HARDWARE_RSS_DELAY_MS || "2000", 10);
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 1000;
const DEFAULT_RANDOM_FEEDBACK_COUNT = parseInt(process.env.RANDOM_FEEDBACK_COUNT || "5", 10);

// Extract hardware name from article title with improved patterns
function extractHardwareName(title: string): string | null {
  if (!title || typeof title !== "string") {
    return null;
  }

  let name = title
    // Remove common suffixes
    .replace(/\s*\(Hardware\)\s*/gi, "")
    .replace(/\s*\[Hardware\]\s*/gi, "")
    .replace(/\s*Hardware\s*/gi, "")
    .replace(/\s*Test\s*$/gi, "")
    .replace(/\s*Review\s*$/gi, "")
    .replace(/\s*im Test\s*$/gi, "")
    .replace(/\s*im Review\s*$/gi, "")
    .replace(/\s*–\s*.*$/g, "") // Remove everything after em-dash
    .replace(/\s*-\s*.*$/g, "") // Remove everything after dash (if no em-dash)
    .trim();

  // Remove leading/trailing punctuation
  name = name.replace(/^[:\-–—\s]+|[:\-–—\s]+$/g, "").trim();

  if (name.length < 3) {
    return null;
  }

  return name;
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Parse manufacturer and model from hardware name with improved detection
function parseHardwareName(name: string): { manufacturer?: string; model?: string } {
  const manufacturers = [
    "NVIDIA", "AMD", "Intel", "ASUS", "MSI", "Gigabyte", "EVGA", "Zotac",
    "Sony", "Microsoft", "Nintendo", "Razer", "Logitech", "Corsair",
    "Samsung", "Western Digital", "Seagate", "Crucial", "Kingston",
    "Cooler Master", "Noctua", "be quiet!", "Fractal Design", "Lian Li",
    "OBSBOT", "SteelSeries", "HyperX", "ROCCAT", "Trust", "Trust Gaming",
    "AOC", "iiyama", "CHERRY", "XTRFY", "OXS", "Hexcal", "BenQ", "LG",
    "Dell", "HP", "Lenovo", "ASRock", "Biostar", "Palit", "PowerColor",
    "Sapphire", "XFX", "PNY", "Inno3D", "Galax", "Gainward", "Colorful"
  ];

  let manufacturer: string | undefined;
  let model: string | undefined;

  // Try exact match first (case-insensitive)
  for (const mfr of manufacturers) {
    const regex = new RegExp(`^${mfr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s+`, "i");
    if (regex.test(name)) {
      manufacturer = mfr;
      model = name.replace(regex, "").trim();
      break;
    }
  }

  // Fallback to pattern matching
  if (!manufacturer) {
    if (name.match(/RTX|GTX|GeForce/i)) {
      manufacturer = "NVIDIA";
      model = name;
    } else if (name.match(/Ryzen|Radeon|RX\s+\d/i)) {
      manufacturer = "AMD";
      model = name;
    } else if (name.match(/Core\s+i[-\s]?\d|Xeon|Pentium|Celeron|Atom/i)) {
      manufacturer = "Intel";
      model = name;
    } else if (name.match(/PlayStation|PS[45]|PS\s*[45]/i)) {
      manufacturer = "Sony";
      model = name;
    } else if (name.match(/Xbox\s*(Series\s*[XS]|One|360)?/i)) {
      manufacturer = "Microsoft";
      model = name;
    } else if (name.match(/Nintendo|Switch/i)) {
      manufacturer = "Nintendo";
      model = name;
    } else {
      model = name;
    }
  }

  return { manufacturer, model };
}

// Retry helper with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY_BASE_MS
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Extract description from RSS item
function extractDescription(item: RSSItem): string | undefined {
  if (item["content:encoded"] && item["content:encoded"][0]) {
    // Remove HTML tags and get first paragraph
    const content = item["content:encoded"][0]
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return content.substring(0, 500); // Limit to 500 chars
  }
  if (item.description && item.description[0]) {
    return item.description[0].replace(/<[^>]*>/g, "").trim();
  }
  return undefined;
}

// Process a single hardware item with improved deduplication and error handling
async function processHardwareItem(
  item: RSSItem,
  skipExisting: boolean = true,
  itemIndex?: number
): Promise<{ success: boolean; reviewId?: string; error?: string; skipped?: boolean; hardwareName?: string }> {
  const title = item.title?.[0] || "Unknown";
  const hardwareName = extractHardwareName(title);

  if (!hardwareName) {
    return { success: false, error: `Could not extract hardware name from: "${title}"`, hardwareName: title };
  }

  console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Processing: ${hardwareName}`);

  try {
    // Generate slug for deduplication check
    const slug = generateSlug(hardwareName);

    // Optimized deduplication check - only check specific slug and title matches
    if (skipExisting) {
      try {
        // Check exact slug match
        const existingBySlug = await prisma.review.findFirst({
          where: {
            category: "hardware",
            slug: {
              in: [slug, `${slug}-${hardwareName.toLowerCase().slice(-5)}`],
            },
          },
          select: { id: true },
        });

        if (existingBySlug) {
          console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Skipped: Review with slug "${slug}" already exists`);
          return { success: false, error: "Review already exists (slug match)", skipped: true, hardwareName };
        }

        // Check title similarity (fuzzy match)
        const existingByTitle = await prisma.review.findFirst({
          where: {
            category: "hardware",
            title: {
              contains: hardwareName,
              mode: "insensitive",
            },
          },
          select: { id: true },
        });

        if (existingByTitle) {
          console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Skipped: Review with similar title already exists`);
          return { success: false, error: "Review already exists (title match)", skipped: true, hardwareName };
        }
      } catch (error) {
        console.error(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Error checking existing reviews:`, error);
        // Continue if check fails
      }
    }

    // Detect hardware type
    const hardwareType = detectHardwareType(hardwareName) || "monitor";
    console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Detected type: ${hardwareType}`);

    // Parse manufacturer and model
    const { manufacturer, model } = parseHardwareName(hardwareName);
    if (manufacturer) {
      console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Manufacturer: ${manufacturer}, Model: ${model || "N/A"}`);
    }

    // Optimized hardware lookup - use database query instead of loading all
    let hardware = null;
    try {
      // Try to find existing hardware by name or model
      hardware = await prisma.hardware.findFirst({
        where: {
          OR: [
            { name: { contains: hardwareName, mode: "insensitive" as const } },
            ...(model ? [{ model: { contains: model, mode: "insensitive" as const } }] : []),
            ...(manufacturer ? [{ manufacturer: { contains: manufacturer, mode: "insensitive" as const } }] : []),
          ],
        },
      });
    } catch (error) {
      console.error(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Error checking hardware:`, error);
    }

    // Create hardware entry if it doesn't exist
    if (!hardware) {
      const description = extractDescription(item);
      console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Creating new hardware entry`);
      hardware = await createHardware({
        name: hardwareName,
        type: hardwareType,
        manufacturer,
        model: model || hardwareName,
        description,
        images: [],
      });
    } else {
      console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Using existing hardware: ${hardware.name}`);
    }

    // Check if review already exists for this hardware
    if (skipExisting && hardware) {
      const existingReview = await prisma.review.findFirst({
        where: { hardwareId: hardware.id },
        select: { id: true },
      });
      if (existingReview) {
        console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Skipped: Review already exists for hardware ID ${hardware.id}`);
        return { success: false, error: "Review already exists for hardware", skipped: true, hardwareName };
      }
    }

    // Generate review content using AI with retry
    console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Generating review content...`);
    const reviewContent = await retryWithBackoff(async () => {
      return await generateHardwareReviewContent({
        name: hardware!.name,
        type: hardware!.type as any,
        manufacturer: hardware!.manufacturer || undefined,
        model: hardware!.model || undefined,
        description: hardware!.description || undefined,
        specs: hardware!.specs || undefined,
      });
    });

    // Generate unique slug
    let finalSlug = generateSlug(reviewContent.de.title);
    const existingSlug = await prisma.review.findUnique({ where: { slug: finalSlug }, select: { id: true } });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Generate Amazon affiliate link with retry
    let affiliateLink: string | null = null;
    try {
      affiliateLink = await retryWithBackoff(async () => {
        return await searchAmazonHardware(hardwareName, manufacturer, model);
      }, 2); // Only 2 retries for affiliate link
      console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Generated affiliate link`);
    } catch (error) {
      console.warn(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Could not generate Amazon affiliate link:`, error);
      // Continue without affiliate link if search fails
    }

    // Create review
    console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] Creating review: ${reviewContent.de.title}`);
    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug: finalSlug,
        category: "hardware",
        content: reviewContent.de.content,
        content_en: reviewContent.en.content,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: [],
        youtubeVideos: [],
        status: "published", // Automatically publish hardware reviews from RSS feed
        hardwareId: hardware.id,
        specs: reviewContent.specs || hardware.specs || null,
        affiliateLink: affiliateLink,
      },
    });

    generateAndSaveCommentsForReview(review.id, {
      reviewTitle: reviewContent.de.title,
      score: reviewContent.score,
      pros: reviewContent.de.pros,
      cons: reviewContent.de.cons,
      category: "hardware",
    }).catch((e) => console.warn("Comment generation for hardware review failed:", e));

    console.log(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] ✅ Successfully created review: ${review.slug}`);
    return { success: true, reviewId: review.id, hardwareName };
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error(`[${itemIndex !== undefined ? itemIndex + 1 : "?"}] ❌ Error processing ${hardwareName}:`, errorMessage);
    return { success: false, error: errorMessage, hardwareName };
  }
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check for authorization (Vercel Cron Secret or Admin Auth)
    const authHeader = req.headers.get('authorization');
    const hasCronSecret = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const hasAdminAuth = checkAdminAuth(req);
    
    if (!hasCronSecret && !hasAdminAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get configurable parameters from query string or use defaults
    const url = new URL(req.url);
    const maxItems = parseInt(url.searchParams.get("maxItems") || String(DEFAULT_MAX_ITEMS), 10);
    const delayMs = parseInt(url.searchParams.get("delayMs") || String(DEFAULT_DELAY_MS), 10);

    console.log(`🚀 Starting Hardware RSS fetch`);
    console.log(`📡 RSS Feed: ${RSS_FEED_URL}`);
    console.log(`⚙️  Max Items: ${maxItems}, Delay: ${delayMs}ms`);

    // Fetch RSS feed with retry
    const response = await retryWithBackoff(async () => {
      return await axios.get(RSS_FEED_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 30000, // 30 second timeout
      });
    });

    // Parse XML
    const parsed = (await parseStringPromise(response.data)) as RSSFeed;
    const items = parsed.rss.channel[0].item || [];

    console.log(`📰 Found ${items.length} items in RSS feed`);

    const results = {
      total: Math.min(maxItems, items.length),
      successful: 0,
      failed: 0,
      skipped: 0,
      reviews: [] as Array<{ id: string; title: string; slug: string }>,
      errors: [] as Array<{ hardware: string; error: string }>,
      skippedItems: [] as Array<{ hardware: string; reason: string }>,
    };

    // Process items
    const itemsToProcess = items.slice(0, maxItems);
    console.log(`🔄 Processing ${itemsToProcess.length} items...\n`);

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      const result = await processHardwareItem(item, true, i);

      if (result.success && result.reviewId) {
        results.successful++;
        const review = await prisma.review.findUnique({
          where: { id: result.reviewId },
          select: { id: true, title: true, slug: true },
        });
        if (review) {
          results.reviews.push({
            id: review.id,
            title: review.title,
            slug: review.slug,
          });
        }
      } else if (result.skipped) {
        results.skipped++;
        results.skippedItems.push({
          hardware: result.hardwareName || item.title[0],
          reason: result.error || "Unknown reason",
        });
      } else {
        results.failed++;
        results.errors.push({
          hardware: result.hardwareName || item.title[0],
          error: result.error || "Unknown error",
        });
      }

      // Delay between items to avoid rate limiting (except for last item)
      if (i < itemsToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Publish any existing draft hardware reviews
    try {
      const draftHardwareReviews = await prisma.review.findMany({
        where: {
          category: "hardware",
          status: "draft",
        },
        select: { id: true },
      });

      if (draftHardwareReviews.length > 0) {
        await prisma.review.updateMany({
          where: {
            category: "hardware",
            status: "draft",
          },
          data: {
            status: "published",
          },
        });
        console.log(`📢 Published ${draftHardwareReviews.length} existing draft hardware reviews`);
      }
    } catch (error: any) {
      console.warn(`⚠️ Error publishing draft reviews:`, error?.message);
    }

    // Generate random community feedbacks for existing reviews
    const randomFeedbackCount = parseInt(url.searchParams.get("randomFeedbackCount") || String(DEFAULT_RANDOM_FEEDBACK_COUNT), 10);
    console.log(`\n💬 Generating random community feedbacks for ${randomFeedbackCount} reviews...`);
    
    const feedbackResults = {
      attempted: 0,
      successful: 0,
      failed: 0,
      reviews: [] as Array<{ reviewId: string; title: string; commentsGenerated: number }>,
      errors: [] as Array<{ reviewId: string; error: string }>,
    };

    try {
      // Select random published reviews that could benefit from more comments
      // Prefer reviews with fewer comments (0-3 comments)
      const allPublishedReviews = await prisma.review.findMany({
        where: {
          status: "published",
        },
        select: {
          id: true,
          title: true,
          score: true,
          pros: true,
          cons: true,
          category: true,
          _count: {
            select: {
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100, // Get recent 100 reviews to select from
      });

      // Filter reviews with few comments (0-5 comments) and shuffle
      const eligibleReviews = allPublishedReviews
        .filter((review) => review._count.comments <= 5)
        .sort(() => Math.random() - 0.5) // Shuffle
        .slice(0, randomFeedbackCount);

      console.log(`📋 Found ${eligibleReviews.length} eligible reviews for feedback generation`);

      for (const review of eligibleReviews) {
        feedbackResults.attempted++;
        try {
          await generateAndSaveCommentsForReview(review.id, {
            reviewTitle: review.title,
            score: review.score,
            pros: review.pros,
            cons: review.cons,
            category: review.category,
          });

          // Count how many comments were actually created
          const commentCount = await prisma.comment.count({
            where: { reviewId: review.id },
          });

          feedbackResults.successful++;
          feedbackResults.reviews.push({
            reviewId: review.id,
            title: review.title,
            commentsGenerated: commentCount,
          });
          console.log(`✅ Generated feedback for: ${review.title.substring(0, 50)}...`);
        } catch (error: any) {
          feedbackResults.failed++;
          const errorMessage = error?.message || String(error);
          feedbackResults.errors.push({
            reviewId: review.id,
            error: errorMessage,
          });
          console.warn(`⚠️ Failed to generate feedback for review ${review.id}:`, errorMessage);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error during random feedback generation:`, error);
      feedbackResults.errors.push({
        reviewId: "unknown",
        error: error?.message || String(error),
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Hardware RSS fetch completed in ${duration}s`);
    console.log(`📊 RSS Results: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`);
    console.log(`💬 Feedback Results: ${feedbackResults.successful} successful, ${feedbackResults.failed} failed`);

    return NextResponse.json({
      message: `Hardware RSS fetch completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped. Random feedbacks: ${feedbackResults.successful} successful, ${feedbackResults.failed} failed`,
      results: {
        ...results,
        randomFeedbacks: feedbackResults,
        duration: parseFloat(duration),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Hardware RSS fetch error after ${duration}s:`, error);
    
    const errorMessage = error instanceof AxiosError 
      ? `Network error: ${error.message}`
      : error?.message || String(error);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        duration: parseFloat(duration),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering with optional body parameters
export async function POST(req: NextRequest) {
  try {
    // Check for authorization (Vercel Cron Secret or Admin Auth)
    const authHeader = req.headers.get('authorization');
    const hasCronSecret = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const hasAdminAuth = checkAdminAuth(req);
    
    if (!hasCronSecret && !hasAdminAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to parse body for configuration
    let body: { maxItems?: number; delayMs?: number } = {};
    try {
      const contentType = req.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        body = await req.json();
      }
    } catch {
      // Ignore body parsing errors, use defaults
    }

    // Create a new request with query parameters from body
    const url = new URL(req.url);
    if (body.maxItems) {
      url.searchParams.set("maxItems", String(body.maxItems));
    }
    if (body.delayMs) {
      url.searchParams.set("delayMs", String(body.delayMs));
    }

    // Create modified request
    const modifiedReq = new NextRequest(url, {
      method: "GET",
      headers: req.headers,
    });

    return GET(modifiedReq);
  } catch (error) {
    // Fallback to simple GET if body parsing fails
    return GET(req);
  }
}
