import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTwitchAuth } from "@/lib/auth-twitch";

export async function GET(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const ratings = await prisma.userRating.findMany({
    where: { userId: auth.userId },
    include: {
      review: { select: { id: true, title: true, slug: true, category: true, score: true, images: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: ratings });
}
