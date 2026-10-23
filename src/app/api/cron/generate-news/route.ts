import { NextRequest, NextResponse } from "next/server";
import { syncNewsFromRss } from "@/lib/news-generation";

export const maxDuration = 300;

/**
 * Cron Job: Prüft die konfigurierten News-Feeds (src/lib/news-sources.ts) auf
 * neue Einträge und erstellt daraus KI-generierte News-Beiträge.
 *
 * Schedule: Täglich (0 9 * * *), zusätzlich on-demand via /api/news/refresh.
 * Umgebungsvariablen:
 *   - NEWS_RSS_FEED: optionaler zusätzlicher RSS-Feed
 *   - NEWS_MAX_PER_RUN: max. neue Beiträge pro Lauf (Standard: 8)
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("⚠️ Unauthorized news cron attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncNewsFromRss();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error("❌ Error in generate-news cron:", error);
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
