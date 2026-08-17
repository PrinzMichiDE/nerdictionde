import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { forumCommentQuerySchema } from "@/lib/forum-schema";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = forumCommentQuerySchema.safeParse({
      threadId: searchParams.get("threadId") ?? "",
      page: searchParams.get("page") ?? 1,
      limit: searchParams.get("limit") ?? 50,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungültige Parameter", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { threadId, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.forumComment.findMany({
        where: { threadId, status: "approved" },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        select: {
          id: true,
          text: true,
          author: true,
          userId: true,
          isAiGenerated: true,
          createdAt: true,
        },
      }),
      prisma.forumComment.count({ where: { threadId, status: "approved" } }),
    ]);

    return NextResponse.json({ comments, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET /api/forum/threads/[slug]/comments error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
