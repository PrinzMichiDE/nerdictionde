import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/reviews/[id]/deals
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deals = await prisma.deal.findMany({
      where: { reviewId: id, status: "active" },
      orderBy: { price: "asc" },
    });
    return NextResponse.json(deals);
  } catch (error) {
    console.error("GET /api/reviews/[id]/deals error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch deals" },
      { status: 500 }
    );
  }
}
