import { NextRequest, NextResponse } from "next/server";
import { getAmazonProductByASIN, hasPAAPICredentials } from "@/lib/amazon-paapi";
import { scrapeAmazonProduct } from "@/lib/amazon";

/**
 * Route to fetch current Amazon price by ASIN
 * Supports both official PA API and scraping as fallback
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const asin = searchParams.get("asin");

    if (!asin || !/^[A-Z0-9]{10}$/i.test(asin)) {
      return NextResponse.json({ error: "Valid ASIN is required" }, { status: 400 });
    }

    // 1. Try PA API first
    if (hasPAAPICredentials()) {
      try {
        const product = await getAmazonProductByASIN(asin);
        if (product.price) {
          return NextResponse.json({
            price: product.price,
            currency: product.currency || "EUR",
            source: "paapi",
            timestamp: new Date().toISOString()
          });
        }
      } catch (paapiError: any) {
        console.warn(`⚠️ PA API price fetch failed for ${asin}:`, paapiError.message);
      }
    }

    // 2. Fallback to Scraping
    try {
      const url = `https://www.amazon.de/dp/${asin}`;
      const scrapedData = await scrapeAmazonProduct(url);
      if (scrapedData.price) {
        return NextResponse.json({
          price: scrapedData.price,
          currency: "EUR",
          source: "scraping",
          timestamp: new Date().toISOString()
        });
      }
    } catch (scrapingError: any) {
      console.error(`❌ Scraping price fetch failed for ${asin}:`, scrapingError.message);
    }

    return NextResponse.json({ error: "Price could not be fetched" }, { status: 404 });
  } catch (error: any) {
    console.error("Price fetch API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

