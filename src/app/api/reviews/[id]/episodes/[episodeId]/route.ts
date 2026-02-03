import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * PATCH /api/reviews/[id]/episodes/[episodeId]
 * Body: { title?: string, score?: number, notes?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; episodeId: string }> }
) {
  try {
    const { id, episodeId } = await params;
    const body = await req.json();

    const existing = await prisma.episodeReview.findFirst({
      where: { id: episodeId, reviewId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    const data: { title?: string | null; score?: number | null; notes?: string | null } = {};
    if (body.title !== undefined) data.title = body.title ? String(body.title) : null;
    if (body.score !== undefined) data.score = body.score != null ? parseInt(String(body.score), 10) : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;

    const updated = await prisma.episodeReview.update({
      where: { id: episodeId },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/reviews/[id]/episodes/[episodeId] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update episode" },
      { status: 500 }
    );
  }
}
