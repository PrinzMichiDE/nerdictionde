import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { GAME_OVERLAY_SEED } from "@/lib/game-overlays-seed";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

// Upserts the curated, license-free game overlays into the GameOverlay table.
// Protected by CRON_SECRET (run as part of deploy / manually).
export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = [];
    for (const o of GAME_OVERLAY_SEED) {
      const upserted = await prisma.gameOverlay.upsert({
        where: { slug: o.slug },
        update: {
          name: o.name,
          category: o.category,
          description: o.description,
          htmlCode: o.htmlCode,
          config: o.config as Prisma.InputJsonValue,
          license: o.license,
          author: o.author,
        },
        create: {
          name: o.name,
          slug: o.slug,
          category: o.category,
          description: o.description,
          htmlCode: o.htmlCode,
          config: o.config as Prisma.InputJsonValue,
          license: o.license,
          author: o.author,
          isPublic: true,
        },
      });
      results.push({ slug: upserted.slug, id: upserted.id });
    }

    return NextResponse.json({ ok: true, count: results.length, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
