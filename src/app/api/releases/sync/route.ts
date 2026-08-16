import { NextResponse } from "next/server";
import {
  syncUpcomingReleases,
  isCalendarSyncDue,
  isCalendarSyncRunning,
} from "@/lib/upcoming-releases";

export const maxDuration = 300;

export async function GET() {
  try {
    if ((await isCalendarSyncDue()) && !isCalendarSyncRunning()) {
      const result = await syncUpcomingReleases();
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }

    return NextResponse.json({
      success: true,
      skipped: true,
      message: "Release calendar is up to date.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
