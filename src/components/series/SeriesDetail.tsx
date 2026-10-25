"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PublicSeriesWithParts, PublicSeriesPart } from "@/lib/review-series-schema";
import { ShareButtons } from "@/components/ui/ShareButtons";

interface SeriesDetailProps {
  series: PublicSeriesWithParts;
}

export function SeriesDetail({ series }: SeriesDetailProps) {
  const [activeTab, setActiveTab] = useState<"all" | "reviews">("all");

  const filteredParts = series.parts.filter((part) => {
    if (activeTab === "all") return true;
    // "reviews" tab could filter out DLCs etc. in the future
    return true;
  });

  return (
    <article className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <header className="mb-8">
        {series.coverImage && (
          <div className="relative aspect-video w-full max-w-4xl mx-auto mb-6 rounded-xl overflow-hidden">
            <img
              src={series.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-4xl mx-auto text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {series.title}
          </h1>

          {series.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              {series.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {series.partCount} Teil{series.partCount !== 1 ? "e" : ""}
            </span>

            {series.aggregateScore !== null && (
              <span className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium text-sm",
                series.aggregateScore >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                series.aggregateScore >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              )}>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Ø {series.aggregateScore}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <Link
              href="/serien"
              className={cn(
                "inline-flex items-center gap-1 px-4 py-2 text-sm font-medium",
                "border rounded-lg hover:bg-accent transition-colors"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zur Übersicht
            </Link>
            <ShareButtons
              contentType="series"
              contentId={series.id}
              title={series.title}
              description={series.description || undefined}
              url={`/serien/${series.slug}`}
              image={series.coverImage || undefined}
              variant="inline"
            />
          </div>
        </div>
      </header>

      {/* Parts Navigation */}
      <nav aria-label="Serien-Teile" className="max-w-4xl mx-auto mb-8">
        <div role="tablist" className="border-b mb-6">
          <button
            role="tab"
            aria-selected={activeTab === "all"}
            aria-controls="panel-all"
            id="tab-all"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors",
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Alle Teile ({series.partCount})
          </button>
          {/* Future: DLC-only, Review-only tabs */}
        </div>

        <div role="tabpanel" id="panel-all" aria-labelledby="tab-all">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParts.map((part, index) => (
              <SeriesPartCard key={part.id} part={part} index={index + 1} />
            ))}
          </div>
        </div>
      </nav>

      {/* SEO: ItemList structured data is in metadata */}
    </article>
  );
}

interface SeriesPartCardProps {
  part: PublicSeriesPart;
  index: number;
}

function SeriesPartCard({ part, index }: SeriesPartCardProps) {
  return (
    <Link
      href={`/reviews/${part.slug}`}
      className={cn(
        "group flex flex-col h-full bg-card border rounded-xl overflow-hidden",
        "transition-shadow hover:shadow-lg"
      )}
    >
      {part.coverImage && (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={part.coverImage}
            alt=""
            className={cn(
              "w-full h-full object-cover",
              "transition-transform duration-300 group-hover:scale-105"
            )}
            loading="lazy"
          />
          <div className="absolute top-2 left-2">
            <span className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
              "bg-primary/90 text-primary-foreground backdrop-blur-sm"
            )}>
              {index}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        <h3 className={cn(
          "font-semibold text-lg mb-2 line-clamp-1",
          "group-hover:text-primary transition-colors"
        )}>
          {part.title}
        </h3>

        {part.category && (
          <span className={cn(
            "inline-block px-2 py-0.5 text-xs font-medium rounded mb-2",
            "bg-secondary text-secondary-foreground"
          )}>
            {part.category.charAt(0).toUpperCase() + part.category.slice(1)}
          </span>
        )}

        {part.releaseDate && (
          <time className="text-sm text-muted-foreground mb-2">
            {new Date(part.releaseDate).toLocaleDateString("de-DE", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}

        <div className="flex items-center gap-3 mb-3">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-sm",
            part.score >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
            part.score >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          )}>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {part.score}
          </span>

          <span className="text-sm text-muted-foreground">
            Teil {part.seriesOrder} von {part.seriesOrder} {/* total would need context */}
          </span>
        </div>

        {part.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
            {part.excerpt}
          </p>
        )}

        <span className={cn(
          "mt-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium",
          "bg-primary text-primary-foreground rounded-lg",
          "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "transition-colors w-full"
        )}>
          Review lesen
        </span>
      </div>
    </Link>
  );
}