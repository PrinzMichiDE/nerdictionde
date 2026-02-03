import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/reviews/[id]/video-chapters
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapters = await prisma.videoChapter.findMany({
      where: { reviewId: id },
      orderBy: { timestamp: "asc" },
    });
    return NextResponse.json(chapters);
  } catch (error) {
    console.error("GET /api/reviews/[id]/video-chapters error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}
