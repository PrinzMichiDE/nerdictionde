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

  console.log("🚀 Fetching hardware from RSS feed...");
  console.log(`📡 RSS Feed: ${RSS_FEED_URL}\n`);

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

    console.log(`\n✅ Extracted ${hardwareNames.length} hardware items`);
    console.log("\n📋 Hardware Names (for API):");
    console.log(JSON.stringify(hardwareNames, null, 2));

    console.log("\n💡 To create reviews, use the API endpoint:");
    console.log("POST /api/reviews/bulk-create-hardware");
    console.log("Body: { hardwareNames: " + JSON.stringify(hardwareNames) + " }");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
