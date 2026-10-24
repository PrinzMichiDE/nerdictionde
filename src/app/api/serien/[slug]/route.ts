import { NextRequest, NextResponse } from "next/server";
import { getSeriesBySlug } from "@/lib/review-series";

/**
 * GET /api/serien/[slug]
 * Öffentliche API für Serien-Detail mit allen Teilen
 * Feature-Flag: FEATURE_REVIEW_SERIES
 */

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  // Feature-Flag prüfen
  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ error: "Slug ist erforderlich" }, { status: 400 });
    }

    const series = await getSeriesBySlug(slug);

    if (!series) {
      return NextResponse.json({ error: "Serie nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(series, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[API] GET /api/serien/[slug] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
