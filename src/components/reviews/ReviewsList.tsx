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
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "./ScoreBadge";
import { Star, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { TagFilter } from "./TagFilter";
import { Recommendations } from "./Recommendations";
import { trackSearch } from "@/lib/analytics";
import { useEffect } from "react";

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: {
    reviews: Review[];
  };
  reviews?: Review[]; // Legacy format support
  pagination?: PaginationData;
  meta?: {
    pagination?: PaginationData;
  };
}

export function ReviewsList() {
  const searchParams = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

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
        
        // Handle new API response format: { success: true, data: { reviews }, meta: { pagination } }
        let fetchedReviews: Review[] = [];
        if (data.success && data.data) {
          fetchedReviews = data.data.reviews || [];
          setPagination(data.meta?.pagination || null);
        } else {
          // Legacy format support
          fetchedReviews = data.reviews || [];
          setPagination(data.pagination || data.meta?.pagination || null);
        }
        setReviews(fetchedReviews);
        setFilteredReviews(fetchedReviews);

        // Track search
        if (query) {
          trackSearch(query, fetchedReviews.length);
        }
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

  const displayReviews = filteredReviews.length > 0 ? filteredReviews : reviews;
  const featuredReview = !hasActiveFilters() && page === "1" && displayReviews.length > 0 ? displayReviews[0] : null;
  const otherReviews = featuredReview ? displayReviews.slice(1) : displayReviews;

  return (
    <div className="space-y-10 pb-12 animate-fade-in">
      <div className="flex flex-col space-y-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Alle Reviews
        </h1>
        <p className="text-muted-foreground text-lg">
          Durchsuche unsere neuesten Tests zu Games und Hardware.
        </p>
      </div>

      <ReviewsFilter onViewChange={setView} currentView={view} />
      
      {/* Tag Filter */}
      {reviews.length > 0 && (
        <div className="pb-6 border-b">
          <TagFilter
            reviews={reviews}
            onFilterChange={setFilteredReviews}
            showCounts={true}
            maxTags={15}
          />
        </div>
      )}

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
          <div className="flex justify-center mb-4">
            <AlertCircle className="size-12 text-destructive" aria-hidden="true" />
          </div>
          <p className="text-destructive text-lg font-semibold">{error}</p>
          <p className="text-muted-foreground text-sm mt-2">
            Bitte versuche es später erneut.
          </p>
        </div>
      ) : reviews.length > 0 ? (
        <>
          {featuredReview && (
            <div className="mb-12">
              <Link href={`/reviews/${featuredReview.slug}`} className="group block">
                <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl border-2 shadow-2xl transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-primary/10">
                  {featuredReview.images?.[0] ? (
                    <Image
                      src={featuredReview.images[0]}
                      alt={featuredReview.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      priority
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <span className="text-muted-foreground">Kein Bild</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 p-6 md:p-10 space-y-4 w-full max-w-3xl">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary text-primary-foreground hover:bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Star className="size-3 fill-current" />
                        Featured Review
                      </Badge>
                      <Badge variant="outline" className="bg-background/50 backdrop-blur-md text-foreground border-foreground/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {featuredReview.category}
                      </Badge>
                    </div>
                    
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {featuredReview.title}
                    </h2>
                    
                    <p className="text-muted-foreground text-sm md:text-base lg:text-lg line-clamp-2 max-w-2xl font-medium">
                      {featuredReview.content.replace(/[#*`]/g, "").substring(0, 200)}...
                    </p>

                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <ScoreBadge score={featuredReview.score} className="size-12 md:size-14 text-lg md:text-xl border-2 border-background shadow-xl" />
                        <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">
                          Nerdiction Score
                        </span>
                      </div>
                      <span className="text-primary font-bold text-sm md:text-base group-hover:translate-x-2 transition-transform flex items-center gap-2">
                        Jetzt lesen <span className="text-xl">→</span>
                      </span>
                    </div>
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
          <div
            className={cn(
              "gap-6",
              view === "grid"
                ? "grid sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col"
            )}
          >
            {otherReviews.map((review, index) => (
              <div
                key={review.id}
                className={cn(
                  "animate-scale-in",
                  view === "list" && "w-full"
                )}
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: "both" }}
              >
                <ReviewCard review={review} variant={view} />
              </div>
            ))}
          </div>
          
          {pagination && (
            <ReviewsPagination 
              totalPages={pagination.totalPages} 
              currentPage={pagination.page} 
            />
          )}

          {/* Recommendations */}
          {!hasActiveFilters() && reviews.length > 0 && (
            <Recommendations
              allReviews={reviews}
              variant="trending"
              limit={6}
            />
          )}
        </>
      ) : (
        <div className="text-center py-24 border-2 border-dashed rounded-xl bg-muted/30">
          <div className="flex justify-center mb-4">
            {hasActiveFilters() ? (
              <Search className="size-12 text-muted-foreground/50" aria-hidden="true" />
            ) : (
              <Star className="size-12 text-muted-foreground/50" aria-hidden="true" />
            )}
          </div>
          <p className="text-muted-foreground text-lg font-semibold">
            {hasActiveFilters() ? "Keine Reviews gefunden" : "Keine Reviews vorhanden"}
          </p>
          <p className="text-muted-foreground/70 text-sm mt-2 max-w-md mx-auto">
            {hasActiveFilters()
              ? "Versuche andere Suchbegriffe oder Filter, um mehr Ergebnisse zu finden."
              : "Erstelle deinen ersten Review im Admin-Bereich."}
          </p>
          {hasActiveFilters() && (
            <Link
              href="/reviews"
              className="inline-block mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Alle Filter zurücksetzen →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
