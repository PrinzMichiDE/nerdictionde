import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { getFollowStatus, followUserSeries, unfollowUserSeries } from "@/lib/user-series";
import { userSeriesFollowParamsSchema } from "@/lib/user-series-schema";
import { featureFlags } from "@/lib/feature-flags";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/user/serien/[slug]/follow
 * Follow-Status abfragen
 */
export async function GET(request: NextRequest, context: RouteContext) {
  if (!featureFlags.userSeries) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { slug } = await context.params;
  const parseResult = userSeriesFollowParamsSchema.safeParse({ slug });
  if (!parseResult.success) {
    return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  // Serie-ID aus Slug auflösen
  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null, type: "USER" },
    select: { id: true },
  });

  if (!series) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const status = await getFollowStatus(userId, series.id);
    return NextResponse.json(status);
  } catch (error) {
    console.error("GET /api/user/serien/[slug]/follow error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

/**
 * POST /api/user/serien/[slug]/follow
 * Serie folgen
 */
export async function POST(request: NextRequest, context: RouteContext) {
  if (!featureFlags.userSeries) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { slug } = await context.params;
  const parseResult = userSeriesFollowParamsSchema.safeParse({ slug });
  if (!parseResult.success) {
    return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  // Serie-ID aus Slug auflösen
  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null, type: "USER" },
    select: { id: true },
  });

  if (!series) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await followUserSeries(userId, series.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/user/serien/[slug]/follow error:", error);
    if (error instanceof Error) {
      if (error.message === "Nur User-Serien können gefolgt werden") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Private Serien können nicht gefolgt werden") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Du kannst deine eigene Serie nicht folgen") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/serien/[slug]/follow
 * Serie entfolgen
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!featureFlags.userSeries) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { slug } = await context.params;
  const parseResult = userSeriesFollowParamsSchema.safeParse({ slug });
  if (!parseResult.success) {
    return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  // Serie-ID aus Slug auflösen
  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null, type: "USER" },
    select: { id: true },
  });

  if (!series) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await unfollowUserSeries(userId, series.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/user/serien/[slug]/follow error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}