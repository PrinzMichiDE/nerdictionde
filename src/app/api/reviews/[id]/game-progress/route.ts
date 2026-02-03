import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/reviews/[id]/game-progress
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const progress = await prisma.gameProgress.findMany({
      where: { reviewId: id },
      orderBy: { updatedAt: "desc" },
      take: 1,
    });
    return NextResponse.json(progress[0] ?? null);
  } catch (error) {
    console.error("GET /api/reviews/[id]/game-progress error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch game progress" },
      { status: 500 }
    );
  }
}
