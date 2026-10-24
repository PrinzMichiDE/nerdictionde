import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PublicSeries } from "@/lib/review-series-schema";

interface SeriesCardProps {
  series: PublicSeries;
}

export function SeriesCard({ series }: SeriesCardProps) {
  return (
    <article className={cn(
      "group relative flex flex-col h-full bg-card border rounded-xl overflow-hidden",
      "transition-shadow hover:shadow-lg"
    )}>
      {series.coverImage && (
        <Link href={`/serien/${series.slug}`} className="relative aspect-video overflow-hidden">
          <img
            src={series.coverImage}
            alt=""
            className={cn(
              "w-full h-full object-cover",
              "transition-transform duration-300 group-hover:scale-105"
            )}
            loading="lazy"
          />
        </Link>
      )}

      <div className="flex-1 flex flex-col p-4">
        <Link href={`/serien/${series.slug}`} className="group">
          <h3 className={cn(
            "font-semibold text-lg line-clamp-2 mb-2",
            "group-hover:text-primary transition-colors"
          )}>
            {series.title}
          </h3>
        </Link>

        {series.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
            {series.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {series.partCount} Teil{series.partCount !== 1 ? "e" : ""}
          </span>

          {series.aggregateScore !== null && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
              series.aggregateScore >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
              series.aggregateScore >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
              "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            )}>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Ø {series.aggregateScore}
            </span>
          )}
        </div>

        <Link
          href={`/serien/${series.slug}`}
          className={cn(
            "mt-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium",
            "bg-primary text-primary-foreground rounded-lg",
            "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-colors w-full"
          )}
        >
          Zur Serie
        </Link>
      </div>
    </article>
  );
}