"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Highlighter } from "@/components/search/Highlighter";
import { ScoreBlock } from "@/components/shared/ScoreBlock";
import { Pagination } from "@/components/shared/Pagination";
import { Skeleton } from "@/components/shared/Skeleton";
import { getCategoryStyle } from "@/lib/review-category";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface ReviewWithTags {
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  category: string;
  score: number;
  content: string;
  content_en: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
  tags: Array<{ tag: { name: string; slug: string } }>;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SearchResultsProps {
  reviews: ReviewWithTags[];
  query: string;
  pagination: PaginationData | null;
  baseParams: {
    category?: string;
    minScore?: string;
    maxScore?: string;
    tags?: string[];
    sort?: string;
    // NEU: Erweiterte Filter für Pagination
    releaseDateFrom?: string;
    releaseDateTo?: string;
    minPrice?: string;
    maxPrice?: string;
    platforms?: string[];
    hasVideo?: boolean;
    hasDeal?: boolean;
    developer?: string;
    publisher?: string;
  };
}

export function SearchResults({
  reviews,
  query,
  pagination,
  baseParams,
}: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildUrl = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      Object.entries(baseParams).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            if (value.length > 0) params.set(key, value.join(","));
          } else if (typeof value === "boolean") {
            if (value) params.set(key, "true");
          } else {
            params.set(key, value);
          }
        }
      });
      return `?${params.toString()}`;
    },
    [searchParams, baseParams]
  );

  // Generate excerpt with highlight
  const getExcerpt = (content: string, maxLength = 160) => {
    if (!content) return "";
    const plainText = content
      .replace(/[#*_`\[\]()]/g, "")
      .replace(/\n+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (plainText.length <= maxLength) return plainText;
    return plainText.slice(0, maxLength).trim() + "…";
  };

  if (reviews.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <div className="space-y-6">
      {/* Results Grid */}
      <div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
        aria-label="Suchergebnisse"
      >
        {reviews.map((review) => (
          <article
            key={review.id}
            className="group block rounded-lg border border-border bg-card overflow-hidden hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <Link
              href={`/reviews/${review.slug}`}
              className="block"
              aria-label={`${review.title} öffnen`}
            >
              {review.images?.[0] && (
                <div className="aspect-[16/9] w-full bg-muted overflow-hidden relative">
                  <Image
                    src={review.images[0]}
                    alt={review.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute right-2 top-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.625rem] font-medium bg-[${getCategoryStyle(review.category).color}]/15 text-[${getCategoryStyle(review.category).color}] border-[${getCategoryStyle(review.category).color}]/30`}
                    >
                      {getCategoryStyle(review.category).label}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary">
                  <Highlighter text={review.title} query={query} className="inline" />
                </h3>

                <div className="flex items-baseline gap-2">
                  <ScoreBlock score={review.score} />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.createdAt), "dd.MM.yyyy", { locale: de })}
                  </span>
                </div>

                {query && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <Highlighter
                      text={getExcerpt(review.content)}
                      query={query}
                      className="inline"
                    />
                  </p>
                )}

                {review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                    {review.tags.slice(0, 4).map((t) => (
                      <Link
                        key={t.tag.slug}
                        href={`/suche?tags=${t.tag.slug}`}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[0.6875rem] text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => e.preventDefault()} // Let parent handle navigation
                      >
                        #{t.tag.name}
                      </Link>
                    ))}
                    {review.tags.length > 4 && (
                      <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
                        +{review.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(page) => router.push(buildUrl(page))}
          aria-label="Suchergebnisse Pagination"
        />
      )}
    </div>
  );
}