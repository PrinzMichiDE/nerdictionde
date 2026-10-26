import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { addUserSeriesItem } from "@/lib/user-series";
import { addUserSeriesItemSchema, userSeriesParamsSchema } from "@/lib/user-series-schema";
import { featureFlags } from "@/lib/feature-flags";
import { createUserSeriesItemNotification } from "@/lib/user-series";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * POST /api/user/serien/[slug]/items
 * Review zur Serie hinzufügen
 * Body: { reviewId }
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

  const schemaParse = addUserSeriesItemSchema.safeParse(body);
  if (!schemaParse.success) {
    return NextResponse.json({ errors: schemaParse.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const result = await addUserSeriesItem(userId, slug, schemaParse.data);
    
    // Notification für Follower erstellen (async, nicht blockierend)
    const series = await prisma.reviewSeries.findUnique({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (series) {
      createUserSeriesItemNotification(series.id, userId, [schemaParse.data.reviewId]).catch((err) =>
        console.error("[Notification] Failed to create user series item notification:", err)
      );
    }
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/user/serien/[slug]/items error:", error);
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN: Bearbeitungsrechte erforderlich") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Serie nicht gefunden oder keine User-Serie") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (error.message === "Maximale Teileanzahl (50) erreicht") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Review gehört bereits zu einer Serie") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Review nicht gefunden oder nicht veröffentlicht") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}