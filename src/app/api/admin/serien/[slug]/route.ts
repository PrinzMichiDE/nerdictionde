import { NextRequest, NextResponse } from "next/server";
import { getSeriesForAdmin, updateSeries, deleteSeries } from "@/lib/review-series";
import { requireAdminAuth } from "@/lib/auth";
import { updateSeriesSchema } from "@/lib/review-series-schema";

/**
 * GET /api/admin/serien/[slug]
 * Admin: Einzelne Serie mit Items laden (für Edit-View)
 */

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const authError = requireAdminAuth(_request);
  if (authError) return authError;

  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { slug } = await context.params;

    const series = await getSeriesForAdmin(slug);

    if (!series) {
      return NextResponse.json({ error: "Serie nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ series });
  } catch (error) {
    console.error("[ADMIN API] GET /api/admin/serien/[slug] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/serien/[slug]
 * Admin: Serie aktualisieren (Titel, Beschreibung, Cover, Items)
 */

export async function PATCH(
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
    const body = await request.json();

    const parsed = updateSeriesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const series = await updateSeries(slug, parsed.data);
    return NextResponse.json({ series });
  } catch (error) {
    console.error("[ADMIN API] PATCH /api/admin/serien/[slug] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/serien/[slug]
 * Admin: Serie löschen (Soft-Delete)
 */

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const authError = requireAdminAuth(_request);
  if (authError) return authError;

  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { slug } = await context.params;

    await deleteSeries(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN API] DELETE /api/admin/serien/[slug] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
