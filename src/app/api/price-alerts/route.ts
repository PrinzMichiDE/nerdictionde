import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/price-alerts
 * Body: { reviewId: string, targetPrice: number, email?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reviewId = String(body.reviewId ?? "").trim();
    const targetPrice = Number(body.targetPrice);
    const email = body.email ? String(body.email).trim() : null;

    if (!reviewId) {
      return NextResponse.json({ error: "reviewId required" }, { status: 400 });
    }
    if (Number.isNaN(targetPrice) || targetPrice < 0) {
      return NextResponse.json({ error: "Invalid targetPrice" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const alert = await prisma.priceAlert.create({
      data: { reviewId, targetPrice, email },
    });
    return NextResponse.json(alert);
  } catch (error) {
    console.error("POST /api/price-alerts error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create alert" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/price-alerts?email=... or ?reviewId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const reviewId = searchParams.get("reviewId");

    const where: { email?: string; reviewId?: string } = {};
    if (email) where.email = email;
    if (reviewId) where.reviewId = reviewId;

    const alerts = await prisma.priceAlert.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: { review: { select: { id: true, slug: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("GET /api/price-alerts error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
