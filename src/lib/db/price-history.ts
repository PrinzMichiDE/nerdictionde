import prisma from "@/lib/prisma";

/**
 * Add price entry to history
 */
export async function addPriceHistory(
  reviewId: string,
  price: number,
  options: {
    currency?: string;
    source?: string;
    availability?: string;
    url?: string;
  } = {}
) {
  return prisma.priceHistory.create({
    data: {
      reviewId,
      price,
      currency: options.currency || "EUR",
      source: options.source || "amazon",
      availability: options.availability,
      url: options.url,
    },
  });
}

/**
 * Get latest price for a review
 */
export async function getLatestPrice(reviewId: string) {
  return prisma.priceHistory.findFirst({
    where: { reviewId },
    orderBy: { recordedAt: "desc" },
  });
}

/**
 * Get price history for a review
 */
export async function getPriceHistory(
  reviewId: string,
  limit: number = 30
) {
  return prisma.priceHistory.findMany({
    where: { reviewId },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });
}

/**
 * Get price statistics
 */
export async function getPriceStats(reviewId: string) {
  const history = await prisma.priceHistory.findMany({
    where: { reviewId },
    orderBy: { recordedAt: "asc" },
  });

  if (history.length === 0) return null;

  const prices = history.map((h) => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const latest = history[history.length - 1];

  // Calculate price change
  const firstPrice = history[0].price;
  const priceChange = latest.price - firstPrice;
  const priceChangePercent = (priceChange / firstPrice) * 100;

  return {
    current: latest.price,
    min,
    max,
    average: avg,
    change: priceChange,
    changePercent: priceChangePercent,
    history,
  };
}
