/**
 * reviews — Query builder
 *
 * Builds Prisma where-clauses, aggregations and pagination for the review
 * list endpoint. Pure, testable functions with strict typing.
 */

import type { Prisma, Review } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Parsed and validated query parameters for the review list.
 */
export interface ReviewListParams {
  category?: string;
  status?: string;
  query?: string;
  sort: string;
  minScore?: number;
  maxScore?: number;
  dateFilter: string;
  page: number;
  limit: number;
  all: boolean;
  isAdmin: boolean;
}

/**
 * Builds the Prisma where-clause from query parameters.
 */
export function buildWhereClause(
  params: ReviewListParams
): Prisma.ReviewWhereInput {
  const {
    category,
    status,
    query,
    minScore,
    maxScore,
    dateFilter,
    isAdmin,
    all,
  } = params;

  // Base: non-admins only see published reviews
  const canSeeAll = isAdmin && (all || status === "all");
  const baseWhere: Prisma.ReviewWhereInput = canSeeAll
    ? {}
    : isAdmin && status
      ? { status }
      : { status: "published" };

  const where: Prisma.ReviewWhereInput = { ...baseWhere };

  // Score filter
  if (minScore !== undefined || maxScore !== undefined) {
    where.score = {
      ...(minScore !== undefined ? { gte: minScore } : {}),
      ...(maxScore !== undefined ? { lte: maxScore } : {}),
    };
  }

  // Date filter
  if (dateFilter !== "all") {
    const now = new Date();
    let startDate: Date;

    switch (dateFilter) {
      case "7d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 90);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0);
    }

    where.createdAt = { gte: startDate };
  }

  // Category filter
  if (category) {
    where.category = category;
  }

  // Search query
  if (query && query.trim()) {
    const searchTerm = query.trim();
    const searchOR: Prisma.ReviewWhereInput[] = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { title_en: { contains: searchTerm, mode: "insensitive" } },
      { content: { contains: searchTerm, mode: "insensitive" } },
      { content_en: { contains: searchTerm, mode: "insensitive" } },
    ];

    if (where.AND) {
      (where.AND as Prisma.ReviewWhereInput[]).push({ OR: searchOR });
    } else if (where.OR) {
      const existingWhere = { ...where };
      delete existingWhere.OR;
      where.AND = [existingWhere, { OR: searchOR }];
    } else {
      where.OR = searchOR;
    }
  }

  return where;
}

/**
 * Builds the orderBy clause from the sort parameter.
 */
export function buildOrderBy(sort: string): Prisma.ReviewOrderByWithRelationInput {
  switch (sort) {
    case "date-asc":
      return { createdAt: "asc" };
    case "score-desc":
      return { score: "desc" };
    case "score-asc":
      return { score: "asc" };
    case "title-asc":
      return { title: "asc" };
    case "title-desc":
      return { title: "desc" };
    case "date-desc":
    default:
      return { createdAt: "desc" };
  }
}

/**
 * Aggregation result for category counts.
 */
export interface CategoryCounts {
  all: number;
  game: number;
  movie: number;
  series: number;
  hardware: number;
}

/**
 * Aggregation result for score distribution (10 buckets of 10 points each).
 */
export type ScoreDistribution = number[];

/**
 * Computes category counts and score distribution in parallel.
 * Category counts ignore the category filter itself; score distribution
 * always spans all published reviews.
 */
export async function computeAggregates(
  where: Prisma.ReviewWhereInput
): Promise<{
  categoryCounts: CategoryCounts;
  scoreDistribution: ScoreDistribution;
  countAll: number;
}> {
  const countWhere = { ...where };
  delete (countWhere as Prisma.ReviewWhereInput).category;

  const [countGroups, scoreGroups, countAll] = await Promise.all([
    prisma.review.groupBy({
      by: ["category"],
      where: countWhere,
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["score"],
      where: { status: "published" },
      _count: { _all: true },
    }),
    prisma.review.count({ where: countWhere }),
  ]);

  const categoryCounts: CategoryCounts = {
    all: countAll,
    game: 0,
    movie: 0,
    series: 0,
    hardware: 0,
  };
  for (const group of countGroups) {
    categoryCounts[group.category as keyof CategoryCounts] =
      group._count._all;
  }

  const scoreDistribution: ScoreDistribution = Array.from(
    { length: 10 },
    () => 0
  );
  for (const group of scoreGroups) {
    const bucket = Math.min(9, Math.max(0, Math.floor((group.score || 0) / 10)));
    scoreDistribution[bucket] += group._count._all;
  }

  return { categoryCounts, scoreDistribution, countAll };
}

/**
 * Fetches bookmark counts for a list of review IDs.
 */
export async function fetchBookmarkCounts(
  reviewIds: string[]
): Promise<Map<string, number>> {
  if (reviewIds.length === 0) return new Map();

  const bookmarkCounts = await prisma.bookmark.groupBy({
    by: ["reviewId"],
    where: { reviewId: { in: reviewIds } },
    _count: { _all: true },
  });

  return new Map(
    bookmarkCounts.map((b) => [b.reviewId, b._count._all])
  );
}

/**
 * Fetches editor's picks: top-scored published reviews not already visible.
 */
export async function fetchTopPicks(
  excludeIds: string[]
): Promise<Array<{
  id: string;
  title: string;
  slug: string;
  score: number;
  category: string;
}>> {
  return prisma.review.findMany({
    where: {
      status: "published",
      id: { notIn: excludeIds },
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      score: true,
      category: true,
    },
  });
}
