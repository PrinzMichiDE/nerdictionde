/**
 * Manual script to scrape Mydealz.de deals and save to DB.
 * Run: npx tsx scripts/scrape-mydealz-deals.ts
 */
import "dotenv/config";
import { scrapeMydealzDeals, saveScrapedDeals } from "../src/lib/scrapers/mydealz";

async function main() {
  const limit = parseInt(process.env.MYDEALZ_LIMIT ?? "100", 10);
  console.log(`Scraping up to ${limit} deals from Mydealz...`);
  const scraped = await scrapeMydealzDeals(limit);
  console.log(`Scraped ${scraped.length} deals. Saving...`);
  const { created, updated } = await saveScrapedDeals(scraped);
  console.log(`Done. Created: ${created}, Updated: ${updated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
