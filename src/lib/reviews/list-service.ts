/**
 * reviews — List service
 *
 * Business logic for the review list endpoint. Orchestrates query building,
 * aggregation, fetching, and transformation. Returns a clean response shape.
 */

import prisma from "@/lib/prisma";

type ReviewRow = Awaited<ReturnType<typeof prisma.review.findMany>>[number];
import {
  buildWhereClause,
  buildOrderBy,
  computeAggregates,
  fetchBookmarkCounts,
  fetchTopPicks,
  type ReviewListParams,
  type CategoryCounts,
  type ScoreDistribution,
} from "./query-builder";

/**
 * Result of the list service.
 */
export interface ReviewListResult {
  reviews: Array<ReviewRow & { bookmarkCount: number }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  categoryCounts?: CategoryCounts;
  scoreDistribution?: ScoreDistribution;
  topPicks?: Array<{
    id: string;
    title: string;
    slug: string;
    score: number;
    category: string;
  }>;
}

/**
 * Get paginated list of reviews with aggregates.
 */
export async function getReviewList(
  params: ReviewListParams
): Promise<ReviewListResult> {
  const { page, limit, all, sort } = params;

  // 1. Build where clause
  const where = buildWhereClause(params);

  // 2. Should paginate?
  const shouldPaginate = !all;

  // 3. Total count
  const total = await prisma.review.count({ where });
  const totalPages = shouldPaginate ? Math.ceil(total / limit) : 1;

  // 4. Aggregates (only when paginating)
  let categoryCounts: CategoryCounts | undefined;
  let scoreDistribution: ScoreDistribution | undefined;
  if (shouldPaginate) {
    const { categoryCounts: cc, scoreDistribution: sd, countAll } =
      await computeAggregates(where);
    categoryCounts = cc;
    scoreDistribution = sd;
    // countAll is redundant with total but kept for API compatibility
  }

  // 5. Fetch reviews
  const reviews = await prisma.review.findMany({
    where,
    orderBy: buildOrderBy(sort),
    ...(shouldPaginate ? {
      skip: (page - 1) * limit,
      take: limit,
    } : {}),
  });

  // 6. Bookmark counts
  const bookmarkCountMap = await fetchBookmarkCounts(
    reviews.map((r) => r.id)
  );
  const reviewsWithBookmarks = reviews.map((r) => ({
    ...r,
    bookmarkCount: bookmarkCountMap.get(r.id) ?? 0,
  }));

  // 7. Editor's picks
  let topPicks:
    | Array<{
        id: string;
        title: string;
        slug: string;
        score: number;
        category: string;
      }>
    | undefined;
  if (shouldPaginate && reviewsWithBookmarks.length > 0) {
    topPicks = await fetchTopPicks(
      reviewsWithBookmarks.map((r) => r.id)
    );
  }

  return {
    reviews: reviewsWithBookmarks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    ...(categoryCounts ? { categoryCounts } : {}),
    ...(scoreDistribution ? { scoreDistribution } : {}),
    ...(topPicks ? { topPicks } : {}),
  };
}
