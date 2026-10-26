import prisma from "@/lib/prisma";

export interface PriceInfo {
  currentPrice: number | null;
  hasDeal: boolean;
  dealPrice: number | null;
  currency: string;
}

export interface ReviewWithPriceRelations {
  id: string;
  priceHistory: Array<{ price: number; currency: string; recordedAt: Date }>;
  deals: Array<{ price: number; currency: string; status: string; expiresAt: Date | null }>;
  hardware: { msrp: number | null } | null;
}

/**
 * Ermittelt Preis-Informationen für ein einzelnes Review (Client-seitig oder Server-seitig bei geringer Menge)
 */
export function getCurrentPrice(review: ReviewWithPriceRelations): PriceInfo {
  const prices: number[] = [];
  let currency = "EUR";
  let hasDeal = false;
  let dealPrice: number | null = null;

  // 1. Neuester PriceHistory-Eintrag
  if (review.priceHistory.length > 0) {
    const latest = review.priceHistory.reduce((a, b) =>
      a.recordedAt > b.recordedAt ? a : b
    );
    prices.push(latest.price);
    currency = latest.currency;
  }

  // 2. Aktiver Deal (günstigster)
  const activeDeals = review.deals.filter(
    (d) => d.status === "active" && d.expiresAt && d.expiresAt > new Date()
  );
  if (activeDeals.length > 0) {
    const bestDeal = activeDeals.reduce((a, b) => (a.price < b.price ? a : b));
    prices.push(bestDeal.price);
    hasDeal = true;
    dealPrice = bestDeal.price;
    currency = bestDeal.currency;
  }

  // 3. Hardware MSRP
  if (review.hardware?.msrp !== null && review.hardware?.msrp !== undefined) {
    prices.push(review.hardware.msrp);
  }

  const currentPrice = prices.length > 0 ? Math.min(...prices) : null;

  return {
    currentPrice,
    hasDeal,
    dealPrice,
    currency,
  };
}

/**
 * Batch-Abfrage für Preise mehrerer Reviews (Performance: ein Raw-Query statt N+1)
 */
export async function getReviewsWithPrices(
  reviewIds: string[]
): Promise<Map<string, PriceInfo>> {
  if (!reviewIds.length) return new Map();

  const placeholders = reviewIds.map((_, i) => `$${i + 1}`).join(", ");

  const query = `
    SELECT r.id,
           ph.price AS latest_price,
           ph.currency,
           d.price AS deal_price,
           h.msrp AS hardware_msrp
    FROM "Review" r
    LEFT JOIN LATERAL (
      SELECT price, currency
      FROM "PriceHistory"
      WHERE "reviewId" = r.id
      ORDER BY "recordedAt" DESC
      LIMIT 1
    ) ph ON true
    LEFT JOIN LATERAL (
      SELECT price, currency
      FROM "Deal"
      WHERE "reviewId" = r.id
        AND status = 'active'
        AND "expiresAt" > NOW()
      ORDER BY price ASC
      LIMIT 1
    ) d ON true
    LEFT JOIN "Hardware" h ON r."hardwareId" = h.id
    WHERE r.id IN (${placeholders})
  `;

  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      latest_price: number | null;
      currency: string | null;
      deal_price: number | null;
      hardware_msrp: number | null;
    }>
  >(query, ...reviewIds);

  const result = new Map<string, PriceInfo>();

  for (const row of rows) {
    const prices: number[] = [];
    let currency = row.currency ?? "EUR";
    let hasDeal = false;
    let dealPrice: number | null = null;

    if (row.latest_price !== null) {
      prices.push(row.latest_price);
    }
    if (row.deal_price !== null) {
      prices.push(row.deal_price);
      hasDeal = true;
      dealPrice = row.deal_price;
      currency = row.currency ?? currency;
    }
    if (row.hardware_msrp !== null) {
      prices.push(row.hardware_msrp);
    }

    const currentPrice = prices.length > 0 ? Math.min(...prices) : null;

    result.set(row.id, {
      currentPrice,
      hasDeal,
      dealPrice,
      currency,
    });
  }

  // Reviews ohne Preis-Daten auf null setzen
  for (const id of reviewIds) {
    if (!result.has(id)) {
      result.set(id, {
        currentPrice: null,
        hasDeal: false,
        dealPrice: null,
        currency: "EUR",
      });
    }
  }

  return result;
}

/**
 * Filtert Reviews nach Preis-Range (post-processing nach Relevanz-Sort)
 * Reviews ohne Preis werden ausgeschlossen, wenn Filter aktiv
 */
export function filterByPriceRange<T extends { priceInfo?: PriceInfo }>(
  reviews: T[],
  minPrice?: number,
  maxPrice?: number
): T[] {
  if (minPrice === undefined && maxPrice === undefined) return reviews;

  return reviews.filter((r) => {
    const price = r.priceInfo?.currentPrice;
    if (price === null || price === undefined) return false;
    if (minPrice !== undefined && price < minPrice) return false;
    if (maxPrice !== undefined && price > maxPrice) return false;
    return true;
  });
}