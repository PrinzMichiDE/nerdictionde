// ============================================
// UI Component — Recommendation Skeleton
// ============================================

import { cn } from '@/lib/utils';

export function RecommendationSkeleton({ className }: { className?: string } = {}) {
  return (
    <article className={cn(
      'bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm',
      'border border-gray-200 dark:border-gray-700',
      'animate-pulse',
      className
    )}>
      {/* Thumbnail Skeleton */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
      </div>

      {/* Content Skeleton */}
      <div className="p-3 space-y-3">
        {/* Title Skeleton */}
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />

        {/* Reason Badge Skeleton */}
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-full" />

        {/* Meta Description Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
        </div>

        {/* Meta Info Skeleton */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded flex items-center gap-1" />
        </div>
      </div>
    </article>
  );
}