/**
 * Cron Job: Publish draft game reviews whose release date is today (or in the next 7 days).
 * Fetches full IGDB data, generates full content (text, images, SEO, tags, comments), updates the review and sets status to published.
 * Schedule: Daily at 6:00 UTC (0 6 * * *)
 *
 * Query parameters:
 * - window=day | week — "day" = release date today only (default), "week" = next 7 days
 * - limit=1..10 — max reviews to process per run (default 5)
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { enrichAndPublishDraftGameReview } from "@/lib/review-generation";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const window = searchParams.get("window") === "week" ? "week" : "day";
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 1), 1),
      MAX_LIMIT
    );

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const endDate = window === "week"
      ? new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)
      : endOfToday;

    const drafts = await prisma.review.findMany({
      where: {
        category: "game",
        status: "draft",
        igdbId: { not: null },
        releaseDate: {
          gte: startOfToday,
          lte: endDate,
        },
      },
      select: { id: true, title: true, releaseDate: true },
      orderBy: { releaseDate: "asc" },
      take: limit,
    });

    const results: Array<{ id: string; title: string; success: boolean; error?: string }> = [];

    for (const draft of drafts) {
      const result = await enrichAndPublishDraftGameReview(draft.id);
      results.push({
        id: draft.id,
        title: draft.title,
        success: result.success,
        error: result.error,
      });
      await new Promise((r) => setTimeout(r, 1000));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successful = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Published ${successful} of ${results.length} release review(s).`,
      window,
      limit,
      results,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Publish release reviews error:", error);
    return NextResponse.json(
      { success: false, error: message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
