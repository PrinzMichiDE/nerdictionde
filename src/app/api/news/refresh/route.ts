import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncNewsFromRss } from "@/lib/news-generation";

export const maxDuration = 300;

/**
 * On-Demand News-Sync. Wird (z. B. beim Laden von /news) getriggert und führt
 * einen Sync nur aus, wenn seit dem letzten Lauf die Cooldown-Zeit (Standard
 * 60 Min) verstrichen ist. So bleiben die News auch im Vercel Hobby-Plan
 * (das nur tägliche Cron-Jobs erlaubt) stündlich etwa aktuell.
 */
const COOLDOWN_MINUTES = parseInt(process.env.NEWS_SYNC_COOLDOWN_MIN || "60", 10) || 60;

export async function GET() {
  try {
    const now = new Date();
    const state = await prisma.newsSyncState.findFirst();
    const last = state?.lastRunAt ? new Date(state.lastRunAt) : new Date(0);
    const elapsedMin = (now.getTime() - last.getTime()) / 60000;

    if (elapsedMin < COOLDOWN_MINUTES) {
      return NextResponse.json({
        skipped: true,
        nextInMinutes: Math.ceil(COOLDOWN_MINUTES - elapsedMin),
      });
    }

    // Cooldown als Lock aktualisieren, um parallele Läufe zu vermeiden.
    await prisma.newsSyncState.upsert({
      where: { id: "singleton" },
      update: { lastRunAt: now },
      create: { id: "singleton", lastRunAt: now },
    });

    const result = await syncNewsFromRss();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error("❌ Error in news refresh:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
