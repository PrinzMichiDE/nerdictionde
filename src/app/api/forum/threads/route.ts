import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { forumThreadQuerySchema } from "@/lib/forum-schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = forumThreadQuerySchema.safeParse({
      category: searchParams.get("category") ?? undefined,
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 20,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Parameter", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { category, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where = category ? { category } : {};

    const [threads, total] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy: { lastActivityAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          excerpt: true,
          author: true,
          commentCount: true,
          viewCount: true,
          lastActivityAt: true,
          createdAt: true,
          _count: { select: { comments: { where: { status: "approved" } } } },
        },
      }),
      prisma.forumThread.count({ where }),
    ]);

    return NextResponse.json({
      threads: threads.map((t) => ({
        ...t,
        commentCount: t._count.comments,
        _count: undefined,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/forum/threads error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch threads" },
      { status: 500 }
    );
  }
}
