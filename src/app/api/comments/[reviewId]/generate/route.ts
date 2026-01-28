import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { generateComments } from "@/lib/comment-generation";

/**
 * POST /api/comments/[reviewId]/generate
 * Generates AI comments for a review. Admin auth required.
 * Query: ?count=5 (optional, 3–10)
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
    const count = countParam ? Math.min(10, Math.max(3, parseInt(countParam, 10) || 5)) : undefined;

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

    const comments = await prisma.$transaction(
      generated.map((c) =>
        prisma.comment.create({
          data: {
            reviewId,
            text: c.text,
            author: c.author,
          },
        })
      )
    );

    return NextResponse.json({ comments, count: comments.length });
  } catch (error) {
    console.error("POST /api/comments/[reviewId]/generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate comments" },
      { status: 500 }
    );
  }
}
