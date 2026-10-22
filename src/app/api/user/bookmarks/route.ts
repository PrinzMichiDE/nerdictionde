import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { createBookmarkSchema } from "@/lib/rating-schema";

export async function POST(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const parsed = createBookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { reviewId } = parsed.data;

  const existing = await prisma.bookmark.findUnique({
    where: { userId_reviewId: { userId: auth.userId, reviewId } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, data: { bookmarked: false } });
  }

  await prisma.bookmark.create({
    data: { userId: auth.userId, reviewId },
  });

  return NextResponse.json({ success: true, data: { bookmarked: true } });
}

export async function GET(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: auth.userId },
    include: { review: { select: { id: true, title: true, slug: true, category: true, score: true, images: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: bookmarks });
}
