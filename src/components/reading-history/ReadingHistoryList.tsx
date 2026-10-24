'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { ReadingHistoryCard, ReadingHistoryCardSkeleton } from '@/components/reading-history/ReadingHistoryCard';
import { ClearHistoryDialog } from '@/components/reading-history/ClearHistoryDialog';
import type { ReadingHistoryEntry } from '@/types/reading-history';

interface ReadingHistoryListProps {
  initialData?: {
    items: ReadingHistoryEntry[];
    nextCursor: string | null;
  };
  isEn?: boolean;
}

export function ReadingHistoryList({ initialData, isEn = false }: ReadingHistoryListProps) {
  const {
    items,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
    deleteEntry,
    clearAll,
  } = useReadingHistory({ initialData });

  const [showClearDialog, setShowClearDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-label={isEn ? 'Loading history' : 'Lade Verlauf'}>
        {[...Array(5)].map((_, i) => <ReadingHistoryCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" role="alert">
        <p className="text-destructive mb-4" role="alert">
          {isEn ? 'Failed to load history' : 'Fehler beim Laden des Verlaufs'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 12a9 9 0 1 0 9-9.975L3 16M9 3v6h6" />
          </svg>
          {isEn ? 'Retry' : 'Erneut versuchen'}
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16" role="status">
        <svg className="mx-auto mb-4 size-16 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20M6.5 2a2.5 2.5 0 0 0 0 5H20" />
          <path d="M2 8h20" />
          <path d="M2 13h20" />
        </svg>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {isEn ? 'No reading history yet' : 'Noch kein Leseverlauf'}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {isEn
            ? 'Browse reviews to see them appear here. Your reading progress is tracked automatically when you spend time reading.'
            : 'Stöbere durch Reviews, um sie hier zu sehen. Dein Lesefortschritt wird automatisch erfasst, wenn du Zeit mit Lesen verbringst.'}
        </p>
        <Link
          href="/reviews"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10" />
          </svg>
          {isEn ? 'Browse Reviews' : 'Reviews entdecken'}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold" id="reading-history-heading">
          {isEn ? 'Reading History' : 'Leseverlauf'}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {items.length} {isEn ? 'entries' : 'Einträge'}
          </span>
          <button
            onClick={() => setShowClearDialog(true)}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg',
              'text-destructive hover:bg-destructive/10',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive',
              'transition-colors'
            )}
            aria-haspopup="dialog"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            {isEn ? 'Clear all' : 'Verlauf leeren'}
          </button>
        </div>
      </div>

      <section aria-labelledby="reading-history-heading" className="space-y-3">
        {items.map((entry) => (
          <ReadingHistoryCard
            key={entry.review.id}
            entry={entry}
            onDelete={deleteEntry}
            isDeleting={false} // Could track per-item deleting state if needed
            isEn={isEn}
          />
        ))}
      </section>

      {nextCursor && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 border border-border rounded-lg',
              'bg-background hover:bg-muted',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            aria-busy={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                {isEn ? 'Loading...' : 'Lade mehr...'}
              </>
            ) : (
              <>
                {isEn ? 'Load more' : 'Mehr laden'}
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      <ClearHistoryDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        onConfirm={clearAll}
        isEn={isEn}
      />
    </div>
  );
}