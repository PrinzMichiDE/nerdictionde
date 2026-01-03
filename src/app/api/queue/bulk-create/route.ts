import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { createBulkCreateQueueJob, QueueConfig, updateQueueJobStatus } from "@/lib/queue";
import { getIGDBGamesBulk } from "@/lib/igdb";

export async function POST(req: NextRequest) {
  // Require admin authentication
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const body: QueueConfig = await req.json();

    if (!body.queryOptions) {
      return NextResponse.json(
        { error: "queryOptions are required" },
        { status: 400 }
      );
    }

    // Validate query options by fetching games count (but don't store them yet)
    let games;
    try {
      games = await getIGDBGamesBulk(body.queryOptions);
    } catch (error: any) {
      console.error("Error fetching games from IGDB:", error);
      return NextResponse.json(
        { error: `Failed to fetch games from IGDB: ${error.message}` },
        { status: 400 }
      );
    }

    if (!games || games.length === 0) {
      return NextResponse.json(
        { error: "No games found matching the criteria" },
        { status: 404 }
      );
    }

    // Create queue job
    const queueJob = await createBulkCreateQueueJob({
      queryOptions: body.queryOptions,
      batchSize: body.batchSize || 5,
      delayBetweenBatches: body.delayBetweenBatches || 2000,
      status: body.status || "draft",
      skipExisting: body.skipExisting !== false,
    });

    // Update total items
    const batchSize = body.batchSize || 5;
    const totalBatches = Math.ceil(games.length / batchSize);

    await updateQueueJobStatus(queueJob.id, "pending", {
      totalItems: games.length,
      totalBatches,
    });

    return NextResponse.json({
      message: "Queue job created successfully",
      jobId: queueJob.id,
      totalItems: games.length,
      totalBatches,
    });
  } catch (error: any) {
    console.error("Queue creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
