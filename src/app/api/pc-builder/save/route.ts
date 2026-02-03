import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/pc-builder/save
 * Body: { name: string, components: unknown[], totalPrice: number }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "Mein Build").trim() || "Mein Build";
    const components = Array.isArray(body.components) ? body.components : [];
    const totalPrice = Number(body.totalPrice);
    const userId = body.userId ? String(body.userId) : null;

    if (Number.isNaN(totalPrice) || totalPrice < 0) {
      return NextResponse.json({ error: "Invalid totalPrice" }, { status: 400 });
    }

    const build = await prisma.userPCBuild.create({
      data: { name, components, totalPrice, userId },
    });
    return NextResponse.json(build);
  } catch (error) {
    console.error("POST /api/pc-builder/save error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save build" },
      { status: 500 }
    );
  }
}
