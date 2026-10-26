import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import {
  CreateSeriesInput,
  UpdateSeriesInput,
  ReorderSeriesInput,
  AddSeriesItemInput,
  SeriesListQuery,
  PublicSeries,
  PublicSeriesWithParts,
  PublicSeriesPart,
  SeriesListResponse,
} from "@/lib/review-series-schema";

/**
 * Core Logic für Review-Serien
 * Server-seitig, nutzt Prisma & unstable_cache
 * Patterns analog zu lib/collections.ts, lib/review-reactions.ts
 */

// ============================================
// Cache Tags
// ============================================

export const SERIES_CACHE_TAGS = {
  list: "series:list",
  listTyped: (type?: string, visibility?: string, ownerId?: string) =>
    `series:list:${type || "all"}:${visibility || "all"}:${ownerId || "all"}`,
  detail: (slug: string) => `series:${slug}`,
  review: (reviewId: string) => `review:${reviewId}`,
} as const;

// Helper für revalidateTag mit korrekter Signatur
function rt(tag: string) {
  revalidateTag(tag, "");
}

// ============================================
// Slug Generator
// ============================================

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.reviewSeries.findUnique({ where: { slug } })) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

// ============================================
// Aggregate Score Berechnung
// ============================================

export function computeAggregateScore(parts: { score: number }[]): number | null {
  if (parts.length === 0) return null;
  const sum = parts.reduce((acc, p) => acc + p.score, 0);
  return Math.round(sum / parts.length);
}

// ============================================
// Order Validierung
// ============================================

export function validateOrder(
  items: { reviewId: string; seriesOrder: number }[],
  _existingCount: number
): { valid: boolean; error?: string } {
  if (items.length === 0) return { valid: true };

  const orders = items.map((i) => i.seriesOrder).sort((a, b) => a - b);
  const expected = Array.from({ length: items.length }, (_, i) => i + 1);

  if (JSON.stringify(orders) !== JSON.stringify(expected)) {
    return { valid: false, error: "Reihenfolge muss lückenlos 1..N sein" };
  }

  const reviewIds = items.map((i) => i.reviewId);
  const uniqueReviewIds = new Set(reviewIds);
  if (uniqueReviewIds.size !== reviewIds.length) {
    return { valid: false, error: "Doppelte Review-IDs in Reorder" };
  }

  return { valid: true };
}

// ============================================
// Public Read Operations (Cached)
// ============================================

export const getSeriesList = unstable_cache(
  async (query: SeriesListQuery): Promise<SeriesListResponse> => {
    const { cursor, limit, q, sort, order, type, visibility, ownerId } = query;

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    // NEW: Filter by series type (ADMIN vs USER)
    if (type) {
      where.type = type;
    }

    // NEW: Filter by visibility
    // For non-authenticated public API, only show PUBLIC series
    // PRIVATE series are only visible via authenticated user API
    if (visibility) {
      where.visibility = visibility;
    } else {
      // Default: only PUBLIC series for public API
      where.visibility = "PUBLIC";
    }

    // NEW: Filter by owner
    if (ownerId) {
      where.ownerId = ownerId;
    }

    const orderBy: Record<string, "asc" | "desc"> = { [sort]: order };

    const series = await prisma.reviewSeries.findMany({
      where,
      orderBy,
      take: limit + 1,
      cursor: cursor ? { slug: cursor } : undefined,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        coverImage: true,
        partCount: true,
        aggregateScore: true,
        followersCount: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        type: true,
        visibility: true,
      },
    });

    let nextCursor: string | null = null;
    if (series.length > limit) {
      const next = series.pop()!;
      nextCursor = next.slug;
    }

    return { series: series as PublicSeries[], nextCursor };
  },
  ["series-list"],
  { tags: [SERIES_CACHE_TAGS.list], revalidate: 60 }
);

// Cache key function for typed list queries
function getListCacheKey(query: SeriesListQuery): string[] {
  return [SERIES_CACHE_TAGS.listTyped(query.type || "all", query.visibility || "all", query.ownerId || "all")];
}

export const getSeriesBySlug = unstable_cache(
  async (slug: string): Promise<PublicSeriesWithParts | null> => {
    const series = await prisma.reviewSeries.findUnique({
      where: { slug, deletedAt: null },
      include: {
        items: {
          orderBy: { seriesOrder: "asc" },
          include: {
            review: {
              select: {
                id: true,
                slug: true,
                title: true,
                title_en: true,
                category: true,
                score: true,
                images: true,
                releaseDate: true,
                content: true,
                seriesOrder: true,
              },
            },
          },
        },
        owner: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    if (!series) return null;

    // Visibility check: PRIVATE series are not accessible via public API
    // They can only be accessed via authenticated user API (user/serien/[slug])
    if (series.visibility === "PRIVATE") {
      return null;
    }

    const parts: PublicSeriesPart[] = series.items.map((item) => ({
      id: item.review.id,
      slug: item.review.slug,
      title: item.review.title,
      title_en: item.review.title_en,
      category: item.review.category,
      score: item.review.score,
      coverImage: item.review.images[0] || null,
      releaseDate: item.review.releaseDate,
      excerpt: item.review.content ? item.review.content.slice(0, 200) : null,
      seriesOrder: item.seriesOrder,
    }));

    return {
      id: series.id,
      slug: series.slug,
      title: series.title,
      description: series.description,
      coverImage: series.coverImage,
      partCount: series.partCount,
      aggregateScore: series.aggregateScore,
      followersCount: series.followersCount,
      createdAt: series.createdAt,
      updatedAt: series.updatedAt,
      ownerId: series.ownerId,
      ownerUsername: series.owner?.username ?? null,
      type: series.type,
      visibility: series.visibility,
      parts,
    };
  },
  ["series-detail"],
  { tags: ["series:detail"], revalidate: 60 }
);

// ============================================
// Admin Write Operations
// ============================================

export async function createSeries(input: CreateSeriesInput) {
  const baseSlug = slugify(input.title);
  const slug = await generateUniqueSlug(baseSlug);

  const series = await prisma.reviewSeries.create({
    data: {
      slug,
      title: input.title,
      description: input.description || null,
      coverImage: input.coverImage || null,
    },
  });

  rt(SERIES_CACHE_TAGS.list);
  return series;
}

export async function getSeriesForAdmin(slug: string) {
  return prisma.reviewSeries.findUnique({
    where: { slug },
    include: {
      items: {
        orderBy: { seriesOrder: "asc" },
        include: {
          review: { select: { id: true, slug: true, title: true, score: true, images: true } },
        },
      },
    },
  });
}

export async function updateSeries(slug: string, input: UpdateSeriesInput) {
  const data: Record<string, unknown> = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.coverImage !== undefined) data.coverImage = input.coverImage || null;

  const series = await prisma.reviewSeries.update({
    where: { slug },
    data,
  });

  rt(SERIES_CACHE_TAGS.detail(slug));
  rt(SERIES_CACHE_TAGS.list);
  return series;
}

export async function deleteSeries(slug: string) {
  const result = await prisma.reviewSeries.update({
    where: { slug },
    data: { deletedAt: new Date() },
  });

  rt(SERIES_CACHE_TAGS.detail(slug));
  rt(SERIES_CACHE_TAGS.list);
  return result;
}

export async function reorderSeries(slug: string, input: ReorderSeriesInput) {
  const series = await prisma.reviewSeries.findUnique({
    where: { slug },
    select: { version: true, id: true },
  });

  if (!series) throw new Error("Serie nicht gefunden");

  if (series.version !== input.version) {
    throw new Error("VERSION_CONFLICT: Serie wurde zwischenzeitlich geändert");
  }

  const validation = validateOrder(input.items, 0);
  if (!validation.valid) throw new Error(validation.error);

  // Prüfen: Alle Review-IDs gehören zu dieser Serie
  const reviewIds = input.items.map((i) => i.reviewId);
  const existingItems = await prisma.reviewSeriesItem.findMany({
    where: { seriesId: series.id, reviewId: { in: reviewIds } },
    select: { reviewId: true },
  });

  if (existingItems.length !== reviewIds.length) {
    throw new Error("Nicht alle Reviews gehören zu dieser Serie");
  }

  await prisma.$transaction(async (tx) => {
    // ReviewSeriesItem seriesOrder aktualisieren
    for (const item of input.items) {
      await tx.reviewSeriesItem.update({
        where: { reviewId: item.reviewId },
        data: { seriesOrder: item.seriesOrder },
      });

      // Denormalisiert auf Review
      await tx.review.update({
        where: { id: item.reviewId },
        data: { seriesOrder: item.seriesOrder },
      });
    }

    // Version inkrementieren
    await tx.reviewSeries.update({
      where: { id: series.id },
      data: { version: { increment: 1 } },
    });
  });

  // Cache invalidieren
  rt(SERIES_CACHE_TAGS.detail(slug));
  rt(SERIES_CACHE_TAGS.list);
  for (const item of input.items) {
    rt(SERIES_CACHE_TAGS.review(item.reviewId));
  }

  return { version: series.version + 1 };
}

export async function addSeriesItem(seriesId: string, input: AddSeriesItemInput) {
  // Nächste Order-Position ermitteln
  const lastItem = await prisma.reviewSeriesItem.findFirst({
    where: { seriesId },
    orderBy: { seriesOrder: "desc" },
    select: { seriesOrder: true },
  });

  const nextOrder = (lastItem?.seriesOrder || 0) + 1;

  // Prüfen: Review nicht schon in einer Serie
  const existing = await prisma.reviewSeriesItem.findUnique({
    where: { reviewId: input.reviewId },
  });

  if (existing) throw new Error("Review gehört bereits zu einer Serie");

  // Prüfen: Review existiert
  const review = await prisma.review.findUnique({
    where: { id: input.reviewId },
    select: { id: true },
  });

  if (!review) throw new Error("Review nicht gefunden");

  const series = await prisma.reviewSeries.findUnique({
    where: { id: seriesId },
    select: { slug: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.reviewSeriesItem.create({
      data: {
        seriesId,
        reviewId: input.reviewId,
        seriesOrder: nextOrder,
      },
    });

    await tx.review.update({
      where: { id: input.reviewId },
      data: { seriesId, seriesOrder: nextOrder },
    });

    // partCount & aggregateScore aktualisieren
    const allItems = await tx.reviewSeriesItem.findMany({
      where: { seriesId },
      include: { review: { select: { score: true } } },
    });

    const aggregateScore = computeAggregateScore(allItems.map((i) => i.review));

    await tx.reviewSeries.update({
      where: { id: seriesId },
      data: {
        partCount: allItems.length,
        aggregateScore,
        version: { increment: 1 },
      },
    });
  });

  // Cache invalidieren
  if (series) {
    rt(SERIES_CACHE_TAGS.detail(series.slug));
    rt(SERIES_CACHE_TAGS.list);
  }
  rt(SERIES_CACHE_TAGS.review(input.reviewId));

  return { success: true };
}

export async function removeSeriesItem(seriesId: string, reviewId: string) {
  const series = await prisma.reviewSeries.findUnique({
    where: { id: seriesId },
    select: { slug: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.reviewSeriesItem.delete({
      where: { reviewId },
    });

    await tx.review.update({
      where: { id: reviewId },
      data: { seriesId: null, seriesOrder: null },
    });

    // partCount & aggregateScore neu berechnen
    const remainingItems = await tx.reviewSeriesItem.findMany({
      where: { seriesId },
      include: { review: { select: { score: true } } },
    });

    const aggregateScore = computeAggregateScore(remainingItems.map((i) => i.review));

    await tx.reviewSeries.update({
      where: { id: seriesId },
      data: {
        partCount: remainingItems.length,
        aggregateScore,
        version: { increment: 1 },
      },
    });
  });

  // Cache invalidieren
  if (series) {
    rt(SERIES_CACHE_TAGS.detail(series.slug));
    rt(SERIES_CACHE_TAGS.list);
  }
  rt(SERIES_CACHE_TAGS.review(reviewId));

  return { success: true };
}

// ============================================
// Helper für Review-Detail: Serie-Info laden
// ============================================

export interface ReviewSeriesInfo {
  seriesId: string;
  seriesSlug: string;
  seriesTitle: string;
  seriesOrder: number;
  partCount: number;
  parts: { slug: string; title: string; seriesOrder: number }[];
}

export const getReviewSeriesInfo = unstable_cache(
  async (reviewId: string): Promise<ReviewSeriesInfo | null> => {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { seriesId: true, seriesOrder: true },
    });

    if (!review?.seriesId || !review.seriesOrder) return null;

    const series = await prisma.reviewSeries.findUnique({
      where: { id: review.seriesId, deletedAt: null },
      include: {
        items: {
          orderBy: { seriesOrder: "asc" },
          select: { review: { select: { slug: true, title: true } }, seriesOrder: true },
        },
      },
    });

    if (!series) return null;

    return {
      seriesId: series.id,
      seriesSlug: series.slug,
      seriesTitle: series.title,
      seriesOrder: review.seriesOrder,
      partCount: series.partCount,
      parts: series.items.map((item) => ({
        slug: item.review.slug,
        title: item.review.title,
        seriesOrder: item.seriesOrder,
      })),
    };
  },
  ["review-series-info"],
  { tags: ["review:series-info"], revalidate: 30 }
);