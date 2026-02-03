/**
 * Match deals to reviews by ASIN, product name, or fuzzy title similarity.
 */

import prisma from "@/lib/prisma";

const MIN_WORD_MATCH = 2;
const ASIN_REGEX = /\b[B0-9][A-Z0-9]{9}\b/g;

export interface DealLike {
  title: string;
  url?: string;
  asin?: string | null;
}

/**
 * Extract ASINs from deal title or URL (e.g. amazon.de/dp/B08H...).
 */
export function extractAsinsFromDeal(deal: DealLike): string[] {
  const asins: string[] = [];
  if (deal.asin) {
    asins.push(deal.asin.toUpperCase());
  }
  const fromTitle = (deal.title || "").match(ASIN_REGEX);
  if (fromTitle) {
    asins.push(...fromTitle.map((a) => a.toUpperCase()));
  }
  if (deal.url) {
    const fromUrl = deal.url.match(ASIN_REGEX);
    if (fromUrl) {
      asins.push(...fromUrl.map((a) => a.toUpperCase()));
    }
  }
  return [...new Set(asins)];
}

/**
 * Normalize for fuzzy match: lowercase, strip non-word, collapse spaces.
 */
function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\säöüß]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score how well deal title matches review title (word overlap).
 */
function titleMatchScore(dealTitle: string, reviewTitle: string): number {
  const dealWords = normalizeForMatch(dealTitle)
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const reviewNorm = normalizeForMatch(reviewTitle);
  if (dealWords.length === 0) return 0;
  let score = 0;
  for (const w of dealWords) {
    if (reviewNorm.includes(w)) score += 1;
  }
  return score;
}

/**
 * Match a single deal to a review: by ASIN first, then by title similarity.
 */
export async function matchDealToReview(deal: DealLike): Promise<string | null> {
  const asins = extractAsinsFromDeal(deal);
  if (asins.length > 0) {
    const byAsin = await prisma.review.findFirst({
      where: {
        status: "published",
        amazonAsin: { in: asins },
      },
      select: { id: true },
    });
    if (byAsin) return byAsin.id;
  }

  const words = normalizeForMatch(deal.title)
    .split(/\s+/)
    .filter((w) => w.length > 2);
  if (words.length < 2) return null;

  const reviews = await prisma.review.findMany({
    where: {
      status: "published",
      category: { in: ["hardware", "game", "product", "amazon"] },
    },
    select: { id: true, title: true },
    take: 500,
  });

  let bestId: string | null = null;
  let bestScore = 0;
  for (const review of reviews) {
    const score = titleMatchScore(deal.title, review.title);
    if (score >= MIN_WORD_MATCH && score > bestScore) {
      bestScore = score;
      bestId = review.id;
    }
  }
  return bestId;
}

/**
 * Match multiple deals to reviews; returns map dealIndex -> reviewId.
 */
export async function matchDealsToReviews(
  deals: DealLike[]
): Promise<Map<number, string>> {
  const result = new Map<number, string>();
  for (let i = 0; i < deals.length; i++) {
    const reviewId = await matchDealToReview(deals[i]);
    if (reviewId) result.set(i, reviewId);
  }
  return result;
}

/**
 * Backfill reviewId for existing Deal rows that don't have one.
 */
export async function backfillDealReviewLinks(limit = 100): Promise<{ updated: number }> {
  const deals = await prisma.deal.findMany({
    where: { reviewId: null, status: "active" },
    select: { id: true, title: true, url: true, asin: true },
    take: limit,
  });

  let updated = 0;
  for (const deal of deals) {
    const reviewId = await matchDealToReview(deal);
    if (reviewId) {
      await prisma.deal.update({
        where: { id: deal.id },
        data: { reviewId },
      });
      updated++;
    }
  }
  return { updated };
}
