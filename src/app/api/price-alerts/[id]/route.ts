import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * DELETE /api/price-alerts/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.priceAlert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/price-alerts/[id] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete alert" },
      { status: 500 }
    );
  }
}
