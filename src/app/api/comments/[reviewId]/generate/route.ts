import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { generateComments } from "@/lib/comment-generation";

const MIN_COUNT = 200;
const MAX_COUNT = 300;

/**
 * POST /api/comments/[reviewId]/generate
 * Generates AI comments for a review. Admin auth required.
 * Query: ?count=250 (optional, 200–300, defaults to a random 200–300)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { reviewId } = await params;
    const { searchParams } = new URL(req.url);
    const countParam = searchParams.get("count");
    const count = countParam
      ? Math.min(MAX_COUNT, Math.max(MIN_COUNT, parseInt(countParam, 10) || MIN_COUNT))
      : undefined;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const pros = review.pros ?? [];
    const cons = review.cons ?? [];
    const generated = await generateComments({
      reviewTitle: review.title,
      score: review.score,
      pros,
      cons,
      category: review.category,
      count,
    });

    const created = await prisma.comment.createMany({
      data: generated.map((c) => ({
        reviewId,
        text: c.text,
        author: c.author,
      })),
    });

    return NextResponse.json({ count: created.count });
  } catch (error) {
    console.error("POST /api/comments/[reviewId]/generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate comments" },
      { status: 500 }
    );
  }
}
