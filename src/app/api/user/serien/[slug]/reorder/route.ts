import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { reorderUserSeries } from "@/lib/user-series";
import { reorderUserSeriesSchema, userSeriesParamsSchema } from "@/lib/user-series-schema";
import { featureFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/user/serien/[slug]/reorder
 * Reihenfolge der Teile ändern (Optimistisches Locking via version)
 * Body: { items: [{ reviewId, seriesOrder }], version }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  if (!featureFlags.userSeries) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { slug } = await context.params;
  const parseResult = userSeriesParamsSchema.safeParse({ slug });
  if (!parseResult.success) {
    return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const schemaParse = reorderUserSeriesSchema.safeParse(body);
  if (!schemaParse.success) {
    return NextResponse.json({ errors: schemaParse.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await reorderUserSeries(userId, slug, schemaParse.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/user/serien/[slug]/reorder error:", error);
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN: Bearbeitungsrechte erforderlich") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Serie nicht gefunden oder keine User-Serie") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (error.message === "VERSION_CONFLICT: Serie wurde zwischenzeitlich geändert") {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("lückenlos") || error.message.includes("Doppelte") || error.message.includes("gehören")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}