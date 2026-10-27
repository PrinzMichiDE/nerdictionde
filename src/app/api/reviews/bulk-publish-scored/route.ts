import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const result = await prisma.review.updateMany({
      where: {
        status: "draft",
        score: {
          gt: 0,
        },
      },
      data: {
        status: "published",
      },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
