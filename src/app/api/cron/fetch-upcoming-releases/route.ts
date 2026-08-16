import { NextRequest, NextResponse } from "next/server";
import { syncUpcomingReleases } from "@/lib/upcoming-releases";

export const maxDuration = 300;

/**
 * Cron Job: Keeps the game release calendar in sync with IGDB.
 * Schedule: Daily at 4 AM UTC (0 4 * * *)
 *
 * This job:
 * - Fetches games with release dates in the next 365 days from IGDB
 * - Creates lightweight draft reviews for games that don't exist yet
 * - Updates release dates for existing games
 *
 * The full review content (AI-generated text, images, SEO, tags, comments) is
 * generated later by /api/cron/publish-release-reviews once a game releases.
 *
 * Query Parameters (compatibility):
 * - force=true: Historically forced execution outside of the weekly window
 */
export async function GET(req: NextRequest) {
  try {
    // Check for authorization (Vercel Cron Secret)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn("⚠️ Unauthorized cron job attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncUpcomingReleases();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error("❌ Error in upcoming releases cron:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
