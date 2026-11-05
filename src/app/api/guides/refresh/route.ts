import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncGuidesFromTopics } from "@/lib/guide-generation";

export const maxDuration = 300;

const COOLDOWN_MINUTES = parseInt(process.env.GUIDE_SYNC_COOLDOWN_MIN || "120", 10) || 120;

export async function GET() {
  try {
    const now = new Date();
    const state = await prisma.guideSyncState.findFirst();
    const last = state?.lastRunAt ? new Date(state.lastRunAt) : new Date(0);
    const elapsedMin = (now.getTime() - last.getTime()) / 60000;

    if (elapsedMin < COOLDOWN_MINUTES) {
      return NextResponse.json({
        skipped: true,
        nextInMinutes: Math.ceil(COOLDOWN_MINUTES - elapsedMin),
      });
    }

    await prisma.guideSyncState.upsert({
      where: { id: "singleton" },
      update: { lastRunAt: now },
      create: { id: "singleton", lastRunAt: now },
    });

    const result = await syncGuidesFromTopics();

    if (!result.success) {
      await prisma.guideSyncState.update({
        where: { id: "singleton" },
        data: { lastRunAt: new Date(0) },
      });
    }

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error("❌ Error in guide refresh:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
