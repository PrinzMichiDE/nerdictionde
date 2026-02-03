/**
 * Manual script to backfill deal review links
 * Run: npx tsx scripts/backfill-deal-links.ts
 */
import "dotenv/config";
import { backfillDealReviewLinks } from "../src/lib/deal-matching";

async function main() {
  console.log("Backfilling deal review links...");
  const { updated } = await backfillDealReviewLinks(100);
  console.log(`Done. Updated ${updated} deals with review links.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
