import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createForumCommentSchema } from "@/lib/forum-schema";
import { verifySession } from "@/lib/auth-twitch";
import { moderateForumComment } from "@/lib/forum-moderation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createForumCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { threadId, text, displayName } = parsed.data;

    const thread = await prisma.forumThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      return NextResponse.json({ error: "Thread nicht gefunden" }, { status: 404 });
    }

    const session = await verifySession(req);

    const comment = await prisma.forumComment.create({
      data: {
        threadId,
        text,
        author: displayName,
        userId: session?.userId ?? null,
        isAiGenerated: false,
        status: "pending",
      },
    });

    moderateForumComment(text).then(async (result) => {
      const newStatus = result.approved ? "approved" : "rejected";
      await prisma.forumComment.update({
        where: { id: comment.id },
        data: {
          status: newStatus,
          aiModerationNote: result.reason,
        },
      });

      if (result.approved) {
        await prisma.forumThread.update({
          where: { id: threadId },
          data: {
            commentCount: { increment: 1 },
            lastActivityAt: new Date(),
          },
        });
      }
    });

    return NextResponse.json({
      id: comment.id,
      status: "pending",
      message: "Kommentar wird geprüft und nach Freigabe angezeigt.",
    });
  } catch (error) {
    console.error("POST /api/forum/comments error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create comment" },
      { status: 500 }
    );
  }
}
