import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/deals
 * Query: category?, status?, page?, limit?
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status") || "active";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "24"), 48);
    const reviewId = searchParams.get("reviewId");

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (reviewId) where.reviewId = reviewId;
    
    // Filter: Show deals linked to hardware or game reviews, OR Amazon deals (which can be matched later)
    where.OR = [
      {
        review: {
          category: { in: ["hardware", "game"] }
        }
      },
      {
        url: { contains: "amazon.de" }
      },
      {
        url: { contains: "amazon.com" }
      }
    ];

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: { review: { select: { id: true, slug: true, title: true, category: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      deals,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error("GET /api/deals error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch deals" },
      { status: 500 }
    );
  }
}
