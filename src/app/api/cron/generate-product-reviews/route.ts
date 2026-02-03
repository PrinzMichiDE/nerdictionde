/**
 * Cron: Generate at least 10 product reviews per day using SearXNG for discovery.
 * Schedule: Daily at 4:00 UTC (0 4 * * *)
 * Requires SEARXNG_URL in .env.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { processAmazonProduct } from "@/lib/review-generation";
import {
  discoverProductsViaSearXNG,
  getProductDetailsViaSearXNG,
} from "@/lib/searxng";

const MIN_REVIEWS_PER_DAY = 10;
const MAX_ATTEMPTS = 25;
const DELAY_BETWEEN_PRODUCTS_MS = 4000;

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SEARXNG_URL) {
      return NextResponse.json(
        { error: "SEARXNG_URL is not set in .env" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const minReviews = Math.min(
      Math.max(parseInt(url.searchParams.get("minReviews") || String(MIN_REVIEWS_PER_DAY), 10), 1),
      30
    );

    const existing = await prisma.review.findMany({
      where: { category: { in: ["product", "amazon"] } },
      select: { amazonAsin: true, title: true },
    });
    const existingAsins = new Set(existing.map((r) => r.amazonAsin).filter(Boolean));
    const existingTitles = new Set(existing.map((r) => r.title.toLowerCase()));

    const candidates = await discoverProductsViaSearXNG(MAX_ATTEMPTS);

    const toProcess: Array<{ name: string; asin: string | null }> = [];
    for (const p of candidates) {
      if (toProcess.length >= MAX_ATTEMPTS) break;
      if (p.asin && existingAsins.has(p.asin)) continue;
      if (existingTitles.has(p.name.toLowerCase())) continue;
      toProcess.push(p);
    }

    const results = {
      created: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      reviews: [] as Array<{ id: string; title: string; slug: string }>,
    };

    for (let i = 0; i < toProcess.length; i++) {
      if (results.created >= minReviews) break;

      const candidate = toProcess[i];
      let name = candidate.name;
      let asin = candidate.asin;

      if (!asin) {
        try {
          const details = await getProductDetailsViaSearXNG(name);
          if (details?.asin) asin = details.asin;
          if (details?.name && details.name.length > 2) name = details.name;
        } catch {
          // Keep name/asin as-is
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      try {
        const result = await processAmazonProduct(
          { name, asin: asin ?? undefined },
          { status: "published", skipExisting: true, generateImages: true }
        );

        if (result.success && result.reviewId) {
          results.created++;
          const review = await prisma.review.findUnique({
            where: { id: result.reviewId },
            select: { id: true, title: true, slug: true },
          });
          if (review) results.reviews.push(review);
        } else if (result.error?.toLowerCase().includes("already exists")) {
          results.skipped++;
        } else {
          results.failed++;
          results.errors.push(`${name}: ${result.error ?? "Unknown"}`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`${name}: ${(err as Error).message}`);
      }

      if (i < toProcess.length - 1) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_PRODUCTS_MS));
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    return NextResponse.json({
      success: true,
      message: `Product reviews: ${results.created} created, ${results.failed} failed, ${results.skipped} skipped.`,
      minTarget: minReviews,
      ...results,
      duration: parseFloat(duration),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error("generate-product-reviews cron error:", err);
    return NextResponse.json(
      {
        success: false,
        error: (err as Error).message,
        duration: parseFloat(duration),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
