import axios from "axios";
import { parseStringPromise } from "xml2js";

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

async function main() {
  const RSS_FEED_URL = "https://www.spieletester.de/hardware/feed/";
  const MAX_ITEMS = 10;
  const API_URL = process.env.API_URL || "http://localhost:3000";
  const API_ENDPOINT = `${API_URL}/api/reviews/bulk-create-hardware`;

  console.log("🚀 Starting hardware review creation from RSS feed...");
  console.log(`📡 RSS Feed: ${RSS_FEED_URL}`);
  console.log(`🔗 API Endpoint: ${API_ENDPOINT}\n`);

  try {
    // Fetch RSS feed
    console.log("📥 Fetching RSS feed...");
    const response = await axios.get(RSS_FEED_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    // Parse XML
    const parsed = (await parseStringPromise(response.data)) as RSSFeed;
    const items = parsed.rss.channel[0].item || [];

    console.log(`📰 Found ${items.length} items in feed\n`);

    const hardwareNames: string[] = [];

    // Extract hardware names
    for (let i = 0; i < Math.min(MAX_ITEMS, items.length); i++) {
      const item = items[i];
      const title = item.title[0];
      const hardwareName = extractHardwareName(title);

      if (hardwareName) {
        hardwareNames.push(hardwareName);
        console.log(`${i + 1}. ${hardwareName}`);
      }
    }

    console.log(`\n✅ Extracted ${hardwareNames.length} hardware items\n`);

    if (hardwareNames.length === 0) {
      console.log("⚠️  No hardware items found. Exiting.");
      return;
    }

    // Call API to create reviews
    console.log("🤖 Creating reviews via API...");
    console.log(`📤 Sending request to: ${API_ENDPOINT}\n`);

    const apiResponse = await axios.post(
      API_ENDPOINT,
      {
        hardwareNames,
        batchSize: 3,
        delayBetweenBatches: 3000,
        status: "draft",
        skipExisting: true,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 300000, // 5 minutes timeout
      }
    );

    const results = apiResponse.data.results;

    // Display results
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESULTS");
    console.log("=".repeat(60));
    console.log(`Total items: ${results.total}`);
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);

    if (results.reviews && results.reviews.length > 0) {
      console.log("\n📝 Created Reviews:");
      results.reviews.forEach((review: any) => {
        console.log(`   - ${review.title} (${review.slug})`);
      });
    }

    if (results.errors && results.errors.length > 0) {
      console.log("\n❌ Errors:");
      results.errors.forEach((error: any) => {
        console.log(`   - ${error.hardware}: ${error.error}`);
      });
    }

    console.log("\n✅ Process completed!");
  } catch (error: any) {
    if (error.response) {
      console.error("❌ API Error:", error.response.status, error.response.data);
    } else if (error.request) {
      console.error("❌ Network Error: Could not reach API");
      console.error("💡 Make sure the Next.js server is running:");
      console.error("   npm run dev");
    } else {
      console.error("❌ Error:", error.message);
    }
    process.exit(1);
  }
}

main();
