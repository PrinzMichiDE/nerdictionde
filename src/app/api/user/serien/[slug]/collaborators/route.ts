import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { getCollaborators, inviteCollaborator } from "@/lib/user-series";
import { inviteCollaboratorSchema, userSeriesParamsSchema } from "@/lib/user-series-schema";
import { featureFlags } from "@/lib/feature-flags";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/user/serien/[slug]/collaborators
 * Collaborators auflisten
 */
export async function GET(request: NextRequest, context: RouteContext) {
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

  // Serie-ID auflösen und Berechtigung prüfen
  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null, type: "USER" },
    select: { id: true, ownerId: true },
  });

  if (!series) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Nur Owner darf Collaborators sehen
  if (series.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await getCollaborators(series.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/user/serien/[slug]/collaborators error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

/**
 * POST /api/user/serien/[slug]/collaborators
 * Collaborator einladen
 * Body: { userId, role: "EDITOR" }
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

  const schemaParse = inviteCollaboratorSchema.safeParse(body);
  if (!schemaParse.success) {
    return NextResponse.json({ errors: schemaParse.error.flatten().fieldErrors }, { status: 400 });
  }

  // Serie-ID auflösen
  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null, type: "USER" },
    select: { id: true },
  });

  if (!series) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await inviteCollaborator(userId, series.id, schemaParse.data);
    return NextResponse.json({ collaborator: result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/user/serien/[slug]/collaborators error:", error);
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN: Nur Owner darf diese Aktion ausführen") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Nutzer nicht gefunden") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "Du kannst dich nicht selbst einladen") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Maximal 10 Kollaboratoren pro Serie") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message === "Nutzer ist bereits Kollaborator") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}