import prisma from "@/lib/prisma";
import { ForumThreadCard } from "@/components/forum/ForumThreadCard";
import { ForumCategoryFilter } from "@/components/forum/ForumCategoryFilter";
import { ForumHeader } from "@/components/forum/ForumHeader";
import { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";
import { getServerSession } from "@/lib/session";

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

async function fetchThreads(validCategory?: string) {
  try {
    const where = validCategory ? { category: validCategory } : {};

    const [threads, totalThreads] = await Promise.all([
      prisma.forumThread.findMany({
        where,
        orderBy: { lastActivityAt: "desc" },
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
    ]);

    return { threads, totalThreads };
  } catch {
    return { threads: [], totalThreads: 0 };
  }
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const validCategory =
    category && ["gaming", "movies", "series"].includes(category)
      ? category
      : undefined;

  const { threads, totalThreads } = await fetchThreads(validCategory);
  const session = await getServerSession();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <ForumHeader
        isLoggedIn={!!session}
        displayName={session?.username ?? null}
      />

      <ForumCategoryFilter activeCategory={validCategory} />

      <div className="space-y-3">
        {threads.length > 0 ? (
          threads.map((thread) => (
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
            />
          ))
        ) : (
          <div className="text-center py-16 border border-border rounded-md bg-card">
            <p className="text-muted-foreground font-medium">
              {validCategory
                ? "Keine Threads in dieser Kategorie."
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
        </p>
      )}
    </div>
  );
}
