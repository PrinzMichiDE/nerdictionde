// ============================================
// UI Component — Recommendations Section (Home)
// ============================================

'use client';

import { RecommendationCard } from './RecommendationCard';
import { RecommendationSkeleton } from './RecommendationSkeleton';
import { useRecommendations } from '@/hooks/useRecommendations';
import type { RecommendationItem } from '@/types/recommendations';

interface RecommendationsSectionProps {
  title?: string;
  limit?: number;
}

export function RecommendationsSection({ title = 'Für dich empfohlen', limit = 10 }: RecommendationsSectionProps) {
  const { data, loading, error, fetch, dismiss, refetch } = useRecommendations({ 
    limit, 
    autoFetch: true 
  });

  if (error) {
    return (
      <section className="py-8" aria-labelledby="recs-error-heading">
        <h2 id="recs-error-heading" className="sr-only">{title} - Fehler</h2>
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Empfehlungen konnten nicht geladen werden</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error.message}</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (loading && !data) {
    return (
      <section className="py-8" aria-labelledby="recs-loading-heading">
        <h2 id="recs-loading-heading" className="sr-only">{title} - Lädt</h2>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Lädt...</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list" aria-label={`${title} (Skeletons)`}>
            {Array.from({ length: limit }).map((_, i) => (
              <RecommendationSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <section className="py-8" aria-labelledby="recs-empty-heading">
        <h2 id="recs-empty-heading" className="sr-only">{title} - Leer</h2>
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Keine Empfehlungen gefunden</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Interagiere mit Reviews (bewerten, bookmarken, folgen), um personalisierte Empfehlungen zu erhalten.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8" aria-labelledby="recs-heading">
      <h2 id="recs-heading" className="sr-only">{title}</h2>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Basiert auf deinen Bewertungen, Lesezeichen, Follows & Kategorien
            </span>
            <button
              onClick={refetch}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Empfehlungen aktualisieren"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
          role="list" 
          aria-label={title}
        >
          {data.recommendations.map((item, index) => (
            <RecommendationCard
              key={item.review.id}
              item={item}
              onDismiss={dismiss}
              variant="home"
            />
          ))}
        </div>

        {data.nextCursor && (
          <div className="mt-8 text-center">
            <button
              onClick={() => fetch({ cursor: data.nextCursor })}
              disabled={loading}
              className="px-6 py-3 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50"
            >
              Mehr laden
            </button>
          </div>
        )}

        {/* Strategy Info (Debug/Info) */}
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Strategie: <code className="font-mono">{data.strategy}</code>
        </p>
      </div>
    </section>
  );
}