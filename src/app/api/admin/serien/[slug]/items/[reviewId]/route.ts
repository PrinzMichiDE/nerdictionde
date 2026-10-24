import { NextRequest, NextResponse } from "next/server";
import { removeSeriesItem } from "@/lib/review-series";
import { requireAdminAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * DELETE /api/admin/serien/[slug]/items/[reviewId]
 * Admin: Review aus Serie entfernen
 */

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ slug: string; reviewId: string }> }
) {
  const authError = requireAdminAuth(_request);
  if (authError) return authError;

  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { slug, reviewId } = await context.params;

    // Serie-ID aus Slug auflösen
    const series = await prisma.reviewSeries.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!series) {
      return NextResponse.json({ error: "Serie nicht gefunden" }, { status: 404 });
    }

    await removeSeriesItem(series.id, reviewId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN API] DELETE /api/admin/serien/[slug]/items/[reviewId] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
