"use client";

import { Skeleton } from "@/components/shared/Skeleton";

export function SearchSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Suchergebnisse laden">
      {/* Skeleton Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-[16/9] w-full rounded-sm" />
            <Skeleton className="h-4 w-3/4 rounded-sm" />
            <Skeleton className="h-4 w-1/2 rounded-sm" />
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-8 w-20 rounded-sm" />
              <Skeleton className="h-3 w-24 rounded-sm" />
            </div>
            <Skeleton className="h-3 w-full rounded-sm" />
            <Skeleton className="h-3 w-2/3 rounded-sm" />
          </div>
        ))}
      </div>

      {/* Skeleton Pagination */}
      <div className="flex items-center justify-center gap-1">
        <Skeleton className="h-8 w-8 rounded-sm" />
        <Skeleton className="h-8 w-8 rounded-sm" />
        <Skeleton className="h-8 w-8 rounded-sm" />
        <Skeleton className="h-8 w-20 rounded-sm" />
        <Skeleton className="h-8 w-8 rounded-sm" />
      </div>
    </div>
  );
}