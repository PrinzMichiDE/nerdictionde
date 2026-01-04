import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { parseStringPromise } from "xml2js";
import prisma from "@/lib/prisma";
import { detectHardwareType, createHardware } from "@/lib/hardware";
import { generateHardwareReviewContent } from "@/lib/review-generation";
import { searchAmazonHardware } from "@/lib/amazon-search";

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

// Extract hardware name from article title
function extractHardwareName(title: string): string | null {
  let name = title
    .replace(/\s*\(Hardware\)\s*Test/gi, "")
    .replace(/\s*Test\s*$/gi, "")
    .replace(/\s*Review\s*$/gi, "")
    .trim();

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

// Parse manufacturer and model from hardware name
function parseHardwareName(name: string): { manufacturer?: string; model?: string } {
  const manufacturers = [
    "NVIDIA", "AMD", "Intel", "ASUS", "MSI", "Gigabyte", "EVGA", "Zotac",
    "Sony", "Microsoft", "Nintendo", "Razer", "Logitech", "Corsair",
    "Samsung", "Western Digital", "Seagate", "Crucial", "Kingston",
    "Cooler Master", "Noctua", "be quiet!", "Fractal Design", "Lian Li",
    "OBSBOT", "SteelSeries", "HyperX", "ROCCAT", "Trust", "Trust Gaming",
    "AOC", "iiyama", "CHERRY", "XTRFY", "OXS", "Hexcal"
  ];

  let manufacturer: string | undefined;
  let model: string | undefined;

  for (const mfr of manufacturers) {
    if (name.toUpperCase().startsWith(mfr.toUpperCase())) {
      manufacturer = mfr;
      model = name.substring(mfr.length).trim();
      break;
    }
  }

  if (!manufacturer) {
    if (name.match(/RTX|GTX/i)) {
      manufacturer = "NVIDIA";
      model = name;
    } else if (name.match(/Ryzen|Radeon/i)) {
      manufacturer = "AMD";
      model = name;
    } else if (name.match(/Core i|Xeon|Pentium|Celeron/i)) {
      manufacturer = "Intel";
      model = name;
    } else if (name.match(/PlayStation|PS\d/i)) {
      manufacturer = "Sony";
      model = name;
    } else if (name.match(/Xbox/i)) {
      manufacturer = "Microsoft";
      model = name;
    } else {
      model = name;
    }
  }

  return { manufacturer, model };
}

// Process a single hardware item with deduplication
async function processHardwareItem(
  item: RSSItem,
  skipExisting: boolean = true
): Promise<{ success: boolean; reviewId?: string; error?: string; skipped?: boolean }> {
  try {
    const title = item.title[0];
    const hardwareName = extractHardwareName(title);

    if (!hardwareName) {
      return { success: false, error: "Could not extract hardware name" };
    }

    // Generate slug for deduplication check
    const slug = generateSlug(hardwareName);

    // Check if review with this slug already exists (deduplication)
    if (skipExisting) {
      try {
        const existingReviews = await prisma.review.findMany({
          where: {
            category: "hardware",
          },
          select: {
            slug: true,
            title: true,
          },
        });

        const exists = existingReviews.some(
          (r) =>
            r.slug === slug ||
            r.slug.startsWith(`${slug}-`) ||
            r.title.toLowerCase().includes(hardwareName.toLowerCase())
        );

        if (exists) {
          return { success: false, error: "Review already exists", skipped: true };
        }
      } catch (error) {
        console.error("Error checking existing reviews:", error);
        // Continue if check fails
      }
    }

    // Detect hardware type
    const hardwareType = detectHardwareType(hardwareName) || "monitor";

    // Parse manufacturer and model
    const { manufacturer, model } = parseHardwareName(hardwareName);

    // Check if hardware entry exists
    let hardware = null;
    try {
      const allHardware = await prisma.hardware.findMany({
        take: 1000,
      });
      
      hardware = allHardware.find(
        (h) =>
          h.name.toLowerCase().includes(hardwareName.toLowerCase()) ||
          (model && h.model?.toLowerCase().includes(model.toLowerCase()))
      ) || null;
    } catch (error) {
      // If query fails, continue without checking
      console.error("Error checking hardware:", error);
    }

    // Create hardware entry if it doesn't exist
    if (!hardware) {
      hardware = await createHardware({
        name: hardwareName,
        type: hardwareType,
        manufacturer,
        model: model || hardwareName,
        images: [],
      });
    }

    // Check if review already exists for this hardware
    if (skipExisting && hardware) {
      const existingReview = await prisma.review.findFirst({
        where: { hardwareId: hardware.id },
      });
      if (existingReview) {
        return { success: false, error: "Review already exists for hardware", skipped: true };
      }
    }

    // Generate review content using AI
    const reviewContent = await generateHardwareReviewContent({
      name: hardware.name,
      type: hardware.type as any,
      manufacturer: hardware.manufacturer || undefined,
      model: hardware.model || undefined,
      description: hardware.description || undefined,
      specs: hardware.specs || undefined,
    });

    // Generate unique slug
    let finalSlug = generateSlug(reviewContent.de.title);
    const existingSlug = await prisma.review.findUnique({ where: { slug: finalSlug } });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Generate Amazon affiliate link
    let affiliateLink: string | null = null;
    try {
      affiliateLink = await searchAmazonHardware(
        hardwareName,
        manufacturer,
        model
      );
    } catch (error) {
      console.error("Error generating Amazon affiliate link:", error);
      // Continue without affiliate link if search fails
    }

    // Create review
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
        status: "draft",
        hardwareId: hardware.id,
        specs: reviewContent.specs || hardware.specs || null,
        affiliateLink: affiliateLink,
      },
    });

    return { success: true, reviewId: review.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check for authorization (Vercel Cron Secret)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const RSS_FEED_URL = "https://www.spieletester.de/hardware/feed/";
    const MAX_ITEMS = 10;

    // Fetch RSS feed
    const response = await axios.get(RSS_FEED_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Parse XML
    const parsed = (await parseStringPromise(response.data)) as RSSFeed;
    const items = parsed.rss.channel[0].item || [];

    const results = {
      total: Math.min(MAX_ITEMS, items.length),
      successful: 0,
      failed: 0,
      skipped: 0,
      reviews: [] as Array<{ id: string; title: string; slug: string }>,
      errors: [] as Array<{ hardware: string; error: string }>,
    };

    // Process items
    const itemsToProcess = items.slice(0, MAX_ITEMS);

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      const result = await processHardwareItem(item, true);

      if (result.success && result.reviewId) {
        results.successful++;
        const review = await prisma.review.findUnique({
          where: { id: result.reviewId },
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
      } else {
        results.failed++;
        results.errors.push({
          hardware: item.title[0],
          error: result.error || "Unknown error",
        });
      }

      // Delay between items to avoid rate limiting
      if (i < itemsToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      message: `Hardware RSS fetch completed: ${results.successful} successful, ${results.failed} failed, ${results.skipped} skipped`,
      results,
    });
  } catch (error: any) {
    console.error("Hardware RSS fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Also support POST for manual triggering
export async function POST(req: NextRequest) {
  return GET(req);
}
