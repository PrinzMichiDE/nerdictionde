import { NextRequest, NextResponse } from "next/server";
import { getAllJobs } from "@/lib/job-status";
import { requireAdminAuth } from "@/lib/auth";
import { resumeRunningJobs } from "@/lib/job-resume";

export async function GET(req: NextRequest) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  // Resume any running jobs in the background (only runs once per server instance)
  resumeRunningJobs().catch(err => console.error("Error resuming jobs:", err));

  try {
    const jobs = await getAllJobs(50); // Get latest 50 jobs

    return NextResponse.json({
      jobs,
    });
  } catch (error: any) {
    console.error("Get all jobs error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

