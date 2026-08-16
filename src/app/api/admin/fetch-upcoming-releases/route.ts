import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { syncUpcomingReleases } from "@/lib/upcoming-releases";

export const maxDuration = 300;

/**
 * Admin endpoint: Manually syncs the game release calendar with IGDB.
 * Auth: Requires the admin token (cookie or Authorization header).
 */
export async function GET(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  const result = await syncUpcomingReleases();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
