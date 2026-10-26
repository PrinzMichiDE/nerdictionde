"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { PublicSeries } from "@/lib/review-series-schema";
import { SeriesCard } from "./SeriesCard";
import { SeriesSkeleton } from "./SeriesSkeleton";

interface SeriesListProps {
  series: PublicSeries[];
  nextCursor: string | null;
  currentParams: { q?: string; sort?: string; order?: string; type?: string };
}

export function SeriesList({ series, nextCursor, currentParams }: SeriesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLoadMore = () => {
    if (!nextCursor) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("cursor", nextCursor);
    router.push(`/serien?${params.toString()}`);
  };

  if (series.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Keine Serien gefunden</h2>
        <p className="text-muted-foreground">
          {currentParams.q
            ? `Keine Serien für "${currentParams.q}" gefunden.`
            : "Noch keine Serien vorhanden. Schau später wieder vorbei!"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {series.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>

      {nextCursor && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            className={cn(
              "px-6 py-3 border rounded-lg font-medium",
              "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "transition-colors"
            )}
          >
            Mehr laden
          </button>
        </div>
      )}
    </div>
  );
}