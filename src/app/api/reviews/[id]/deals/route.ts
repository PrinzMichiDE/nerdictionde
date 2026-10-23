import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deals = await prisma.deal.findMany({
      where: { reviewId: id, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(deals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
