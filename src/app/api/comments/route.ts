import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createCommentSchema, getCommentsQuerySchema } from "@/lib/comment-schema";

/**
 * GET /api/comments?reviewId=xxx
 * Returns comments for a review, ordered by createdAt desc.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = getCommentsQuerySchema.safeParse({ reviewId: searchParams.get("reviewId") ?? "" });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "reviewId is required", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { reviewId } = parsed.data;

    const comments = await prisma.comment.findMany({
      where: { reviewId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * Body: { reviewId, text, author? }
 * Creates a new comment (e.g. user-submitted). No admin auth required for public commenting.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { reviewId, text, author } = parsed.data;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: { reviewId, text, author: author ?? "Besucher" },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create comment" },
      { status: 500 }
    );
  }
}
