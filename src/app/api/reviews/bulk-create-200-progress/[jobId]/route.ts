import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/job-status";
import { requireAdminAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { jobId } = params;

    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job,
    });
  } catch (error: any) {
    console.error("Get job progress error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
