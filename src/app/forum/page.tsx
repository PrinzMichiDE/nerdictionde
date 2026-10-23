import prisma from "@/lib/prisma";
import { ForumThreadCard } from "@/components/forum/ForumThreadCard";
import { ForumCategoryFilter } from "@/components/forum/ForumCategoryFilter";
import { ForumHeader } from "@/components/forum/ForumHeader";
import { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getServerSession } from "@/lib/session";
import { Search, MessageSquare, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Forum - Nerdiction",
  description:
    "Diskutiere über Gaming, Filme und Serien in der Nerdiction Community.",
  alternates: {
    canonical: `${getSiteUrl()}/forum`,
  },
  openGraph: {
    type: "website",
    title: "Forum - Nerdiction",
    description:
      "Diskutiere über Gaming, Filme und Serien in der Nerdiction Community.",
    url: `${getSiteUrl()}/forum`,
    siteName: "Nerdiction",
    locale: "de_DE",
  },
};

async function fetchThreads(
  validCategory?: string,
  search?: string,
  sort?: string
) {
  try {
    const where: Record<string, unknown> = {};
    if (validCategory) where.category = validCategory;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy: Record<string, unknown> = {};
    if (sort === "trending") {
      orderBy.score = "desc";
    } else if (sort === "comments") {
      orderBy.commentCount = "desc";
    } else if (sort === "views") {
      orderBy.viewCount = "desc";
    } else {
      orderBy.lastActivityAt = "desc";
    }

    const [threads, totalThreads, totalComments] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy,
        take: 50,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          excerpt: true,
          author: true,
          commentCount: true,
          viewCount: true,
          score: true,
          lastActivityAt: true,
          createdAt: true,
          _count: { select: { comments: { where: { status: "approved" } } } },
        },
      }),
      prisma.forumThread.count({ where }),
      prisma.forumComment.count({ where: { status: "approved" } }),
    ]);

    return { threads, totalThreads, totalComments };
  } catch {
    return { threads: [], totalThreads: 0, totalComments: 0 };
  }
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>;
}) {
  const { category, search, sort } = await searchParams;
  const validCategory =
    category && ["gaming", "movies", "series"].includes(category)
      ? category
      : undefined;

  const { threads, totalThreads, totalComments } = await fetchThreads(
    validCategory,
    search,
    sort
  );
  const session = await getServerSession();

  const hasFilter = validCategory || search || sort;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <ForumHeader
        isLoggedIn={!!session}
        displayName={session?.username ?? null}
      />

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="size-4" />
          <span>{totalThreads} {totalThreads === 1 ? "Thread" : "Threads"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Eye className="size-4" />
          <span>{totalComments >= 1000 ? `${(totalComments / 1000).toFixed(1)}k` : totalComments} {totalComments === 1 ? "Antwort" : "Antworten"}</span>
        </div>
      </div>

      {/* Search + Sort Bar */}
      <form action="/forum" method="get" className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            name="search"
            placeholder="Threads durchsuchen…"
            defaultValue={search}
            className="h-10 pl-9 rounded-sm"
            aria-label="Threads durchsuchen"
          />
        </div>
        <select
          name="sort"
          defaultValue={sort}
          className="h-10 px-3 rounded-sm border border-border bg-card text-sm text-muted-foreground appearance-none pr-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          aria-label="Sortierung"
        >
          <option value="">Aktuellste</option>
          <option value="trending">Beliebtste</option>
          <option value="comments">Meiste Antworten</option>
          <option value="views">Meiste Aufrufe</option>
        </select>
      </form>

      <ForumCategoryFilter activeCategory={validCategory} />

      {/* Thread List */}
      <div className="space-y-3">
        {threads.length > 0 ? (
          threads.map((thread, i) => (
            <ForumThreadCard
              key={thread.id}
              id={thread.id}
              title={thread.title}
              slug={thread.slug}
              category={thread.category}
              excerpt={thread.excerpt}
              author={thread.author}
              commentCount={thread._count.comments}
              viewCount={thread.viewCount}
              score={thread.score}
              lastActivityAt={thread.lastActivityAt}
              createdAt={thread.createdAt}
              isTrending={
                sort !== "trending" &&
                thread.score >= 5 &&
                thread.commentCount >= 3 &&
                i < 3
              }
            />
          ))
        ) : (
          <div className="text-center py-16 border border-border rounded-sm bg-card">
            <p className="text-muted-foreground font-medium">
              {hasFilter
                ? "Keine Threads gefunden."
                : "Noch keine Threads vorhanden."}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {session
                ? "Erstelle den ersten Thread!"
                : "Schau später wieder vorbei!"}
            </p>
          </div>
        )}
      </div>

      {totalThreads > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {totalThreads} {totalThreads === 1 ? "Thread" : "Threads"} gesamt
          {hasFilter && (
            <span> · {threads.length} angezeigt</span>
          )}
        </p>
      )}
    </div>
  );
}
