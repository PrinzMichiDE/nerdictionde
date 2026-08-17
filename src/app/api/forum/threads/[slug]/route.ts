import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const thread = await prisma.forumThread.findUnique({
      where: { slug },
      include: {
        review: {
          select: {
            id: true,
            title: true,
            slug: true,
            score: true,
            category: true,
            images: true,
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread nicht gefunden" }, { status: 404 });
    }

    await prisma.forumThread.update({
      where: { id: thread.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      ...thread,
      viewCount: thread.viewCount + 1,
    });
  } catch (error) {
    console.error("GET /api/forum/threads/[slug] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch thread" },
      { status: 500 }
    );
  }
}
