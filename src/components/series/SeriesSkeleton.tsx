import { cn } from "@/lib/utils";

interface SeriesSkeletonProps {
  count?: number;
}

export function SeriesSkeleton({ count = 8 }: SeriesSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <article key={i} className={cn(
          "flex flex-col h-full bg-card border rounded-xl overflow-hidden animate-pulse"
        )}>
          <div className="aspect-video bg-muted" />
          <div className="flex-1 flex flex-col p-4 space-y-3">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="flex flex-wrap gap-2">
              <div className="h-6 bg-muted rounded px-3" />
              <div className="h-6 bg-muted rounded px-3" />
            </div>
            <div className="mt-auto h-10 bg-muted rounded w-full" />
          </div>
        </article>
      ))}
    </div>
  );
}