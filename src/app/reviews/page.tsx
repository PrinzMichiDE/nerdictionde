import prisma from "@/lib/prisma";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { ScoreBlock } from "@/components/shared/ScoreBlock";
import { ScoreDistribution } from "@/components/reviews/ScoreDistribution";
import { CategoryChips } from "@/components/shared/CategoryChips";
import { EmptyState } from "@/components/shared/EmptyState";
import { getCategoryStyle, getScoreColor, getVerdict } from "@/lib/review-category";
import {
  generateBreadcrumbSchema,
  generateItemListSchema,
  getSiteUrl,
  SITE_NAME,
} from "@/lib/seo";
import type { Review } from "@/types/review";

const PAGE_SIZE = 12;

const CATEGORY_LABELS: Record<string, string> = {
  game: "Games",
  movie: "Filme",
  series: "Serien",
  hardware: "Hardware",
};

const SORTS = [
  { value: "date-desc", label: "Neueste zuerst" },
  { value: "score-desc", label: "Höchste Wertung" },
  { value: "score-asc", label: "Niedrigste Wertung" },
  { value: "title-asc", label: "Titel A–Z" },
  { value: "title-desc", label: "Titel Z–A" },
] as const;

const DATE_FILTERS = [
  { value: "all", label: "Gesamter Zeitraum" },
  { value: "7d", label: "Letzte 7 Tage" },
  { value: "30d", label: "Letzte 30 Tage" },
  { value: "90d", label: "Letzte 90 Tage" },
  { value: "year", label: "Dieses Jahr" },
] as const;

interface ReviewsPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    query?: string;
    dateFilter?: string;
    minScore?: string;
    maxScore?: string;
    page?: string;
  }>;
}

export const metadata: Metadata = {
  title: {
    absolute: `Alle Reviews | ${SITE_NAME}`,
  },
  description:
    "Alle unabhängigen Produkttests auf einen Blick: Games, Filme, Serien und Hardware. Jede Wertung transparent, ohne bezahlte Platzierungen.",
  alternates: {
    canonical: "/reviews",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "de_DE",
    url: `${getSiteUrl()}/reviews`,
    title: `Alle Reviews | ${SITE_NAME}`,
    description:
      "Alle unabhängigen Produkttests auf einen Blick: Games, Filme, Serien und Hardware. Jede Wertung transparent, ohne bezahlte Platzierungen.",
    images: [
      {
        url: `${getSiteUrl()}/icon-512.png`,
        width: 512,
        height: 512,
        alt: `${SITE_NAME} - Alle Reviews`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@nerdiction_de",
    title: `Alle Reviews | ${SITE_NAME}`,
    description:
      "Alle unabhängigen Produkttests auf einen Blick: Games, Filme, Serien und Hardware.",
    images: [`${getSiteUrl()}/icon-512.png`],
  },
};

export default async function ReviewsPage({
  searchParams,
}: ReviewsPageProps) {
  const params = await searchParams;
  const category = params.category || undefined;
  const sort = (params.sort || "date-desc") as string;
  const query = params.query || undefined;
  const dateFilter = (params.dateFilter || "all") as string;
  const minScore = params.minScore || undefined;
  const maxScore = params.maxScore || undefined;
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const where: Record<string, unknown> = { status: "published" };

  if (category) where.category = category;
  if (minScore || maxScore) {
    where.score = {};
    if (minScore) (where.score as Record<string, unknown>).gte = parseInt(minScore, 10);
    if (maxScore) (where.score as Record<string, unknown>).lte = parseInt(maxScore, 10);
  }
  if (dateFilter !== "all") {
    const now = new Date();
    let startDate = new Date();
    switch (dateFilter) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    where.createdAt = { gte: startDate };
  }
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { title_en: { contains: query, mode: "insensitive" } },
      { content: { contains: query, mode: "insensitive" } },
    ];
  }

  const [reviews, total, categoryCounts, scoreGroups] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: sortOrder(sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        score: true,
        images: true,
        createdAt: true,
      },
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({
      by: ["category"],
      where: { status: "published" },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["score"],
      where: { status: "published" },
      _count: { _all: true },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (page > totalPages && totalPages > 0) {
    notFound();
  }

  const categoryCountsMap: Record<string, number> = { all: total };
  for (const group of categoryCounts) {
    categoryCountsMap[group.category] = group._count._all;
  }

  const scoreDistribution = Array.from({ length: 10 }, () => 0);
  for (const group of scoreGroups) {
    const bucket = Math.min(9, Math.max(0, Math.floor((group.score || 0) / 10)));
    scoreDistribution[bucket] += group._count._all;
  }
  const distributionTotal = scoreDistribution.reduce((a, b) => a + b, 0);

  const topReviews = [...reviews]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  const itemListSchema = generateItemListSchema(
    reviews.map((r, index) => ({
      name: r.title,
      url: `${getSiteUrl()}/reviews/${r.slug}`,
      image: r.images?.[0],
    }))
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Startseite", url: `${getSiteUrl()}/` },
    { name: "Reviews", url: `${getSiteUrl()}/reviews` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="pb-16 space-y-12">
        {/* Header */}
        <header className="border-b border-border pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Alle Reviews
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {total} unabhängige Tests — Games, Filme, Serien, Hardware.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <CategoryChips
                categoryCounts={categoryCountsMap}
                totalCount={total}
              />
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <section className="rounded-lg border border-border bg-card">
          <div className="px-4 py-3 sm:px-6">
            <form action="/reviews" method="get" className="space-y-3">
              <input type="hidden" name="page" value="1" />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Kategorie
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { value: "", label: "Alle" },
                      { value: "game", label: "Games" },
                      { value: "movie", label: "Filme" },
                      { value: "series", label: "Serien" },
                      { value: "hardware", label: "Hardware" },
                    ].map((cat) => {
                      const active = (category ?? "") === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="submit"
                          name="category"
                          value={cat.value || undefined}
                          formAction="/reviews"
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sortierung
                  </span>
                  <select
                    name="sort"
                    className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={sort}
                  >
                    {SORTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Zeitraum
                  </span>
                  <select
                    name="dateFilter"
                    className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue={dateFilter}
                  >
                    {DATE_FILTERS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Score
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      name="minScore"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Min"
                      className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring tabular-nums"
                      defaultValue={minScore ?? ""}
                    />
                    <input
                      name="maxScore"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Max"
                      className="h-9 w-full rounded-sm border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring tabular-nums"
                      defaultValue={maxScore ?? ""}
                    />
                  </div>
                </label>
              </div>

              <div className="relative">
                <ArrowRight className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  name="query"
                  type="search"
                  placeholder="Titel suchen…"
                  className="w-full h-9 rounded-sm border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  defaultValue={query ?? ""}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                >
                  Filtern
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
                {(category || query || minScore || maxScore || dateFilter !== "all") && (
                  <Link
                    href="/reviews"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-muted-foreground bg-accent hover:bg-accent/80 rounded-full transition-colors"
                  >
                    Zurücksetzen
                  </Link>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Score Distribution */}
        {distributionTotal > 0 && (
          <ScoreDistribution data={scoreDistribution} total={distributionTotal} />
        )}

        {/* Top bewertet (Editorial Picks) */}
        {topReviews.length >= 2 && (
          <section className="border-t border-border pt-10">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <span className="kicker text-primary">02 · Redaktion</span>
                <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">
                  Top bewertet
                </h2>
              </div>
              <Link
                href="/reviews?sort=score-desc"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90 transition-colors"
              >
                Alle nach Wertung
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topReviews.map((review, i) => (
                <ReviewCardPreview
                  key={review.id}
                  review={review as Review}
                  rank={i + 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* Reviews Grid */}
        <section aria-label="Alle Reviews">
          {reviews.length === 0 && (
            <EmptyState
              title={query ? "Keine Ergebnisse" : "Noch keine Reviews"}
              description={
                query
                  ? `Keine Reviews für „${query}".`
                  : "Es sind noch keine Tests veröffentlicht. Schau später wieder vorbei."
              }
            />
          )}

          {reviews.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list" aria-label="Testübersicht">
              {reviews.map((review) => (
                <ReviewCardPreview key={review.id} review={review as Review} />
              ))}
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            aria-label="Seitennavigation"
            className="flex items-center justify-between gap-4 border-t border-border pt-6"
          >
            <span className="text-sm text-muted-foreground tabular-nums">
              {total} Review{total === 1 ? "" : "s"}
            </span>

            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link
                  href={buildUrl({ ...params, page: String(page - 1) })}
                  className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  aria-label="Vorherige Seite"
                >
                  Vorherige
                </Link>
              )}

              <span className="px-3 py-1.5 text-sm rounded-md border border-border bg-card tabular-nums">
                Seite {page} von {totalPages}
              </span>

              {page < totalPages && (
                <Link
                  href={buildUrl({ ...params, page: String(page + 1) })}
                  className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  aria-label="Nächste Seite"
                >
                  Nächste
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </>
  );
}

type SortDirection = "asc" | "desc";

function sortOrder(sort: string): Record<string, SortDirection> | Record<string, SortDirection>[] {
  switch (sort) {
    case "date-asc":
      return { createdAt: "asc" };
    case "score-desc":
      return { score: "desc", createdAt: "desc" };
    case "score-asc":
      return { score: "asc", createdAt: "desc" };
    case "title-asc":
      return { title: "asc" };
    case "title-desc":
      return { title: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

function buildUrl(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, value);
    }
  }
  return `/reviews?${searchParams.toString()}`;
}

function ReviewCardPreview({
  review,
  rank,
}: {
  review: Review;
  rank?: number;
}) {
  const style = getCategoryStyle(review.category);
  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="group block"
      aria-label={`${review.title}, ${review.score} von 100`}
    >
      <article className="review-card flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:border-primary/40">
        {review.images?.[0] && (
          <div className="relative aspect-[16/9] w-full bg-muted overflow-hidden shine">
            <Image
              src={review.images[0]}
              alt={review.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <span
              className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider"
              style={{ background: style.color }}
            >
              {style.label}
            </span>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-4">
          {rank && (
            <span className="font-serif text-[1.5rem] font-semibold text-muted-foreground/40 font-variant-numeric tabular-nums">
              {String(rank).padStart(2, "0")}
            </span>
          )}
          <div className="flex items-baseline justify-between gap-2">
            <span
              className="kicker text-[0.6875rem] font-medium"
              style={{ color: style.color }}
            >
              {style.label}
            </span>
            <span className="inline-flex items-baseline gap-1.5">
              <span
                className="font-serif text-lg font-semibold tabular-nums"
                style={{ color: getScoreColor(review.score) }}
              >
                {review.score}
              </span>
              <span className="text-xs text-muted-foreground">
                {getVerdict(review.score)}
              </span>
            </span>
          </div>

          <h3 className="font-serif text-xl font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary">
            {review.title}
          </h3>

          <div className="mt-auto flex items-baseline gap-2 border-t border-border pt-3 text-sm">
            <time dateTime={review.createdAt.toISOString()} className="text-muted-foreground tabular-nums">
              {formattedDate}
            </time>
            <span className="text-xs font-medium text-primary ml-auto">
              Weiterlesen
              <ArrowRight className="size-3.5 ml-1 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
