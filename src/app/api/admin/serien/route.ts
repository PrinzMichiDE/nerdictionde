import { NextRequest, NextResponse } from "next/server";
import { createSeries, getSeriesForAdmin, updateSeries, deleteSeries } from "@/lib/review-series";
import { requireAdminAuth } from "@/lib/auth";
import { createSeriesSchema, updateSeriesSchema, seriesParamsSchema } from "@/lib/review-series-schema";

/**
 * POST /api/admin/serien
 * Admin: Neue Serie anlegen
 */

export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const parsed = createSeriesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const series = await createSeries(parsed.data);
    return NextResponse.json({ series }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN API] POST /api/admin/serien error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

/**
 * GET /api/admin/serien
 * Admin: Alle Serien auflisten (für Admin-UI)
 */

export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Für Admin: alle Serien inkl. gelöschte, mit Pagination
    // TODO: Implementierung falls benötigt
    return NextResponse.json({ series: [] });
  } catch (error) {
    console.error("[ADMIN API] GET /api/admin/serien error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}