import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/pc-builder/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const build = await prisma.userPCBuild.findUnique({
      where: { id },
    });
    if (!build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }
    return NextResponse.json(build);
  } catch (error) {
    console.error("GET /api/pc-builder/[id] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch build" },
      { status: 500 }
    );
  }
}
