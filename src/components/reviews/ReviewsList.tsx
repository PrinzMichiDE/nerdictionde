"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Review } from "@/types/review";
import { ScoreBlock } from "@/components/shared/ScoreBlock";
import { ScoreDistribution } from "@/components/reviews/ScoreDistribution";
import { CategoryChips } from "@/components/shared/CategoryChips";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/shared/Skeleton";
import { Bookmark, ChevronDown, Search } from "lucide-react";

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  reviews: Review[];
  pagination: PaginationData;
  categoryCounts?: Record<string, number>;
  scoreDistribution?: number[];
}

const SORTS = [
  { value: "date-desc", label: "Neueste zuerst" },
  { value: "score-desc", label: "Höchste Wertung" },
  { value: "score-asc", label: "Niedrigste Wertung" },
];

export function ReviewsList() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [distribution, setDistribution] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams(searchParams.toString());
      const response = await fetch(`/api/reviews?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Fehler beim Laden der Reviews");
      }

      const data: ApiResponse = await response.json();
      setReviews(data.reviews);
      setPagination(data.pagination);
      setCategoryCounts(data.categoryCounts ?? {});
      setDistribution(data.scoreDistribution ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  let prevPageUrl = "";
  let nextPageUrl = "";
  if (pagination) {
    const baseParams = new URLSearchParams(searchParams.toString());
    if (pagination.hasPrev) {
      const p = new URLSearchParams(baseParams.toString());
      p.set("page", String(pagination.page - 1));
      prevPageUrl = "?" + p.toString();
    }
    if (pagination.hasNext) {
      const p = new URLSearchParams(baseParams.toString());
      p.set("page", String(pagination.page + 1));
      nextPageUrl = "?" + p.toString();
    }
  }

  const currentSort = searchParams.get("sort") || "date-desc";

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push("?" + params.toString());
  };

  // Filter by search query client-side
  const filteredReviews = searchQuery
    ? reviews.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category && r.category.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : reviews;

  // Top 3 highest-scoring reviews
  const topReviews = [...filteredReviews]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3);

  // Distribution always spans all published reviews (computed server-side)
  const distributionTotal = distribution.reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <div className="space-y-10 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="aspect-[16/9] w-full rounded-sm" />
              <Skeleton className="h-4 w-1/3 rounded-sm" />
              <Skeleton className="h-6 w-3/4 rounded-sm" />
              <Skeleton className="h-4 w-full rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Fehler beim Laden"
        description={error}
      />
    );
  }

  if (filteredReviews.length === 0) {
    return (
      <EmptyState
        title={searchQuery ? "Keine Ergebnisse" : "Noch keine Reviews"}
        description={searchQuery
          ? `Keine Reviews für „${searchQuery}".`
          : "Es sind noch keine Tests veröffentlicht. Schau später wieder vorbei."}
      />
    );
  }

  return (
    <div className="pb-16 space-y-12">
      {/* Header + Category Chips */}
      <div className="border-b border-border pb-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Reviews
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {pagination?.total ?? filteredReviews.length} unabhängige Tests — Games, Filme, Serien, Hardware.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CategoryChips
              categoryCounts={categoryCounts}
              totalCount={pagination?.total ?? filteredReviews.length}
            />

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Titel suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Sort toggle */}
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors shrink-0"
                aria-expanded={filterOpen}
                aria-label="Sortierung öffnen"
              >
                Sortieren
                <ChevronDown
                  className={`size-4 transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                  style={{ transition: "transform 0.2s ease" }}
                />
              </button>

              {filterOpen && (
                <div className="absolute right-0 top-12 z-10 rounded-lg border border-border bg-card p-3 shadow-lg sm:relative sm:top-0 sm:z-auto sm:shadow-none sm:rounded-sm sm:p-0">
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    <span className="text-xs font-medium text-muted-foreground">Sortierung</span>
                    {SORTS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setParam("sort", s.value)}
                        className={`text-left text-sm rounded-sm px-2 py-1.5 transition-colors ${
                          currentSort === s.value
                            ? "bg-accent text-foreground font-medium"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Score Distribution */}
      <ScoreDistribution data={distribution} total={distributionTotal} />

      {/* Top bewertet */}
      {topReviews.length >= 2 && (
        <section className="space-y-4">
          <span className="kicker text-primary">Beste Wertungen</span>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
            Top bewertet
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topReviews.map((review, i) => (
              <Link
                key={review.id}
                href={`/reviews/${review.slug}`}
                className="group block rounded-lg border border-border bg-card overflow-hidden hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <div className="flex items-stretch">
                  {review.images?.[0] && (
                    <div className="w-28 sm:w-32 shrink-0 bg-muted overflow-hidden">
                      <Image
                        src={review.images[0]}
                        alt={review.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="128px"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="kicker text-xs text-muted-foreground">
                        #{i + 1}
                      </span>
                      <span className="kicker text-xs text-muted-foreground">·</span>
                      <span className="kicker text-xs capitalize">{review.category}</span>
                    </div>
                    <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary">
                      {review.title}
                    </h3>
                    <div className="mt-auto flex items-center gap-2">
                      <ScoreBlock score={review.score} />
                      <span className="text-xs text-muted-foreground">
                        {review.score >= 90
                          ? "Phänomenal"
                          : review.score >= 80
                          ? "Hervorragend"
                          : review.score >= 70
                          ? "Gut"
                          : "Solide"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Grid */}
      <section aria-label="Alle Reviews">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredReviews.map((review) => (
            <Link
              key={review.id}
              href={`/reviews/${review.slug}`}
              className="block group"
            >
              <article className="border border-border rounded-lg bg-card p-4 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
                {review.images?.[0] && (
                  <div className="aspect-[16/9] w-full rounded-md bg-muted overflow-hidden mb-3">
                    <Image
                      src={review.images[0]}
                      alt={review.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="kicker inline-flex items-center gap-1 text-xs capitalize">
                    {review.category}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary leading-snug">
                  {review.title}
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <ScoreBlock score={review.score} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("de-DE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {review.bookmarkCount && review.bookmarkCount > 0 && (
                  <div className="mt-1 flex items-center gap-1">
                    <Bookmark className="size-3 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs font-medium text-muted-foreground tabular-nums">
                      {review.bookmarkCount} gespeichert
                    </span>
                  </div>
                )}
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-border pt-6">
          <span className="text-sm text-muted-foreground">
            {pagination.total} Reviews
          </span>
          <div className="flex items-center gap-1">
            {pagination.hasPrev && (
              <Link
                href={prevPageUrl}
                className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                aria-label="Vorherige Seite"
              >
                Vorherige
              </Link>
            )}
            <span className="px-3 py-1.5 text-sm rounded-md border border-border bg-card">
              Seite {pagination.page} von {pagination.totalPages}
            </span>
            {pagination.hasNext && (
              <Link
                href={nextPageUrl}
                className="px-3 py-1.5 text-sm rounded-md border border-border bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                aria-label="Nächste Seite"
              >
                Nächste
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
