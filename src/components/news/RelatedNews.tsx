import Link from "next/link";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface RelatedNewsProps {
  currentId: string;
  category: string;
}

export async function RelatedNews({
  currentId,
  category,
}: RelatedNewsProps) {
  const related = await prisma.newsArticle.findMany({
    where: {
      id: { not: currentId },
      category,
      status: "published",
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  if (related.length === 0) return null;

  return (
    <div className="space-y-8 pt-12 border-t border-border mt-12">
      <div className="border-b border-border pb-4">
        <span className="kicker text-primary">Weiterlesen</span>
        <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mt-1">
          Das könnte dich auch interessieren
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Weitere Beiträge aus der Kategorie{" "}
          <span className="capitalize font-semibold text-foreground">{category}</span>.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((article) => (
          <Link
            key={article.id}
            href={`/news/${article.slug}`}
            className="block group"
          >
            <div
              className="border border-border rounded-lg bg-card p-4 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span
                  className="kicker inline-flex items-center gap-1 text-xs capitalize"
                >
                  {article.category}
                </span>
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary leading-snug">
                {article.title}
              </h3>
              {article.excerpt && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {article.excerpt}
                </p>
              )}
              <div className="mt-auto flex items-baseline gap-2 text-xs text-muted-foreground">
                <span>
                  {format(new Date(article.publishedAt), "dd.MM.yyyy", {
                    locale: de,
                  })}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
