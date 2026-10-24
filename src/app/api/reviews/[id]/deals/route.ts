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
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }, { status: 500 });
  }
}
