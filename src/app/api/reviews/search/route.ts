import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scoreRelevance } from "@/lib/search-relevance";
import { searchParamsSchema } from "@/lib/search-filter-schema";
import { parseSearchParams, buildSearchWhereClause, buildPlatformWhereClause, normalizePlatform } from "@/lib/search-filters";
import { getReviewsWithPrices, filterByPriceRange } from "@/lib/price-utils";

/**
 * GET /api/reviews/search
 * Advanced search: query, category, minScore, maxScore, tags, sort, limit, page
 * NEU: releaseDateFrom, releaseDateTo, minPrice, maxPrice, platforms, hasVideo, hasDeal, developer, publisher
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Feature-Flag Check
    const advancedEnabled = process.env.FEATURE_ADVANCED_SEARCH_FILTERS === "true";

    // Validierung aller Parameter via Zod
    const rawParams = Object.fromEntries(searchParams);
    const parsed = searchParamsSchema.safeParse(rawParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Suchparameter", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Validierte & transformierte Daten aus Zod verwenden
    const data = parsed.data;
    const {
      query: rawQuery,
      category,
      minScore,
      maxScore,
      tags,
      sort,
      limit = 12,
      page = 1,
      // NEU
      releaseDateFrom,
      releaseDateTo,
      minPrice,
      maxPrice,
      platforms,
      hasVideo,
      hasDeal,
      developer,
      publisher,
    } = data;

    const query = rawQuery ?? "";

    const skip = (page - 1) * limit;

    // Basis Where-Clause aufbauen (bestehende + neue Filter außer Preis/Plattform)
    let baseWhere = buildSearchWhereClause({
      query: "", // Query separat für Relevanz-Sort
      category,
      minScore,
      maxScore,
      tags,
      sort,
      releaseDateFrom,
      releaseDateTo,
      hasVideo,
      hasDeal,
      developer,
      publisher,
    });

    // Plattform-Filter hinzufügen (falls aktiviert und Parameter vorhanden)
    if (advancedEnabled && platforms && platforms.length > 0) {
      // Normalisiere Plattformen zu kanonischen Werten
      const normalizedPlatforms = platforms
        .map(normalizePlatform)
        .filter((p): p is string => p !== null);
      if (normalizedPlatforms.length > 0) {
        const platformWhere = buildPlatformWhereClause(normalizedPlatforms);
        baseWhere = { ...baseWhere, ...platformWhere };
      }
    }

    // Query für Volltext-Suche hinzufügen
    if (query) {
      const term = query;
      const searchOr = [
        { title: { contains: term, mode: "insensitive" as const } },
        { title_en: { contains: term, mode: "insensitive" as const } },
        { content: { contains: term, mode: "insensitive" as const } },
        { content_en: { contains: term, mode: "insensitive" as const } },
      ];
      baseWhere = { ...baseWhere, OR: searchOr };
    }

    // Relevanz-Sort Logik
    const isRelevanceSort = sort === "relevance" && query.length > 0;
    const fetchLimit = isRelevanceSort ? Math.min(limit * 5, 100) : limit;
    const fetchSkip = isRelevanceSort ? 0 : skip;

    let orderBy: { createdAt?: "desc" | "asc"; score?: "desc" | "asc" } = { createdAt: "desc" };
    if (!isRelevanceSort) {
      if (sort === "score-desc") orderBy = { score: "desc" };
      else if (sort === "score-asc") orderBy = { score: "asc" };
      else if (sort === "date-asc") orderBy = { createdAt: "asc" };
    }

    // Reviews laden - Select bedingt zusammenbauen für TypeScript
    const selectBase = {
      id: true,
      title: true,
      title_en: true,
      slug: true,
      category: true,
      score: true,
      content: true,
      content_en: true,
      images: true,
      createdAt: true,
      updatedAt: true,
      tags: { select: { tag: { select: { name: true, slug: true } } } },
    } as const;

    const selectWithPrice = {
      ...selectBase,
      priceHistory: {
        select: { price: true, currency: true, recordedAt: true },
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
      deals: {
        where: { status: "active", expiresAt: { gt: new Date() } },
        select: { price: true, currency: true },
        orderBy: { price: "asc" },
        take: 1,
      },
      hardware: { select: { msrp: true } },
    } as const;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: baseWhere,
        orderBy: isRelevanceSort ? { createdAt: "desc" } : orderBy,
        skip: fetchSkip,
        take: fetchLimit,
        select: advancedEnabled && (minPrice !== undefined || maxPrice !== undefined)
          ? selectWithPrice
          : selectBase,
      }),
      prisma.review.count({ where: baseWhere }),
    ]);

    // Relevanz-Scoring anwenden (falls gewünscht)
    let scoredReviews = reviews;
    if (isRelevanceSort && (query?.length ?? 0) > 0) {
      scoredReviews = scoreRelevance(reviews, query ?? "");
    }

    // NEU: Preis-Filter (post-processing, da Join auf PriceHistory/Deal/Hardware nötig)
    let filteredReviews = scoredReviews;
    let filteredTotal = total;

    if (advancedEnabled && (minPrice !== undefined || maxPrice !== undefined)) {
      const reviewIds = scoredReviews.map((r) => r.id);
      const priceMap = await getReviewsWithPrices(reviewIds);

      // Reviews mit Preis-Info anreichern (für Filter)
      const reviewsWithPrice = scoredReviews.map((r) => ({
        ...r,
        priceInfo: priceMap.get(r.id),
      }));

      // Nach Preis filtern - behalte Original-Review-Objekte
      const priceFiltered = filterByPriceRange(reviewsWithPrice, minPrice, maxPrice);

      // Pagination anwenden (nach Preis-Filter)
      filteredReviews = priceFiltered.slice(skip, skip + limit);
      filteredTotal = priceFiltered.length;
    } else {
      // Standard-Pagination für non-relevance oder ohne Preis-Filter
      if (!isRelevanceSort) {
        filteredReviews = scoredReviews.slice(0, limit); // bereits gepaginated via DB
      } else {
        filteredReviews = scoredReviews.slice(skip, skip + limit);
      }
    }

    const totalPages = Math.ceil(filteredTotal / limit);

    return NextResponse.json({
      reviews: filteredReviews,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("GET /api/reviews/search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}