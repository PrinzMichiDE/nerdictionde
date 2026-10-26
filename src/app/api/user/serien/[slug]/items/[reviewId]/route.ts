import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { removeUserSeriesItem } from "@/lib/user-series";
import { userSeriesItemParamsSchema } from "@/lib/user-series-schema";
import { featureFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string; reviewId: string }>;
}

/**
 * DELETE /api/user/serien/[slug]/items/[reviewId]
 * Review aus Serie entfernen
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!featureFlags.userSeries) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { slug, reviewId } = await context.params;
  const parseResult = userSeriesItemParamsSchema.safeParse({ slug, reviewId });
  if (!parseResult.success) {
    return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await removeUserSeriesItem(userId, slug, reviewId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/user/serien/[slug]/items/[reviewId] error:", error);
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN: Bearbeitungsrechte erforderlich") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Serie nicht gefunden oder keine User-Serie") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (error.message === "Review gehört nicht zu dieser Serie") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}