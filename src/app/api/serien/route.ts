import { NextRequest, NextResponse } from "next/server";
import { getSeriesList } from "@/lib/review-series";
import { seriesListQuerySchema } from "@/lib/review-series-schema";
import { FEATURE_REVIEW_SERIES, FEATURE_USER_SERIES } from "@/lib/feature-flags";

/**
 * GET /api/serien
 * Öffentliche API für Serien-Liste mit Pagination, Suche, Sortierung
 * Feature-Flags: FEATURE_REVIEW_SERIES, FEATURE_USER_SERIES
 * Query-Parameter: cursor, limit, q, sort, order, type, visibility, ownerId
 */

export async function GET(request: NextRequest) {
  // Feature-Flag prüfen
  if (!FEATURE_REVIEW_SERIES) {
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
      type: searchParams.get("type") || undefined,
      visibility: searchParams.get("visibility") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Parameter", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Wenn FEATURE_USER_SERIES deaktiviert ist, nur ADMIN-Serien anzeigen
    // und Filter für USER-Serien ignorieren
    if (!FEATURE_USER_SERIES && parsed.data.type === "USER") {
      return NextResponse.json({ series: [], nextCursor: null });
    }

    // Wenn FEATURE_USER_SERIES deaktiviert ist, ownerId und visibility=PRIVATE ignorieren
    const query = { ...parsed.data };
    if (!FEATURE_USER_SERIES) {
      delete query.ownerId;
      if (query.visibility === "PRIVATE") {
        query.visibility = "PUBLIC";
      }
    }

    const result = await getSeriesList(query);

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