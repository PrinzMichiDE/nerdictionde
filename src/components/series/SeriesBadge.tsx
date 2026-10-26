"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReviewSeriesInfo } from "@/lib/review-series";

interface SeriesBadgeProps {
  seriesInfo: ReviewSeriesInfo;
}

export function SeriesBadge({ seriesInfo }: SeriesBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (seriesInfo.partCount < 2) return null;

  return (
    <div className="mb-4">
      <Link
        href={`/serien/${seriesInfo.seriesSlug}`}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border",
          "bg-secondary/50 hover:bg-secondary transition-colors"
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span className="font-medium text-sm">
          Teil {seriesInfo.seriesOrder} von {seriesInfo.partCount}: {seriesInfo.seriesTitle}
        </span>
      </Link>

      {showTooltip && seriesInfo.parts.length > 1 && (
        <div className="absolute z-10 mt-1 w-72 max-h-48 overflow-auto bg-popover border rounded-lg shadow-lg p-2 animate-in fade-in-0 zoom-in-95">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
            Alle Teile der Serie:
          </p>
          <nav aria-label="Serien-Teile">
            <ol className="space-y-1">
              {seriesInfo.parts.map((part, index) => (
                <li key={part.slug}>
                  <Link
                    href={`/reviews/${part.slug}`}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                      part.seriesOrder === seriesInfo.seriesOrder
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-accent text-foreground"
                    )}
                    aria-current={part.seriesOrder === seriesInfo.seriesOrder ? "step" : undefined}
                  >
                    <span className={cn(
                      "w-5 h-5 flex items-center justify-center text-xs font-bold rounded",
                      part.seriesOrder === seriesInfo.seriesOrder
                        ? "bg-primary-foreground/20"
                        : "bg-muted"
                    )}>
                      {part.seriesOrder}
                    </span>
                    <span className="truncate">{part.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}
    </div>
  );
}