import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/users/search
 * Suche nach Nutzern für Collaborator-Einladungen
 * Query: q (Suchbegriff), limit
 */
export async function GET(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const users = await prisma.twitchUser.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
      },
      take: limit,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/users/search error:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}