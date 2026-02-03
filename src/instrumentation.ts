export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on server startup, not in edge runtime
    const { scrapeMydealzDeals, saveScrapedDeals } = await import('@/lib/scrapers/mydealz');
    const { backfillDealReviewLinks } = await import('@/lib/deal-matching');

    // Run in background without blocking server startup
    (async () => {
      try {
        console.log('[Instrumentation] Starting Mydealz deals scrape on server startup...');
        const limit = 50;
        const scraped = await scrapeMydealzDeals(limit);
        const { created, updated } = await saveScrapedDeals(scraped);
        
        // Backfill review links
        const { updated: backfilled } = await backfillDealReviewLinks(100);
        
        console.log(`[Instrumentation] Mydealz scrape completed: ${scraped.length} scraped, ${created} created, ${updated} updated, ${backfilled} backfilled`);
      } catch (error) {
        console.error('[Instrumentation] Error scraping Mydealz deals on startup:', error);
        // Don't throw - we don't want to block server startup
      }
    })();
  }
}
