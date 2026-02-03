/**
 * Price monitoring for reviews: fetch current prices and record history.
 * Used by cron /api/cron/update-prices.
 */

import prisma from "@/lib/prisma";
import { getAmazonProductByASIN, hasPAAPICredentials } from "@/lib/amazon-paapi";
import { scrapeAmazonProduct } from "@/lib/amazon";

const BATCH_SIZE = 30;
const DELAY_BETWEEN_REQUESTS_MS = 1500;

/**
 * Parse price string (e.g. "34,99 €", "34.99", "€ 1.199,00") to number.
 */
export function parsePriceToNumber(priceStr: string | undefined): number | null {
  if (!priceStr || typeof priceStr !== "string") return null;
  const cleaned = priceStr.replace(/[^\d,.-]/g, "").replace(",", ".").trim();
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return Number.isNaN(num) ? null : num;
}

/**
 * Fetch current Amazon price for an ASIN (PA API or scraping fallback).
 */
export async function fetchAmazonPrice(asin: string): Promise<{
  price: number | null;
  currency: string;
  source: string;
  url: string;
} | null> {
  const url = `https://www.amazon.de/dp/${asin}`;

  if (hasPAAPICredentials()) {
    try {
      const product = await getAmazonProductByASIN(asin);
      const price = parsePriceToNumber(product.price);
      if (price != null) {
        return {
          price,
          currency: product.currency || "EUR",
          source: "amazon-paapi",
          url,
        };
      }
    } catch (e) {
      console.warn(`PA API price failed for ${asin}:`, (e as Error).message);
    }
  }

  try {
    const scraped = await scrapeAmazonProduct(url);
    const price = scraped.price != null ? parsePriceToNumber(String(scraped.price)) : null;
    if (price != null) {
      return { price, currency: "EUR", source: "amazon-scraping", url };
    }
  } catch (e) {
    console.warn(`Scraping price failed for ${asin}:`, (e as Error).message);
  }

  return null;
}

/**
 * Update price history for a batch of reviews that have amazonAsin.
 * Creates PriceHistory when price is new or changed.
 */
export async function updatePriceHistoryForBatch(limit = BATCH_SIZE): Promise<{
  processed: number;
  updated: number;
  errors: Array<{ reviewId: string; asin: string; error: string }>;
}> {
  const reviews = await prisma.review.findMany({
    where: { amazonAsin: { not: null } },
    select: { id: true, title: true, amazonAsin: true },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  const result = { processed: 0, updated: 0, errors: [] as Array<{ reviewId: string; asin: string; error: string }> };

  for (const review of reviews) {
    const asin = review.amazonAsin!;
    result.processed++;

    try {
      const current = await fetchAmazonPrice(asin);
      if (!current || current.price == null) continue;

      const latest = await prisma.priceHistory.findFirst({
        where: { reviewId: review.id },
        orderBy: { recordedAt: "desc" },
        select: { price: true },
      });

      const priceChanged = latest == null || Math.abs(latest.price - current.price) > 0.001;
      if (!priceChanged) continue;

      await prisma.priceHistory.create({
        data: {
          reviewId: review.id,
          price: current.price,
          currency: current.currency,
          source: current.source,
          url: current.url,
        },
      });
      result.updated++;
    } catch (e) {
      result.errors.push({
        reviewId: review.id,
        asin,
        error: (e as Error).message,
      });
    }

    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_REQUESTS_MS));
  }

  return result;
}
