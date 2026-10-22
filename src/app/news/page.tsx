import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { getSiteUrl, generateItemListSchema } from "@/lib/seo";
import { NewsSyncTrigger } from "@/components/news/NewsSyncTrigger";

export const metadata: Metadata = {
  title: "News",
  description:
    "Aktuelle, KI-erstellte News aus der Nerd-Welt – Gaming, Filme & Serien, Hardware und Technik. Stündlich aktualisiert aus ausgewählten RSS-Quellen.",
  alternates: {
    canonical: "/news",
  },
  openGraph: {
    type: "website",
    title: "News | Nerdiction",
    description: "Aktuelle News aus der Nerd-Welt – stündlich aktualisiert.",
    url: `${getSiteUrl()}/news`,
    siteName: "Nerdiction",
    locale: "de_DE",
  },
  twitter: {
    card: "summary",
    title: "News | Nerdiction",
    description: "Aktuelle News aus der Nerd-Welt – stündlich aktualisiert.",
  },
};

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const articles = await prisma.newsArticle.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    take: 60,
  });

  const itemListSchema = generateItemListSchema(
    articles.map((a) => ({
      name: a.title,
      url: `${getSiteUrl()}/news/${a.slug}`,
    }))
  );

  const [featured, ...rest] = articles;

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
            <span className="kicker text-primary">Nerdiction News</span>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mt-1">
              News
            </h1>
          </div>
        </div>
        <p className="text-muted-foreground text-lg md:text-xl max-w-3xl">
          Stündlich aktualisiert: KI-erstellte Beiträge zu den wichtigsten Meldungen
          aus Gaming, Filmen & Serien, Hardware und Technik – basierend auf kuratierten RSS-Quellen.
        </p>
      </div>

      {articles.length === 0 ? (
        <p className="text-muted-foreground">Noch keine News verfügbar.</p>
      ) : (
        <div className="space-y-10">
          {/* Featured */}
          {featured && (
            <Link href={`/news/${featured.slug}`} className="block group">
              <Card className="overflow-hidden transition-colors group-hover:border-primary/50">
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="secondary">{featured.category}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(featured.publishedAt), "dd. MMMM yyyy, HH:mm", { locale: de })}
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
                  <Card className="h-full transition-colors group-hover:border-primary/50">
                    <CardContent className="p-5 space-y-3 flex flex-col h-full">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">{article.category}</Badge>
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
                      {article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
