import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { getUserSeriesList, createUserSeries } from "@/lib/user-series";
import { userSeriesListQuerySchema, createUserSeriesSchema } from "@/lib/user-series-schema";
import { featureFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/serien
 * Liste der eigenen User-Serien + Collaborator-Serien
 * Query: cursor, limit, visibility
 */
export async function GET(request: NextRequest) {
  if (!featureFlags.userSeries) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  const { searchParams } = new URL(request.url);
  const query = userSeriesListQuerySchema.parse({
    cursor: searchParams.get("cursor") || undefined,
    limit: searchParams.get("limit") || undefined,
    visibility: searchParams.get("visibility") || undefined,
  });

  try {
    const { series, nextCursor } = await getUserSeriesList(userId, query);
    return NextResponse.json({ series, nextCursor });
  } catch (error) {
    console.error("GET /api/user/serien error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

/**
 * POST /api/user/serien
 * Neue User-Serie erstellen
 * Body: { title, description?, coverImage?, visibility?, reviewIds[] }
 */
export async function POST(request: NextRequest) {
  if (!featureFlags.userSeries) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.userId;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parseResult = createUserSeriesSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ errors: parseResult.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const series = await createUserSeries(userId, parseResult.data);
    return NextResponse.json({ series }, { status: 201 });
  } catch (error) {
    console.error("POST /api/user/serien error:", error);
    if (error instanceof Error) {
      if (error.message.includes("nicht veröffentlicht")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("Maximal")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}