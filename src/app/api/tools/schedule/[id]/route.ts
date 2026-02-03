import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import prisma from "@/lib/prisma";

/**
 * DELETE /api/tools/schedule/[id]
 * Delete a schedule
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireTwitchAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const { id } = await params;

    // Verify ownership
    const schedule = await prisma.streamSchedule.findFirst({
      where: { id, userId },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    await prisma.streamSchedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete schedule error:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
