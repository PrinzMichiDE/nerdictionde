import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/reviews/search
 * Advanced search: query, category, minScore, maxScore, tags, sort=relevance|date-desc|score-desc, limit
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

    const where: Record<string, unknown> = { status: "published" };

    if (category) {
      if (category === "product") {
        (where as { category: { in: string[] } }).category = { in: ["product", "amazon"] };
      } else {
        (where as { category: string }).category = category;
      }
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

    if (query) {
      const term = query;
      const searchOr = [
        { title: { contains: term, mode: "insensitive" as const } },
        { title_en: { contains: term, mode: "insensitive" as const } },
        { content: { contains: term, mode: "insensitive" as const } },
        { content_en: { contains: term, mode: "insensitive" as const } },
      ];
      (where as { OR: typeof searchOr }).OR = searchOr;
    }

    let orderBy: { createdAt?: "desc" | "asc"; score?: "desc" | "asc" } = { createdAt: "desc" };
    if (sort === "score-desc") orderBy = { score: "desc" };
    if (sort === "score-asc") orderBy = { score: "asc" };
    if (sort === "date-asc") orderBy = { createdAt: "asc" };

    const reviews = await prisma.review.findMany({
      where,
      orderBy,
      take: limit,
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
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("GET /api/reviews/search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
