import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, ArrowRight, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { getSiteUrl, generateItemListSchema } from "@/lib/seo";
import { NewsSyncTrigger } from "@/components/news/NewsSyncTrigger";
import { NEWS_CATEGORIES, type NewsCategory } from "@/lib/news-sources";
import { cn } from "@/lib/utils";

const PER_PAGE = 20;

export const metadata: Metadata = {
  title: "News",
  description:
    "Aktuelle News aus der Nerd-Welt – Gaming, Filme & Serien, Hardware und Technik.",
  alternates: {
    canonical: "/news",
  },
  openGraph: {
    type: "website",
    title: "News | Nerdiction",
    description: "Aktuelle News aus der Nerd-Welt.",
    url: `${getSiteUrl()}/news`,
    siteName: "Nerdiction",
    locale: "de_DE",
  },
  twitter: {
    card: "summary",
    title: "News | Nerdiction",
    description: "Aktuelle News aus der Nerd-Welt.",
    images: [`${getSiteUrl()}/icon-512.png`],
  },
};

export const dynamic = "force-dynamic";

function buildNewsUrl({ category, page }: { category?: NewsCategory; page?: number }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/news?${qs}` : "/news";
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category: categoryParam, page: pageParam } = await searchParams;
  const category: NewsCategory | undefined = (NEWS_CATEGORIES as readonly string[]).includes(
    categoryParam || ""
  )
    ? (categoryParam as NewsCategory)
    : undefined;

  const where = { status: "published" as const, ...(category ? { category } : {}) };

  const total = await prisma.newsArticle.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, parseInt(pageParam || "1", 10) || 1), totalPages);

  const [articles, counts, allTotal] = await Promise.all([
    prisma.newsArticle.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.newsArticle.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: { _all: true },
    }),
    // Gesamtzahl ungefiltert: Das "Alle"-Badge zeigt immer den vollen Bestand.
    prisma.newsArticle.count({ where: { status: "published" } }),
  ]);

  const itemListSchema = generateItemListSchema(
    articles.map((a) => ({
      name: a.title,
      url: `${getSiteUrl()}/news/${a.slug}`,
    }))
  );

  const featured = page === 1 ? articles[0] : undefined;
  const rest = page === 1 ? articles.slice(1) : articles;

  const pageBtnClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-35";

  return (
    <div className="max-w-7xl mx-auto space-y-12 py-8 px-4">
      <NewsSyncTrigger />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-md bg-primary/10">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mt-1">
              News
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground text-lg md:text-xl max-w-3xl">
          Aktuelle Beiträge zu Gaming, Filmen & Serien, Hardware und Technik –
          basierend auf kuratierten Quellen.
        </p>
      </div>

      {/* Kategorien-Filter */}
      <nav
        aria-label="Kategorie filtern"
        className="flex items-center gap-1 overflow-x-auto pb-1"
      >
        <Link
          href={buildNewsUrl({ page })}
          data-active={!category}
          className="filter-tab inline-flex items-center whitespace-nowrap"
        >
          Alle
          <span className="filter-tab-count">{allTotal}</span>
        </Link>
        {NEWS_CATEGORIES.map((c) => {
          const count = counts.find((x) => x.category === c)?._count._all ?? 0;
          return (
            <Link
              key={c}
              href={buildNewsUrl({ category: c })}
              data-active={category === c}
              className="filter-tab inline-flex items-center whitespace-nowrap"
            >
              {c}
              <span className="filter-tab-count">{count}</span>
            </Link>
          );
        })}
      </nav>

      {articles.length === 0 ? (
        <p className="text-muted-foreground">Noch keine News verfügbar.</p>
      ) : (
        <div className="space-y-10">
          {/* Featured */}
          {featured && (
            <Link href={`/news/${featured.slug}`} className="block group">
              <Card className="overflow-hidden border border-border">
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {featured.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(featured.publishedAt), "dd. MMMM yyyy", { locale: de })}
                    </span>
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                      {featured.excerpt}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Weiterlesen <ArrowRight className="h-4 w-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`} className="block group">
                  <Card className="h-full border border-border">
                    <CardContent className="p-5 space-y-3 flex flex-col h-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {article.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(article.publishedAt), "dd.MM.yyyy", { locale: de })}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {article.excerpt}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Paginierung */}
          {totalPages > 1 && (
            <nav
              aria-label="Seitennavigation"
              className="mt-2 flex flex-col items-center gap-4 border-t border-border pt-8"
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href={buildNewsUrl({ category, page: page - 1 })}
                  aria-label="Vorherige Seite"
                  className={cn(pageBtnClass, page <= 1 && "pointer-events-none opacity-35")}
                  tabIndex={page <= 1 ? -1 : undefined}
                  aria-disabled={page <= 1}
                >
                  <ChevronLeft className="size-4" />
                </Link>
                <Link
                  href={buildNewsUrl({ category, page: page + 1 })}
                  aria-label="Nächste Seite"
                  className={cn(pageBtnClass, page >= totalPages && "pointer-events-none opacity-35")}
                  tabIndex={page >= totalPages ? -1 : undefined}
                  aria-disabled={page >= totalPages}
                >
                  <ChevronRight className="size-4" />
                </Link>
              </div>
              <p className="kicker text-muted-foreground" style={{ fontSize: "0.625rem" }}>
                Seite <span className="text-foreground">{String(page).padStart(2, "0")}</span> von{" "}
                <span className="text-foreground">{String(totalPages).padStart(2, "0")}</span>
              </p>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
