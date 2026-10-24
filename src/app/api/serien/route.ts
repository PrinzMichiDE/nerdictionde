import { NextRequest, NextResponse } from "next/server";
import { getSeriesList } from "@/lib/review-series";
import { seriesListQuerySchema } from "@/lib/review-series-schema";

/**
 * GET /api/serien
 * Öffentliche API für Serien-Liste mit Pagination, Suche, Sortierung
 * Feature-Flag: FEATURE_REVIEW_SERIES
 */

export async function GET(request: NextRequest) {
  // Feature-Flag prüfen
  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);

    // Query-Parameter validieren
    const parsed = seriesListQuerySchema.safeParse({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
      q: searchParams.get("q") || undefined,
      sort: searchParams.get("sort") || undefined,
      order: searchParams.get("order") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Parameter", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await getSeriesList(parsed.data);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[API] GET /api/serien error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}