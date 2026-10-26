import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { acceptCollaboratorInvite, updateCollaboratorRole, removeCollaborator } from "@/lib/user-series";
import { updateCollaboratorSchema, collaboratorParamsSchema } from "@/lib/user-series-schema";
import { featureFlags } from "@/lib/feature-flags";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string; userId: string }>;
}

/**
 * PATCH /api/user/serien/[slug]/collaborators/[userId]
 * Collaborator Rolle ändern oder Einladung akzeptieren
 * Body: { role: "OWNER" | "EDITOR" } oder { accept: true }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!featureFlags.userSeries) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { slug, userId: targetUserId } = await context.params;
  const parseResult = collaboratorParamsSchema.safeParse({ slug, userId: targetUserId });
  if (!parseResult.success) {
    return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Serie-ID auflösen
  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null, type: "USER" },
    select: { id: true, ownerId: true },
  });

  if (!series) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Accept-Invite: eingeloggter User akzeptiert eigene Einladung
  if (body.accept === true && targetUserId === userId) {
    try {
      await acceptCollaboratorInvite(userId, series.id);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("PATCH accept /api/user/serien/[slug]/collaborators/[userId] error:", error);
      if (error instanceof Error) {
        if (error.message === "Keine Einladung gefunden") {
          return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message === "Einladung bereits akzeptiert") {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      }
      return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
    }
  }

  // Role Update: nur Owner darf Rollen ändern
  if (series.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (targetUserId === userId) {
    return NextResponse.json({ error: "Du kannst deine eigene Rolle nicht ändern" }, { status: 400 });
  }

  const schemaParse = updateCollaboratorSchema.safeParse(body);
  if (!schemaParse.success) {
    return NextResponse.json({ errors: schemaParse.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    await updateCollaboratorRole(userId, series.id, targetUserId, schemaParse.data.role);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH role /api/user/serien/[slug]/collaborators/[userId] error:", error);
    if (error instanceof Error) {
      if (error.message === "Kollaborator nicht gefunden") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message === "Einladung noch nicht akzeptiert") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/serien/[slug]/collaborators/[userId]
 * Collaborator entfernen (nur Owner)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!featureFlags.userSeries) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { slug, userId: targetUserId } = await context.params;
  const parseResult = collaboratorParamsSchema.safeParse({ slug, userId: targetUserId });
  if (!parseResult.success) {
    return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  // Serie-ID auflösen
  const series = await prisma.reviewSeries.findUnique({
    where: { slug, deletedAt: null, type: "USER" },
    select: { id: true, ownerId: true },
  });

  if (!series) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Nur Owner darf entfernen
  if (series.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (targetUserId === userId) {
    return NextResponse.json({ error: "Du kannst dich nicht selbst entfernen" }, { status: 400 });
  }

  try {
    await removeCollaborator(userId, series.id, targetUserId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/user/serien/[slug]/collaborators/[userId] error:", error);
    if (error instanceof Error) {
      if (error.message === "Kollaborator nicht gefunden") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}