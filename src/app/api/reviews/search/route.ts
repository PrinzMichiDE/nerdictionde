import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { scoreRelevance } from "@/lib/search-relevance";

/**
 * GET /api/reviews/search
 * Advanced search: query, category, minScore, maxScore, tags, sort=relevance|date-desc|score-desc|date-asc, limit, page
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() ?? "";
    const category = searchParams.get("category");
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
    const sort = searchParams.get("sort") || "date-desc";
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: "published" };

    if (category) {
      (where as { category: string }).category = category;
    }

    if (minScore || maxScore) {
      (where as { score: { gte?: number; lte?: number } }).score = {};
      if (minScore) (where.score as { gte: number }).gte = parseInt(minScore, 10);
      if (maxScore) (where.score as { lte: number }).lte = parseInt(maxScore, 10);
    }

    if (tags.length > 0) {
      (where as { tags: { some: { tag: { slug: { in: string[] } } } } }).tags = {
        some: { tag: { slug: { in: tags } } },
      };
    }

    let baseWhere = where;

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

    // For relevance sort, we need to fetch more results to score them
    // For other sorts, we can use database-level ordering with pagination
    const isRelevanceSort = sort === "relevance" && query.length > 0;
    const fetchLimit = isRelevanceSort ? Math.min(limit * 5, 100) : limit;
    const fetchSkip = isRelevanceSort ? 0 : skip;

    let orderBy: { createdAt?: "desc" | "asc"; score?: "desc" | "asc" } = { createdAt: "desc" };
    if (!isRelevanceSort) {
      if (sort === "score-desc") orderBy = { score: "desc" };
      else if (sort === "score-asc") orderBy = { score: "asc" };
      else if (sort === "date-asc") orderBy = { createdAt: "asc" };
      // default: date-desc
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: baseWhere,
        orderBy: isRelevanceSort ? { createdAt: "desc" } : orderBy,
        skip: fetchSkip,
        take: fetchLimit,
        select: {
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
        },
      }),
      prisma.review.count({ where: baseWhere }),
    ]);

    // Apply relevance scoring if requested
    let scoredReviews = reviews;
    if (isRelevanceSort && query.length > 0) {
      scoredReviews = scoreRelevance(reviews, query).slice(skip, skip + limit);
    }

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      reviews: scoredReviews,
      pagination: {
        page,
        limit,
        total,
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