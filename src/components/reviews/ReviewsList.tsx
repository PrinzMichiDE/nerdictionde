"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ReviewCard } from "./ReviewCard";
import { ReviewsFilter } from "./ReviewsFilter";
import { ReviewsPagination } from "./ReviewsPagination";
import { Review } from "@/types/review";
import { Skeleton } from "@/components/shared/Skeleton";
import Image from "next/image";
import Link from "next/link";
import { ScoreBadge } from "./ScoreBadge";

const categoryLabels: Record<string, string> = {
  game: "Games",
  movie: "Filme",
  series: "Serien",
};

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
}

export function ReviewsList() {
  const searchParams = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // All filter parameters from URL
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
        setReviews([]);
        setPagination(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReviews();
  }, [searchParams]);

  function hasActiveFilters() {
    return query || sort !== "date-desc" || dateFilter !== "all" || minScore || maxScore;
  }

  const featuredReview = !hasActiveFilters() && page === "1" && reviews.length > 0 ? reviews[0] : null;
  const otherReviews = featuredReview ? reviews.slice(1) : reviews;

  return (
    <div className="space-y-10 pb-12">
      <div className="border-b border-border pb-6">
        <span className="kicker text-primary">Das Magazin</span>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight mt-1">
          Alle Reviews
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Durchsuche unsere neuesten Reviews zu Games, Filmen und Serien.
        </p>
      </div>

      <ReviewsFilter />

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-4">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-24 border-2 border-destructive/20 rounded-xl bg-destructive/5">
          <p className="text-destructive text-lg font-medium">{error}</p>
          <p className="text-muted-foreground text-sm mt-2">
            Bitte versuche es später erneut.
          </p>
        </div>
      ) : reviews.length > 0 ? (
        <>
          {featuredReview && (
            <div className="mb-12">
              <Link href={`/reviews/${featuredReview.slug}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
                <div className="border-b border-border pb-5 mb-5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                    <span className="kicker text-primary">Featured</span>
                    <span className="text-muted-foreground" aria-hidden="true">·</span>
                    <span className="kicker text-muted-foreground">
                      {categoryLabels[featuredReview.category] || featuredReview.category}
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] group-hover:text-primary transition-colors line-clamp-2">
                    {featuredReview.title}
                  </h2>
                  <p className="text-muted-foreground text-sm md:text-base mt-3 line-clamp-2 max-w-2xl">
                    {featuredReview.content.replace(/[#*`]/g, "").substring(0, 200)}...
                  </p>
                </div>

                <div className="relative aspect-[21/9] w-full overflow-hidden rounded-md bg-muted">
                  {featuredReview.images?.[0] ? (
                    <Image
                      src={featuredReview.images[0]}
                      alt={featuredReview.title}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                      priority
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <span className="text-muted-foreground">Kein Bild</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                  <div className="absolute top-3 right-3 md:top-4 md:right-4 flex items-center gap-3">
                    <ScoreBadge score={featuredReview.score} className="h-12 w-12 md:h-14 md:w-14 text-lg md:text-xl border border-white/20" />
                  </div>

                  <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-black/60 px-3 py-1.5 rounded-sm">
                      Jetzt lesen
                      <span className="transition-transform group-hover:translate-x-0.5">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pagination?.total} {pagination?.total === 1 ? "Review gefunden" : "Reviews gefunden"}
              {pagination && pagination.totalPages > 1 && ` (Seite ${pagination.page} von ${pagination.totalPages})`}
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {otherReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          
          {pagination && (
            <ReviewsPagination 
              totalPages={pagination.totalPages} 
              currentPage={pagination.page} 
            />
          )}
        </>
      ) : (
        <div className="text-center py-24 border-2 border-dashed rounded-xl bg-muted/30">
          <p className="text-muted-foreground text-lg font-medium">
            {hasActiveFilters() ? "Keine Reviews gefunden." : "Keine Reviews vorhanden."}
          </p>
          <p className="text-muted-foreground/70 text-sm mt-2">
            {hasActiveFilters()
              ? "Versuche andere Suchbegriffe oder Filter."
              : "Erstelle deinen ersten Review im Admin-Bereich."}
          </p>
        </div>
      )}
    </div>
  );
}
