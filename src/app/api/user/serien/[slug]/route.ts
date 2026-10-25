import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { getUserSeriesForEdit, updateUserSeries, deleteUserSeries } from "@/lib/user-series";
import { updateUserSeriesSchema, userSeriesParamsSchema } from "@/lib/user-series-schema";
import { featureFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/user/serien/[slug]
 * Serie zum Bearbeiten laden (Owner/Collaborator only)
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

  try {
    const series = await getUserSeriesForEdit(slug, userId);
    if (!series) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ series });
  } catch (error) {
    console.error("GET /api/user/serien/[slug] error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

/**
 * PATCH /api/user/serien/[slug]
 * Serie updaten (Metadaten, Visibility, Items für Reorder)
 * Body: { title?, description?, coverImage?, visibility?, items? }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

  const schemaParse = updateUserSeriesSchema.safeParse(body);
  if (!schemaParse.success) {
    return NextResponse.json({ errors: schemaParse.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const updated = await updateUserSeries(userId, slug, schemaParse.data);
    return NextResponse.json({ series: updated });
  } catch (error) {
    console.error("PATCH /api/user/serien/[slug] error:", error);
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN: Bearbeitungsrechte erforderlich") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Serie nicht gefunden oder keine User-Serie") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

/**
 * DELETE /api/user/serien/[slug]
 * Serie löschen (Soft-Delete, Owner only)
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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

  try {
    await deleteUserSeries(userId, slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/user/serien/[slug] error:", error);
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN: Nur Owner darf diese Aktion ausführen") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "Serie nicht gefunden oder keine User-Serie") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}