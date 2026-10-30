// ============================================
// UI Component — Recommendations Section (Home)
// ============================================

'use client';

import { RecommendationCard } from './RecommendationCard';
import { RecommendationSkeleton } from './RecommendationSkeleton';
import { useRecommendations } from '@/hooks/useRecommendations';
import type { RecommendationItem } from '@/types/recommendations';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
      <section className="magazine-section magazine-reveal" aria-labelledby="recs-error-heading" style={{ "--reveal-delay": "200ms" } as React.CSSProperties}>
        <header className="magazine-section-header">
          <h2 id="recs-error-heading" className="magazine-section-title">{title}</h2>
        </header>
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <h3 className="font-serif text-xl font-semibold tracking-tight mb-2">Empfehlungen konnten nicht geladen werden</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{error.message}</p>
          <button
            onClick={refetch}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          >
            Erneut versuchen
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>
    );
  }

  if (loading && !data) {
    return (
      <section className="magazine-section magazine-reveal" aria-labelledby="recs-loading-heading" style={{ "--reveal-delay": "200ms" } as React.CSSProperties}>
        <header className="magazine-section-header">
          <h2 id="recs-loading-heading" className="magazine-section-title">{title}</h2>
          <span className="magazine-kicker">Personalisiert</span>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="list" aria-label={`${title} (Skeletons)`}>
          {Array.from({ length: limit }).map((_, i) => (
            <RecommendationSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.recommendations.length === 0) {
    return (
      <section className="magazine-section magazine-reveal" aria-labelledby="recs-empty-heading" style={{ "--reveal-delay": "200ms" } as React.CSSProperties}>
        <header className="magazine-section-header">
          <h2 id="recs-empty-heading" className="magazine-section-title">{title}</h2>
        </header>
        <div className="rounded-lg border border-border bg-card p-10 text-center max-w-lg mx-auto">
          <h3 className="font-serif text-xl font-semibold tracking-tight mb-2">Keine Empfehlungen gefunden</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bewerte Reviews, setze Lesezeichen oder folge Kategorien, um personalisierte Empfehlungen zu erhalten.
          </p>
          <Link
            href="/reviews"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:translate-x-1"
          >
            Zu den Reviews
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="magazine-section magazine-reveal" aria-labelledby="recs-heading" style={{ "--reveal-delay": "200ms" } as React.CSSProperties}>
      <header className="magazine-section-header">
        <div>
          <span className="magazine-kicker">Personalisiert</span>
          <h2 id="recs-heading" className="magazine-section-title">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
            Basiert auf deinen Bewertungen, Lesezeichen, Follows & Kategorien
          </span>
          <button
            onClick={refetch}
            className="p-2.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Empfehlungen aktualisieren"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </header>

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
        <div className="mt-10 text-center">
          <button
            onClick={() => fetch({ cursor: data.nextCursor })}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Mehr laden
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
    </section>
  );
}
