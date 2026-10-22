import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTwitchAuth } from "@/lib/auth-twitch";
import { createVoteSchema } from "@/lib/rating-schema";

export async function POST(request: NextRequest) {
  const auth = await requireTwitchAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const parsed = createVoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { targetType, targetId, value } = parsed.data;

  const existing = await prisma.vote.findUnique({
    where: { userId_targetType_targetId: { userId: auth.userId, targetType, targetId } },
  });

  if (existing) {
    if (existing.value === value) {
      await prisma.vote.delete({ where: { id: existing.id } });
    } else {
      await prisma.vote.update({ where: { id: existing.id }, data: { value } });
    }
  } else {
    await prisma.vote.create({
      data: { userId: auth.userId, targetType, targetId, value },
    });
  }

  const stats = await prisma.vote.aggregate({
    where: { targetType, targetId },
    _sum: { value: true },
  });
  const newScore = stats._sum.value ?? 0;

  if (targetType === "thread") {
    await prisma.forumThread.update({ where: { id: targetId }, data: { score: newScore } });
  } else if (targetType === "comment") {
    await prisma.forumComment.update({ where: { id: targetId }, data: { score: newScore } });
  }

  const userVote = await prisma.vote.findUnique({
    where: { userId_targetType_targetId: { userId: auth.userId, targetType, targetId } },
  });

  return NextResponse.json({
    success: true,
    data: { score: newScore, userVote: userVote?.value ?? null },
  });
}
