import { NextRequest, NextResponse } from "next/server";
import { scrapeMydealzDeals, saveScrapedDeals } from "@/lib/scrapers/mydealz";
import { backfillDealReviewLinks } from "@/lib/deal-matching";

/**
 * GET /api/cron/scrape-mydealz
 * Scrapes Mydealz.de for deals, stores them, and links to reviews via deal-matching.
 * Also backfills reviewId for existing unlinked deals.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const isCronAuth =
    process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!isCronAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limit = 50;
    const scraped = await scrapeMydealzDeals(limit);
    const { created, updated } = await saveScrapedDeals(scraped);

    const { updated: backfilled } = await backfillDealReviewLinks(100);

    return NextResponse.json({
      success: true,
      scraped: scraped.length,
      created,
      updated,
      backfilled,
    });
  } catch (error) {
    console.error("scrape-mydealz cron error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scrape failed" },
      { status: 500 }
    );
  }
}
