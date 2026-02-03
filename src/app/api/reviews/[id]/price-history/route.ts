import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/reviews/[id]/price-history
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const history = await prisma.priceHistory.findMany({
      where: { reviewId: id },
      orderBy: { recordedAt: "asc" },
    });
    return NextResponse.json(history);
  } catch (error) {
    console.error("GET /api/reviews/[id]/price-history error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch price history" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews/[id]/price-history
 * Body: { price: number, currency?: string, source: string, url?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const price = Number(body.price);
    const currency = body.currency ?? "EUR";
    const source = String(body.source ?? "unknown");
    const url = body.url ? String(body.url) : null;

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const record = await prisma.priceHistory.create({
      data: { reviewId: id, price, currency, source, url },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error("POST /api/reviews/[id]/price-history error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create price history" },
      { status: 500 }
    );
  }
}
