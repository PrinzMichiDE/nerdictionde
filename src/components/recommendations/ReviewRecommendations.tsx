// ============================================
// UI Component — Review Detail Recommendations
// ============================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationSkeleton } from './RecommendationSkeleton';
import { useReviewRecommendations } from '@/hooks/useRecommendations';
import { cn } from '@/lib/utils';

interface ReviewRecommendationsProps {
  reviewSlug: string;
  limit?: number;
}

export function ReviewRecommendations({ reviewSlug, limit = 5 }: ReviewRecommendationsProps) {
  const { data, loading, error, fetch, refetch } = useReviewRecommendations({ limit, autoFetch: false });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch(reviewSlug);
  }, [fetch, reviewSlug]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const canScrollLeft = scrollContainerRef.current && scrollContainerRef.current.scrollLeft > 0;
  const canScrollRight = scrollContainerRef.current && 
    scrollContainerRef.current.scrollLeft + scrollContainerRef.current.clientWidth < scrollContainerRef.current.scrollWidth - 1;

  if (!mounted) {
    return (
      <section className="py-8" aria-labelledby="recs-loading-heading">
        <h2 id="recs-loading-heading" className="sr-only">Empfehlungen laden</h2>
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Auch interessant</h2>
          <div className="overflow-x-auto pb-4 -mx-4 px-4" role="list" aria-label="Auch interessant (Skeletons)">
            <div className="flex gap-4 min-w-max" style={{ width: 'max-content' }}>
              {Array.from({ length: limit }).map((_, i) => (
                <RecommendationSkeleton key={`skeleton-${i}`} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8" aria-labelledby="recs-error-heading">
        <h2 id="recs-error-heading" className="sr-only">Empfehlungen - Fehler</h2>
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Auch interessant</h2>
          <div className="text-center py-8">
            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Empfehlungen konnten nicht geladen werden</p>
            <button
              onClick={() => fetch(reviewSlug)}
              className="mt-4 px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return null; // Don't render anything if no recommendations
  }

  return (
    <section className="py-8" aria-labelledby="recs-heading">
      <h2 id="recs-heading" className="sr-only">Auch interessant</h2>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Auch interessant</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            Strategie: {data?.strategy}
          </span>
        </div>

        <div className="relative">
          <div
            ref={scrollContainerRef}
            className={cn(
              'overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide',
              'snap-x snap-mandatory'
            )}
            role="list"
            aria-label="Auch interessant"
          >
            <div className="flex gap-4 min-w-max" style={{ width: 'max-content' }}>
              {data.recommendations.map((item, index) => (
                <RecommendationCard
                  key={item.review.id}
                  item={item}
                  onDismiss={() => {}} // No dismiss on detail page
                  variant="detail"
                />
              ))}
            </div>
          </div>

          {/* Scroll Buttons */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Nach links scrollen"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100"
              aria-label="Nach rechts scrollen"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

