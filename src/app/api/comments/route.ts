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
    const { reviewId, text, author, parentId } = parsed.data;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Wenn parentId gesetzt: Existenz prüfen und Tiefe auf 2 Ebenen begrenzen
    // (eine Antwort darf nicht selbst eine Antwort sein).
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, parentId: true, reviewId: true },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent-Kommentar nicht gefunden." },
          { status: 400 },
        );
      }
      if (parent.parentId) {
        return NextResponse.json(
          { error: "Antworten auf Antworten sind nicht erlaubt (max. 2 Ebenen)." },
          { status: 400 },
        );
      }
      if (parent.reviewId !== reviewId) {
        return NextResponse.json(
          { error: "Parent-Kommentar gehört nicht zu diesem Review." },
          { status: 400 },
        );
      }
    }

    const comment = await prisma.comment.create({
      data: { reviewId, text, author: author ?? "Besucher", parentId },
      include: { parent: true },
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
