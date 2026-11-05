import type { Metadata } from "next";
import Link from "next/link";
import { BookMarked, Search, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { generateBreadcrumbSchema, getSiteUrl, SITE_NAME } from "@/lib/seo";
import prisma from "@/lib/prisma";
import { WIKI_CATEGORY_LABELS } from "@/lib/guide-sources";
import { GuideSyncTrigger } from "@/components/guides/GuideSyncTrigger";

export const metadata: Metadata = {
  title: {
    absolute: `Wiki | ${SITE_NAME}`,
  },
  description: "Nerdiction Wiki - Nachschlagewerk für Gaming, Technik und mehr.",
  alternates: {
    canonical: "/community/wiki",
  },
};

export const dynamic = "force-dynamic";

export default async function WikiPage() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Startseite", url: `${getSiteUrl()}/` },
    { name: "Community", url: `${getSiteUrl()}/forum` },
    { name: "Wiki", url: `${getSiteUrl()}/community/wiki` },
  ]);

  const [wikiEntries, counts] = await Promise.all([
    prisma.guide.findMany({
      where: { type: "wiki", status: "published" },
      orderBy: [{ order: "asc" }, { title: "asc" }],
      take: 50,
    }),
    prisma.guide.groupBy({
      by: ["category"],
      where: { type: "wiki", status: "published" },
      _count: { _all: true },
    }),
  ]);

  const categories = Object.entries(WIKI_CATEGORY_LABELS).map(([key, label]) => ({
    title: label,
    count: counts.find((c) => c.category === key)?._count._all || 0,
    href: `/community/wiki?category=${key}`,
  }));

  return (
    <>
      <GuideSyncTrigger />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="magazine-bg" aria-hidden="true" />

      <div className="max-w-6xl mx-auto pb-16">
        <header className="mb-10">
          <nav aria-label="Brotkrumen-Navigation" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary">Startseite</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/forum" className="hover:text-primary">Community</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground/80">Wiki</li>
            </ol>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookMarked className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
                Wiki
              </h1>
              <p className="text-muted-foreground mt-1">
                Nachschlagewerk für Begriffe, Konzepte und Technologien
              </p>
            </div>
          </div>
        </header>

        <section className="mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Wiki durchsuchen..."
              className="w-full h-12 rounded-lg border border-border bg-card pl-12 pr-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 ml-1">Suche wird in Kürze verfügbar sein</p>
        </section>

        <section className="mb-12">
          <h2 className="font-serif text-xl font-semibold mb-4">Kategorien</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link key={cat.title} href={cat.href}>
                <Card className="hover:border-primary/40 transition-colors h-full">
                  <CardContent className="p-4 flex items-center justify-between">
                    <span className="font-medium">{cat.title}</span>
                    <span className="text-xs text-muted-foreground">{cat.count} Einträge</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {wikiEntries.length > 0 && (
          <section className="mb-12">
            <h2 className="font-serif text-xl font-semibold mb-4">Alle Einträge</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {wikiEntries.map((entry) => (
                <Link key={entry.id} href={`/community/wiki/${entry.slug}`}>
                  <Card className="hover:border-primary/40 transition-colors h-full">
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-1">{entry.title}</h3>
                      {entry.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{entry.excerpt}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {wikiEntries.length === 0 && (
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/30">
            <CardContent className="p-8 text-center">
              <BookMarked className="size-10 text-primary mx-auto mb-4" />
              <h2 className="font-serif text-xl font-semibold mb-2">Wiki wird aufgebaut</h2>
              <p className="text-muted-foreground mb-4">
                Noch keine Einträge vorhanden. Führe den Sync aus, um Inhalte zu generieren.
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/community/guides" className="inline-flex items-center gap-2 text-primary hover:underline">
                  Zu den Guides
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
