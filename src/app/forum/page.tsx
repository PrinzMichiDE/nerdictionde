import prisma from "@/lib/prisma";
import { ForumThreadCard } from "@/components/forum/ForumThreadCard";
import { ForumCategoryFilter } from "@/components/forum/ForumCategoryFilter";
import { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";
import { MessageSquareText } from "lucide-react";

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

  const where = validCategory ? { category: validCategory } : {};

  const threads = await prisma.forumThread.findMany({
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
      lastActivityAt: true,
      createdAt: true,
      _count: { select: { comments: { where: { status: "approved" } } } },
    },
  });

  const totalThreads = await prisma.forumThread.count({ where });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <MessageSquareText className="size-8 text-primary" />
          <div>
            <span className="kicker text-primary">Community</span>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight">
              Forum
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Diskutiere über Gaming, Filme und Serien. Teile deine Meinung,
          stelle Fragen und tausche dich mit der Community aus.
        </p>
      </header>

      <ForumCategoryFilter activeCategory={validCategory} />

      <div className="space-y-3">
        {threads.length > 0 ? (
          threads.map((thread) => (
            <ForumThreadCard
              key={thread.id}
              title={thread.title}
              slug={thread.slug}
              category={thread.category}
              excerpt={thread.excerpt}
              author={thread.author}
              commentCount={thread._count.comments}
              viewCount={thread.viewCount}
              lastActivityAt={thread.lastActivityAt}
            />
          ))
        ) : (
          <div className="text-center py-16 border border-border rounded-md bg-card">
            <MessageSquareText className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              {validCategory
                ? "Keine Threads in dieser Kategorie."
                : "Noch keine Threads vorhanden."}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Schau später wieder vorbei!
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
