import { NextRequest, NextResponse } from "next/server";
import { generateForumThreads, generateForumCommentsForThread } from "@/lib/forum-generation";
import prisma from "@/lib/prisma";

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(req: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const categories = ["gaming", "movies", "series"];
  const results: Record<string, { created: number; commentsAdded: number; errors: string[] }> = {};

  for (const category of categories) {
    const errors: string[] = [];
    let created = 0;
    let commentsAdded = 0;

    try {
      const gen = await generateForumThreads(category, 3);
      created = gen.created;
      errors.push(...gen.errors);

      const lowActivityThreads = await prisma.forumThread.findMany({
        where: { category, commentCount: { lt: 15 } },
        orderBy: { lastActivityAt: "desc" },
        take: 3,
      });

      for (const thread of lowActivityThreads) {
        try {
          const needed = Math.max(3, 12 - thread.commentCount);
          const res = await generateForumCommentsForThread(thread.id, needed);
          commentsAdded += res.created;
        } catch (e) {
          errors.push(`Kommentare für Thread "${thread.title}": ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch (e) {
      errors.push(`Kategorie ${category}: ${e instanceof Error ? e.message : String(e)}`);
    }

    results[category] = { created, commentsAdded, errors };
  }

  const totalCreated = Object.values(results).reduce((sum, r) => sum + r.created, 0);
  const totalComments = Object.values(results).reduce((sum, r) => sum + r.commentsAdded, 0);

  return NextResponse.json({
    message: `${totalCreated} neue Threads, ${totalComments} neue Kommentare`,
    results,
  });
}
