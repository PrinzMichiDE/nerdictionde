import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { cancelQueueJob } from "@/lib/queue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const job = await cancelQueueJob(id);

    if (!job) {
      return NextResponse.json(
        { error: "Queue job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Queue job cancelled successfully",
      job,
    });
  } catch (error: any) {
    console.error("Error cancelling queue job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
