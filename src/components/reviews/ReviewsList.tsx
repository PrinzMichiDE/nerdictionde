"use client";

import { useState, useEffect, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ReviewCard } from "./ReviewCard";
import { ReviewsFilter, type CategoryCounts } from "./ReviewsFilter";
import { ReviewsPagination } from "./ReviewsPagination";
import { ScoreDistribution } from "./ScoreDistribution";
import { TopPicks, type TopPick } from "./TopPicks";
import { ScrollReveal } from "@/components/home/ScrollReveal";
import { SpotlightCard } from "@/components/home/SpotlightCard";
import { CircularBadge } from "./CircularBadge";
import { ScoreRing } from "./ScoreRing";
import { StatCounter } from "./StatCounter";
import { Review } from "@/types/review";
import { Skeleton } from "@/components/shared/Skeleton";
import { ArrowRight, SearchX, AlertTriangle, RefreshCw, Clock3 } from "lucide-react";
import { getCategoryStyle, getVerdict, stripMarkdown } from "@/lib/review-category";

const verdictTickerItems = [
  "Phänomenal",
  "Hervorragend",
  "Gut",
  "Solide",
  "Mittelmaß",
  "Enttäuschend",
  "Unabhängig",
  "Redaktionstest",
  "Kaufberatung",
  "Fundiert",
];

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
  categoryCounts?: CategoryCounts;
  scoreDistribution?: number[];
  topPicks?: TopPick[];
}

const headline = "Reviews";

const subline =
  "Games, Filme und Serien – geprüft, bewertet und auf den Punkt gebracht. Der Nerdiction-Index bündelt jede Wertung auf einen Blick.";

function readingTime(content: string): number {
  return Math.max(1, Math.ceil((content || "").split(/\s+/).length / 200));
}

export function ReviewsList() {
  const searchParams = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCounts | null>(null);
  const [scoreDistribution, setScoreDistribution] = useState<number[] | null>(null);
  const [topPicks, setTopPicks] = useState<TopPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "date-desc";
  const minScore = searchParams.get("minScore") || "";
  const maxScore = searchParams.get("maxScore") || "";
  const dateFilter = searchParams.get("dateFilter") || "all";
  const page = searchParams.get("page") || "1";

  useEffect(() => {
    async function fetchReviews() {
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
        setCategoryCounts(data.categoryCounts ?? null);
        setScoreDistribution(data.scoreDistribution ?? null);
        setTopPicks(data.topPicks ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
        setReviews([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [searchParams, reloadKey]);

  function hasActiveFilters() {
    return (
      query ||
      category !== "all" ||
      sort !== "date-desc" ||
      dateFilter !== "all" ||
      minScore ||
      maxScore
    );
  }

  const activeFilterCount =
    (query ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (sort !== "date-desc" ? 1 : 0) +
    (dateFilter !== "all" ? 1 : 0) +
    (minScore || maxScore ? 1 : 0);

  const featuredReview = !hasActiveFilters() && page === "1" && reviews.length > 0 ? reviews[0] : null;
  const otherReviews = featuredReview ? reviews.slice(1) : reviews;

  const avgScore =
    reviews.length > 0
      ? Math.round((reviews.reduce((acc, r) => acc + (r.score || 0), 0) / reviews.length) * 10) / 10
      : 0;
  const bestScore = reviews.length > 0 ? Math.max(...reviews.map((r) => r.score || 0)) : 0;

  const renderStats = () => (
    <div className="flex flex-wrap gap-3 pt-2">
      {[
        {
          label: "Reviews",
          value: pagination ? (
            <StatCounter value={pagination.total} />
          ) : (
            <Skeleton className="h-8 w-16" />
          ),
        },
        {
          label: "Ø Wertung",
          value: reviews.length > 0 ? <StatCounter value={avgScore} decimals={1} /> : <span>–</span>,
        },
        {
          label: "Beste Wertung",
          value: reviews.length > 0 ? <StatCounter value={bestScore} /> : <span>–</span>,
        },
      ].map((stat) => (
        <div
          key={stat.label}
          className="stat-chip inline-flex items-baseline gap-2.5 rounded-sm border border-border bg-card/70 px-4 py-2.5"
        >
          <span className="font-serif text-2xl md:text-3xl font-semibold tabular-nums">
            {stat.value}
          </span>
          <span className="kicker text-muted-foreground" style={{ fontSize: "0.625rem" }}>
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );

  const renderTicker = () => (
    <div className="full-bleed overflow-hidden border-y border-border bg-muted/40 py-3">
      <div className="marquee" style={{ "--marquee-speed": "46s" } as CSSProperties}>
        <div className="marquee-track">
          {[0, 1].map((row) => (
            <div key={row} className="flex items-center">
              {verdictTickerItems.map((label, i) => (
                <span
                  key={`${row}-${label}-${i}`}
                  className="inline-flex items-center gap-3 px-5 font-serif text-sm md:text-base font-medium italic text-muted-foreground whitespace-nowrap"
                >
                  {label}
                  <span className="text-primary not-italic" aria-hidden="true">
                    ✦
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-16">
      {/* ======================= HERO ======================= */}
      <header className="relative overflow-hidden border-b border-border">
        <div
          className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
          aria-hidden="true"
        />
        <div
          className="bg-mesh absolute inset-0 opacity-70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -top-20 left-[15%] h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-aurora"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-[10%] h-80 w-80 rounded-full bg-chart-2/15 blur-3xl animate-aurora [animation-delay:6s]"
          aria-hidden="true"
        />
        <div className="noise pointer-events-none absolute inset-0 opacity-[0.045]" aria-hidden="true" />
        <div className="relative py-10 md:py-14 lg:py-16">
          <div className="flex items-start justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="kicker text-primary">Das Magazin</span>
                <span className="text-muted-foreground" aria-hidden="true">·</span>
                <span className="kicker text-muted-foreground">Unabhängige Tests & Kritiken</span>
              </div>

              <h1 className="mt-4 font-serif text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]">
                {headline.split("").map((ch, i) => (
                  <span
                    key={i}
                    className="hero-char"
                    style={{ animationDelay: `${120 + i * 45}ms` }}
                  >
                    {ch}
                  </span>
                ))}
                <span className="ml-4 align-top inline-flex items-center rounded-sm border border-primary/40 px-2.5 py-1 font-sans text-[0.625rem] md:text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  Index
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed text-balance">
                {subline.split(" ").map((word, i) => (
                  <span
                    key={i}
                    className="hero-word"
                    style={{ animationDelay: `${480 + i * 26}ms` }}
                  >
                    {word}
                    {i < subline.split(" ").length - 1 ? "\u00A0" : ""}
                  </span>
                ))}
              </p>

              {renderStats()}
            </div>

            <CircularBadge
              text="Nerdiction ✦ Reviews Index ✦ Nerdiction ✦ Reviews Index ✦"
              core="N"
              className="hidden lg:inline-flex mt-6 shrink-0 animate-float-y-slow"
            />
          </div>

          <div className="mt-10 flex items-center gap-4">
            <span className="hero-rule" aria-hidden="true" />
            <span className="kicker text-muted-foreground whitespace-nowrap" style={{ fontSize: "0.625rem" }}>
              Ausgabe {new Date().getFullYear()}
            </span>
            <span className="hero-rule" aria-hidden="true" />
          </div>
        </div>
      </header>

      {renderTicker()}

      {/* ======================= FILTER ======================= */}
      <ReviewsFilter categoryCounts={categoryCounts} />

      {/* ======================= CONTENT ======================= */}
      <div className="pt-10">
        {isLoading ? (
          <div className="space-y-12">
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5 space-y-4">
                <Skeleton className="skeleton-shimmer h-5 w-32 rounded-sm" />
                <Skeleton className="skeleton-shimmer h-10 w-full rounded-sm" />
                <Skeleton className="skeleton-shimmer h-4 w-3/4 rounded-sm" />
                <Skeleton className="skeleton-shimmer h-4 w-2/3 rounded-sm" />
              </div>
              <div className="lg:col-span-7">
                <Skeleton className="skeleton-shimmer aspect-[16/10] w-full rounded-sm" />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <Skeleton className="skeleton-shimmer aspect-[16/9] w-full rounded-sm" />
                  <Skeleton className="skeleton-shimmer h-4 w-1/3 rounded-sm" />
                  <Skeleton className="skeleton-shimmer h-6 w-3/4 rounded-sm" />
                  <Skeleton className="skeleton-shimmer h-4 w-full rounded-sm" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="py-24">
            <div className="mx-auto max-w-md rounded-sm border border-destructive/25 bg-destructive/5 p-10 text-center">
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full border border-destructive/30 text-destructive">
                <AlertTriangle className="size-6" />
              </div>
              <h2 className="font-serif text-2xl font-semibold">Ups, da lief etwas schief</h2>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RefreshCw className="size-4" />
                Erneut versuchen
              </button>
            </div>
          </div>
        ) : reviews.length > 0 ? (
          <>
            {/* Featured Spotlight */}
            {featuredReview && (
              <ScrollReveal variant="up">
                <SpotlightCard
                  tilt={true}
                  intensity={3}
                  className="gradient-border group mb-12 overflow-hidden rounded-sm border border-border bg-card"
                >
                  <div className="grid lg:grid-cols-12">
                    <div className="relative flex flex-col justify-between gap-6 border-b border-border p-6 md:p-8 lg:col-span-5 lg:border-b-0 lg:border-r">
                      <span
                        className="ghost-num absolute -top-2 right-4 text-[7rem] md:text-[9rem]"
                        aria-hidden="true"
                      >
                        01
                      </span>

                      <div className="relative">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="kicker text-primary">Featured</span>
                          <span className="text-muted-foreground" aria-hidden="true">·</span>
                          <span
                            className="kicker"
                            style={{
                              color: getCategoryStyle(featuredReview.category).color,
                            }}
                          >
                            {getCategoryStyle(featuredReview.category).label}
                          </span>
                        </div>

                        <h2 className="mt-3 font-serif text-3xl md:text-4xl font-semibold tracking-tight leading-[1.1] line-clamp-2 group-hover:text-primary transition-colors">
                          {featuredReview.title}
                        </h2>

                        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          <time
                            dateTime={
                              featuredReview.createdAt instanceof Date
                                ? featuredReview.createdAt.toISOString()
                                : featuredReview.createdAt
                            }
                          >
                            {new Date(featuredReview.createdAt).toLocaleDateString("de-DE", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </time>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3.5" />
                            {readingTime(featuredReview.content)} Min. Lesezeit
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-foreground">
                            {getVerdict(featuredReview.score)}
                          </span>
                        </div>

                        <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3">
                          {stripMarkdown(featuredReview.content || "").substring(0, 260)}…
                        </p>
                      </div>

                      <Link
                        href={`/reviews/${featuredReview.slug}`}
                        className="group/cta relative inline-flex w-fit items-center gap-2 rounded-sm bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Review lesen
                        <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" />
                      </Link>
                    </div>

                    <div className="relative lg:col-span-7">
                      <div className="spotlight relative h-full min-h-[280px] lg:min-h-full overflow-hidden bg-muted">
                        {featuredReview.images?.[0] ? (
                          <Image
                            src={featuredReview.images[0]}
                            alt={featuredReview.title}
                            fill
                            priority
                            unoptimized
                            sizes="(max-width: 1024px) 100vw, 58vw"
                            className="spotlight-img object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <span className="text-muted-foreground text-sm font-medium">
                              Kein Bild
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                        <div className="animate-pulse-glow absolute right-4 top-4 rounded-full">
                          <ScoreRing
                            score={featuredReview.score}
                            size={76}
                            ringWidth={5}
                            hole="oklch(0.16 0.004 90 / 0.85)"
                            showVerdict
                          />
                        </div>

                        <span className="spotlight-corner spotlight-corner-tl" aria-hidden="true" />
                        <span className="spotlight-corner spotlight-corner-br" aria-hidden="true" />

                        <div className="absolute bottom-4 left-4">
                          <span className="kicker inline-flex items-center gap-2 rounded-sm bg-black/60 px-2.5 py-1.5 text-[0.625rem] font-semibold text-white backdrop-blur-sm">
                            Nerdiction-Empfehlung
                            <span className="text-primary" aria-hidden="true">✦</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </SpotlightCard>
              </ScrollReveal>
            )}

            {/* Score Distribution */}
            {scoreDistribution && pagination && pagination.total > 0 && (
              <ScrollReveal variant="up" className="mb-10">
                <ScoreDistribution
                  data={scoreDistribution}
                  total={pagination.total}
                />
              </ScrollReveal>
            )}

            {/* Editorial Section Header */}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-2 border-b-2 border-foreground pb-3">
              <div>
                <span className="kicker text-primary">03 · {hasActiveFilters() ? "Suche" : "Der Index"}</span>
                <h2 className="mt-1 font-serif text-2xl md:text-3xl font-semibold tracking-tight">
                  {hasActiveFilters() ? "Suchergebnisse" : "Alle Reviews"}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-1">
                <span className="kicker text-muted-foreground" style={{ fontSize: "0.625rem" }}>
                  {pagination?.total} {pagination?.total === 1 ? "Review" : "Reviews"}
                  {pagination && pagination.totalPages > 1 && (
                    <> · Seite {pagination.page}/{pagination.totalPages}</>
                  )}
                </span>
                {activeFilterCount > 0 && (
                  <span className="kicker text-primary" style={{ fontSize: "0.625rem" }}>
                    {activeFilterCount}{" "}
                    {activeFilterCount === 1 ? "Filter aktiv" : "Filter aktiv"}
                  </span>
                )}
              </div>
            </div>

            {/* Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherReviews.map((review, index) => (
                <ScrollReveal
                  key={review.id}
                  variant="up"
                  delay={Math.min(index * 70, 420)}
                  className="h-full"
                >
                  <ReviewCard review={review} index={index} />
                </ScrollReveal>
              ))}
            </div>

            {pagination && (
              <ReviewsPagination
                totalPages={pagination.totalPages}
                currentPage={pagination.page}
              />
            )}

            {/* Editor's Picks */}
            {!hasActiveFilters() && topPicks.length > 0 && (
              <ScrollReveal variant="up" className="pt-4">
                <TopPicks picks={topPicks} />
              </ScrollReveal>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="py-24">
            <div className="mx-auto max-w-md rounded-sm border border-dashed border-border bg-muted/30 p-10 text-center">
              <div className="relative mx-auto mb-5 flex size-16 items-center justify-center">
                <div
                  className="animate-spin-slow absolute inset-0 rounded-full border border-dashed border-muted-foreground/40"
                  aria-hidden="true"
                />
                <div className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                  <SearchX className="size-5" />
                </div>
              </div>
              <h2 className="font-serif text-2xl font-semibold">
                {hasActiveFilters() ? "Keine Treffer" : "Noch keine Reviews"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {hasActiveFilters()
                  ? "Versuche andere Suchbegriffe oder lockere die Filter."
                  : "Schau bald wieder vorbei – die Redaktion arbeitet daran."}
              </p>
              {hasActiveFilters() && (
                <Link
                  href="/reviews"
                  className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Alle Filter zurücksetzen
                  <ArrowRight className="size-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
