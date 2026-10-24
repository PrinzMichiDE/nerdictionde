'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ReadingHistoryEntry } from '@/types/reading-history';

interface ReadingHistoryBadgeProps {
  initialData?: ReadingHistoryEntry | null;
  reviewId: string;
  className?: string;
  isEn?: boolean;
}

function formatRelativeDate(dateString: string, isEn: boolean): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return isEn ? 'just now' : 'gerade eben';
  if (diffMinutes < 60) return isEn ? `${diffMinutes}m ago` : `vor ${diffMinutes} Min.`;
  if (diffHours < 24) return isEn ? `${diffHours}h ago` : `vor ${diffHours} Std.`;
  if (diffDays < 7) return isEn ? `${diffDays}d ago` : `vor ${diffDays} Tagen`;
  return format(date, isEn ? 'MMM d, yyyy' : 'dd. MMMM yyyy', { locale: isEn ? undefined : de });
}

export function ReadingHistoryBadge({
  initialData,
  reviewId,
  className,
  isEn = false,
}: ReadingHistoryBadgeProps) {
  const [data, setData] = useState<ReadingHistoryEntry | null>(initialData ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/reading-history/${reviewId}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch {
        // Stillschweigend ignorieren - Badge ist optional
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [initialData, reviewId]);

  if (isLoading || !data || data.progress === 0) {
    return null;
  }

  const lastReadLabel = isEn ? 'Last read' : 'Zuletzt gelesen';
  const progressLabel = isEn ? 'read' : 'gelesen';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-sm',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={`${lastReadLabel}: ${formatRelativeDate(data.lastReadAt, isEn)}, ${data.progress}% ${progressLabel}`}
    >
      <svg
        className="size-4 text-muted-foreground shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span className="font-medium text-foreground">
        {lastReadLabel}: {formatRelativeDate(data.lastReadAt, isEn)}
      </span>
      <span className="text-muted-foreground" aria-hidden="true">•</span>
      <span className="font-medium text-primary" aria-label={`${data.progress}% ${progressLabel}`}>
        {data.progress}% {progressLabel}
      </span>
      {/* Optional: Progress-Ring für visuelle Darstellung */}
      <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted/30"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={`${(data.progress / 100) * 62.83} 62.83`}
          strokeDashoffset="62.83"
          strokeLinecap="round"
          className="text-primary transform -rotate-90 transition-all duration-500"
          style={{ transformOrigin: 'center' }}
        />
      </svg>
    </div>
  );
}

export function ReadingHistoryBadgeSkeleton() {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted animate-pulse" aria-hidden="true">
      <div className="w-4 h-4 bg-muted-foreground/30 rounded-full" />
      <div className="w-24 h-4 bg-muted-foreground/30 rounded" />
      <div className="w-2 bg-muted-foreground/30 rounded-full" />
      <div className="w-16 h-4 bg-muted-foreground/30 rounded" />
      <div className="w-4 h-4 bg-muted-foreground/30 rounded-full" />
    </div>
  );
}