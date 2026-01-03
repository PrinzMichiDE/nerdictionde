import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the current review to find related ones
    const currentReview = await prisma.review.findUnique({
      where: { id },
      select: {
        category: true,
        score: true,
      },
    });

    if (!currentReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Find related reviews:
    // 1. Same category
    // 2. Similar score (within +/- 15 points)
    // 3. Not the current review
    // 4. Published status
    const relatedReviews = await prisma.review.findMany({
      where: {
        id: { not: id },
        category: currentReview.category,
        status: "published",
        score: {
          gte: Math.max(0, currentReview.score - 15),
          lte: Math.min(100, currentReview.score + 15),
        },
      },
      take: 4,
      orderBy: {
        createdAt: "desc",
      },
    });

    // If we don't have enough related reviews, fill with latest from same category
    if (relatedReviews.length < 4) {
      const additionalReviews = await prisma.review.findMany({
        where: {
          id: { 
            notIn: [id, ...relatedReviews.map(r => r.id)] 
          },
          category: currentReview.category,
          status: "published",
        },
        take: 4 - relatedReviews.length,
        orderBy: {
          createdAt: "desc",
        },
      });
      
      relatedReviews.push(...additionalReviews);
    }

    return NextResponse.json(relatedReviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

