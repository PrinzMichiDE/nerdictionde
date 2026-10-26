import { NextRequest, NextResponse } from "next/server";
import { addSeriesItem } from "@/lib/review-series";
import { requireAdminAuth } from "@/lib/auth";
import { addSeriesItemSchema } from "@/lib/review-series-schema";
import prisma from "@/lib/prisma";

/**
 * POST /api/admin/serien/[slug]/items
 * Admin: Review zur Serie hinzufügen
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { slug } = await context.params;

    // Serie-ID aus Slug auflösen
    const series = await prisma.reviewSeries.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!series) {
      return NextResponse.json({ error: "Serie nicht gefunden" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = addSeriesItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await addSeriesItem(series.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[ADMIN API] POST /api/admin/serien/[slug]/items error:", error);

    if (error instanceof Error) {
      if (error.message === "Review gehört bereits zu einer Serie") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Review nicht gefunden") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
