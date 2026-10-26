import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const history = await prisma.priceHistory.findMany({
      where: { reviewId: id },
      orderBy: { recordedAt: "asc" },
      take: 30,
    });

    return NextResponse.json(history);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }, { status: 500 });
  }
}
