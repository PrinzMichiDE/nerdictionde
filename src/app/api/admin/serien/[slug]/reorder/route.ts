import { NextRequest, NextResponse } from "next/server";
import { reorderSeries } from "@/lib/review-series";
import { requireAdminAuth } from "@/lib/auth";
import { reorderSeriesSchema } from "@/lib/review-series-schema";

/**
 * POST /api/admin/serien/[slug]/reorder
 * Admin: Reihenfolge der Teile ändern (Drag-and-Drop)
 * Optimistisches Locking via version
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
    const body = await request.json();

    const parsed = reorderSeriesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierungsfehler", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await reorderSeries(slug, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[ADMIN API] POST /api/admin/serien/[slug]/reorder error:", error);

    if (error instanceof Error && error.message.startsWith("VERSION_CONFLICT")) {
      return NextResponse.json(
        { error: "Serie wurde zwischenzeitlich geändert. Bitte neu laden." },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
