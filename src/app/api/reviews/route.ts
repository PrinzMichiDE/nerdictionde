import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth, requireAdminAuth } from "@/lib/auth";
import { getReviewList } from "@/lib/reviews/list-service";
import { createReviewService } from "@/lib/reviews/create-service";
import type { ReviewListParams } from "@/lib/reviews/query-builder";

/**
 * GET /api/reviews — Paginated review list with aggregates.
 * Supports filtering by category, status, score, date, and search query.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const params: ReviewListParams = {
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      query: searchParams.get("query") || undefined,
      sort: searchParams.get("sort") || "date-desc",
      minScore: searchParams.get("minScore")
        ? parseInt(searchParams.get("minScore")!, 10)
        : undefined,
      maxScore: searchParams.get("maxScore")
        ? parseInt(searchParams.get("maxScore")!, 10)
        : undefined,
      dateFilter: searchParams.get("dateFilter") || "all",
      page: Math.max(1, parseInt(searchParams.get("page") || "1", 10)),
      limit: Math.min(
        100,
        Math.max(1, parseInt(searchParams.get("limit") || "12", 10))
      ),
      all: searchParams.get("all") === "true",
      isAdmin: Boolean(checkAdminAuth(req)),
    };

    const result = await getReviewList(params);

    if (params.all) {
      return NextResponse.json(result.reviews);
    }

    return NextResponse.json({
      reviews: result.reviews,
      pagination: result.pagination,
      ...(result.categoryCounts ? { categoryCounts: result.categoryCounts } : {}),
      ...(result.scoreDistribution ? { scoreDistribution: result.scoreDistribution } : {}),
      ...(result.topPicks ? { topPicks: result.topPicks } : {}),
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/reviews — Create a new review (admin only).
 */
export async function POST(req: NextRequest) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const result = await createReviewService(await req.json());

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
  }

  return NextResponse.json(result.review);
}
