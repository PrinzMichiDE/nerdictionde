import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { createRatingSchema } from "@/lib/rating-schema";

export async function POST(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const parsed = createRatingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { reviewId, score, text } = parsed.data;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const existing = await prisma.userRating.findUnique({
    where: { userId_reviewId: { userId: auth.userId, reviewId } },
  });

  let rating;
  if (existing) {
    rating = await prisma.userRating.update({
      where: { id: existing.id },
      data: { score, text: text || null },
    });
  } else {
    rating = await prisma.userRating.create({
      data: { userId: auth.userId, reviewId, score, text: text || null },
    });
  }

  const stats = await prisma.userRating.aggregate({
    where: { reviewId },
    _avg: { score: true },
    _count: { score: true },
  });

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      userRatingCount: stats._count.score,
      userRatingAvg: stats._avg.score ?? 0,
    },
  });

  return NextResponse.json({ success: true, data: rating });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get("reviewId");

  if (!reviewId) {
    return NextResponse.json({ error: "reviewId required" }, { status: 400 });
  }

  const ratings = await prisma.userRating.findMany({
    where: { reviewId },
    include: { user: { select: { username: true, displayName: true, profileImageUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ success: true, data: ratings });
}
