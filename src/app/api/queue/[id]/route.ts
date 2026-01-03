import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { getQueueJob } from "@/lib/queue";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const job = await getQueueJob(id);

    if (!job) {
      return NextResponse.json(
        { error: "Queue job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error("Error fetching queue job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
