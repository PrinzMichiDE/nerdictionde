import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { enrichReviewById } from "@/lib/review-enrichment";

/**
 * POST /api/reviews/[id]/enrich
 * Enriches a review with SEO metadata, tags, and AI-generated comments.
 * Used after QuickCreate save so the review gets the same pipeline as cron-created reviews.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Review ID required" }, { status: 400 });
  }

  try {
    const result = await enrichReviewById(id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Enrichment failed" },
        { status: result.error === "Review not found" ? 404 : 500 }
      );
    }
    return NextResponse.json({
      success: true,
      reviewId: id,
      seo: result.seo,
      tags: result.tags,
      comments: result.comments,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Enrich endpoint error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
