import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/auth";
import { generateForumThreads, generateForumCommentsForThread } from "@/lib/forum-generation";

export async function POST(req: NextRequest) {
  const authError = requireAdminAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { category, count, threadId } = body;

    if (threadId) {
      const result = await generateForumCommentsForThread(threadId, count ?? 10);
      return NextResponse.json(result);
    }

    if (!category || !["gaming", "movies", "series"].includes(category)) {
      return NextResponse.json(
        { error: "Kategorie muss 'gaming', 'movies' oder 'series' sein" },
        { status: 400 }
      );
    }

    const result = await generateForumThreads(category, count ?? 5);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/forum/generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate" },
      { status: 500 }
    );
  }
}
