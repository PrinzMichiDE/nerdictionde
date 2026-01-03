import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getQueueJobs, getQueueStats } from "@/lib/queue";

export async function GET(req: NextRequest) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");

    const [jobs, stats] = await Promise.all([
      getQueueJobs(status, limit),
      getQueueStats(),
    ]);

    return NextResponse.json({
      jobs,
      stats,
    });
  } catch (error: any) {
    console.error("Error fetching queue jobs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
