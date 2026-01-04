import axios from "axios";
import { parseStringPromise } from "xml2js";
import prisma from "../src/lib/prisma";
import { detectHardwareType, createHardware } from "../src/lib/hardware";
import { generateHardwareReviewContent } from "../src/lib/review-generation";
import { uploadImage } from "../src/lib/blob";
import { generateReviewImages } from "../src/lib/image-generation";

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

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Extract hardware name from article title
function extractHardwareName(title: string): string | null {
  // Remove common suffixes like "(Hardware) Test", "Test", etc.
  let name = title
    .replace(/\s*\(Hardware\)\s*Test/gi, "")
    .replace(/\s*Test\s*$/gi, "")
    .replace(/\s*Review\s*$/gi, "")
    .trim();

  // If title is too generic, return null
  if (name.length < 3) {
    return null;
  }

  return name;
}

// Parse manufacturer and model from hardware name
function parseHardwareName(name: string): { manufacturer?: string; model?: string } {
  const manufacturers = [
    "NVIDIA", "AMD", "Intel", "ASUS", "MSI", "Gigabyte", "EVGA", "Zotac",
    "Sony", "Microsoft", "Nintendo", "Razer", "Logitech", "Corsair",
    "Samsung", "Western Digital", "Seagate", "Crucial", "Kingston",
    "Cooler Master", "Noctua", "be quiet!", "Fractal Design", "Lian Li",
    "OBSBOT", "SteelSeries", "HyperX", "ROCCAT", "Trust", "Trust Gaming"
  ];

  let manufacturer: string | undefined;
  let model: string | undefined;

  // Try to find manufacturer at the start
  for (const mfr of manufacturers) {
    if (name.toUpperCase().startsWith(mfr.toUpperCase())) {
      manufacturer = mfr;
      model = name.substring(mfr.length).trim();
      break;
    }
  }

  // Special patterns
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

// Process a single hardware item from RSS feed
async function processHardwareItem(
  item: RSSItem,
  skipExisting: boolean = true
): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  try {
    const title = item.title[0];
    const hardwareName = extractHardwareName(title);

    if (!hardwareName) {
      return { success: false, error: "Could not extract hardware name from title" };
    }

    console.log(`\n📦 Processing: ${hardwareName}`);

    // Detect hardware type
    const hardwareType = detectHardwareType(hardwareName) || "monitor";
    console.log(`   Type: ${hardwareType}`);

    // Parse manufacturer and model
    const { manufacturer, model } = parseHardwareName(hardwareName);
    console.log(`   Manufacturer: ${manufacturer || "Unknown"}`);
    console.log(`   Model: ${model || hardwareName}`);

    // Check if hardware already exists - use simple search
    let hardware = null;
    try {
      // Try to find by name first
      const allHardware = await prisma.hardware.findMany({
        where: {},
        take: 1000, // Get all hardware (or limit if too many)
      });
      
      hardware = allHardware.find(
        (h) =>
          h.name.toLowerCase().includes(hardwareName.toLowerCase()) ||
          (model && h.model?.toLowerCase().includes(model.toLowerCase()))
      ) || null;
    } catch (error) {
      // If query fails, continue without checking
      console.log(`   ⚠️  Could not check existing hardware: ${error}`);
    }

    // Check if review already exists
    if (skipExisting && hardware) {
      const existingReview = await prisma.review.findFirst({
        where: { hardwareId: hardware.id },
      });
      if (existingReview) {
        console.log(`   ⏭️  Skipping - Review already exists`);
        return { success: false, error: "Review already exists" };
      }
    }

    // Create hardware entry if it doesn't exist
    if (!hardware) {
      console.log(`   ➕ Creating hardware entry...`);
      hardware = await createHardware({
        name: hardwareName,
        type: hardwareType,
        manufacturer,
        model: model || hardwareName,
        images: [],
      });
    }

    // Generate review content using AI
    console.log(`   🤖 Generating review content...`);
    const reviewContent = await generateHardwareReviewContent({
      name: hardware.name,
      type: hardware.type as any,
      manufacturer: hardware.manufacturer || undefined,
      model: hardware.model || undefined,
      description: hardware.description || undefined,
      specs: hardware.specs || undefined,
    });

    // Generate slug
    let slug = generateSlug(reviewContent.de.title);
    const existingSlug = await prisma.review.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
    }

    // Generate images using Tavily (preferred) or OpenAI (fallback)
    let imageUrls: string[] = [];
    try {
      console.log(`   🎨 Generating review images...`);
      const generatedImages = await generateReviewImages({
        productName: hardware.name,
        productType: hardware.type,
        manufacturer: hardware.manufacturer || undefined,
        style: "professional",
        count: 3,
        tavilySearchResults: reviewContent.tavilySearchResults, // Use Tavily images if available
      });
      imageUrls = generatedImages;
      console.log(`   ✅ Generated ${imageUrls.length} images`);
    } catch (error) {
      console.error(`   ⚠️  Error generating images: ${error}`);
    }

    // Create review
    console.log(`   ✍️  Creating review: ${reviewContent.de.title}`);
    const review = await prisma.review.create({
      data: {
        title: reviewContent.de.title,
        title_en: reviewContent.en.title,
        slug,
        category: "hardware",
        content: reviewContent.de.content,
        content_en: reviewContent.en.content,
        score: reviewContent.score,
        pros: reviewContent.de.pros,
        pros_en: reviewContent.en.pros,
        cons: reviewContent.de.cons,
        cons_en: reviewContent.en.cons,
        images: imageUrls,
        youtubeVideos: [],
        status: "draft",
        hardwareId: hardware.id,
        specs: reviewContent.specs || hardware.specs || null,
      },
    });

    console.log(`   ✅ Review created: ${review.slug}`);
    return { success: true, reviewId: review.id };
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  const RSS_FEED_URL = "https://www.spieletester.de/hardware/feed/";
  const MAX_ITEMS = 10; // Limit to latest 10 items
  const SKIP_EXISTING = true;

  console.log("🚀 Starting hardware review creation from RSS feed...");
  console.log(`📡 Fetching RSS feed: ${RSS_FEED_URL}`);

  try {
    // Fetch RSS feed
    const response = await axios.get(RSS_FEED_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Parse XML
    const parsed = (await parseStringPromise(response.data)) as RSSFeed;
    const items = parsed.rss.channel[0].item || [];

    console.log(`📰 Found ${items.length} items in feed`);
    console.log(`📝 Processing latest ${Math.min(MAX_ITEMS, items.length)} items...\n`);

    const results = {
      total: Math.min(MAX_ITEMS, items.length),
      successful: 0,
      failed: 0,
      skipped: 0,
      reviews: [] as Array<{ id: string; title: string; slug: string }>,
      errors: [] as Array<{ hardware: string; error: string }>,
    };

    // Process items (limit to MAX_ITEMS)
    const itemsToProcess = items.slice(0, MAX_ITEMS);

    for (let i = 0; i < itemsToProcess.length; i++) {
      const item = itemsToProcess[i];
      console.log(`\n[${i + 1}/${itemsToProcess.length}]`);

      const result = await processHardwareItem(item, SKIP_EXISTING);

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
      } else if (result.error === "Review already exists") {
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

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total items processed: ${results.total}`);
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);

    if (results.reviews.length > 0) {
      console.log("\n📝 Created Reviews:");
      results.reviews.forEach((review) => {
        console.log(`   - ${review.title} (${review.slug})`);
      });
    }

    if (results.errors.length > 0) {
      console.log("\n❌ Errors:");
      results.errors.forEach((error) => {
        console.log(`   - ${error.hardware}: ${error.error}`);
      });
    }
  } catch (error: any) {
    console.error("❌ Fatal error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
