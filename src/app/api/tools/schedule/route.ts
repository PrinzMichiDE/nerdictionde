import { NextRequest, NextResponse } from "next/server";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import prisma from "@/lib/prisma";
import { z } from "zod";

const scheduleSchema = z.object({
  title: z.string().min(1),
  game: z.string().optional().nullable(),
  startTime: z.string(),
  endTime: z.string().optional().nullable(),
  timezone: z.string().default("Europe/Berlin"),
  isRecurring: z.boolean().default(false),
  recurrence: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

/**
 * GET /api/tools/schedule
 * Get all schedules for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireTwitchAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const schedules = await prisma.streamSchedule.findMany({
      where: { userId },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error("Get schedules error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tools/schedule
 * Create a new schedule
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireTwitchAuth(req);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const body = await req.json();
    const validated = scheduleSchema.parse(body);

    const schedule = await prisma.streamSchedule.create({
      data: {
        userId,
        title: validated.title,
        game: validated.game || null,
        startTime: new Date(validated.startTime),
        endTime: validated.endTime ? new Date(validated.endTime) : null,
        timezone: validated.timezone,
        isRecurring: validated.isRecurring,
        recurrence: validated.recurrence || null,
        tags: validated.tags,
      },
    });

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("Create schedule error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
