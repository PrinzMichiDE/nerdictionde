import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { forumThreadQuerySchema } from "@/lib/forum-schema";
import { z } from "zod";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();
}

const createThreadSchema = z.object({
  title: z.string().min(5, "Titel muss mindestens 5 Zeichen lang sein").max(120),
  content: z.string().min(10, "Inhalt muss mindestens 10 Zeichen lang sein").max(5000),
  category: z.enum(["gaming", "movies", "series"]),
  displayName: z.string().min(2).max(30),
});

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createThreadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validierung fehlgeschlagen", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, content, category, displayName } = parsed.data;

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.forumThread.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const thread = await prisma.forumThread.create({
      data: {
        title,
        slug,
        category,
        content,
        excerpt: content.substring(0, 160).replace(/\n/g, " ") + (content.length > 160 ? "..." : ""),
        author: displayName,
      },
    });

    return NextResponse.json({ id: thread.id, slug: thread.slug });
  } catch (error) {
    console.error("POST /api/forum/threads error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create thread" },
      { status: 500 }
    );
  }
}
