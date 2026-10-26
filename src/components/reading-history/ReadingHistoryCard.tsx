'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { ReadingHistoryEntry } from '@/types/reading-history';

interface ReadingHistoryCardProps {
  entry: ReadingHistoryEntry;
  onDelete: (reviewId: string) => void;
  isDeleting?: boolean;
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

function getCategoryLabel(category: string, isEn: boolean): string {
  const labels: Record<string, { de: string; en: string }> = {
    game: { de: 'Spiel', en: 'Game' },
    hardware: { de: 'Hardware', en: 'Hardware' },
    amazon: { de: 'Produkt', en: 'Product' },
    movie: { de: 'Film', en: 'Movie' },
    series: { de: 'Serie', en: 'Series' },
  };
  return labels[category]?.[isEn ? 'en' : 'de'] ?? category;
}

export function ReadingHistoryCard({
  entry,
  onDelete,
  isDeleting = false,
  isEn = false,
}: ReadingHistoryCardProps) {
  const { toast } = useToast();
  const { review, progress, lastReadAt } = entry;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(review.id);
  };

  const imageUrl = review.images?.[0] || '/placeholder-review.jpg';

  return (
    <article
      className={cn(
        'group relative flex flex-col sm:flex-row gap-4 p-4 bg-card border border-border rounded-xl',
        'transition-all duration-200 hover:border-primary/50 hover:shadow-lg',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Cover Image */}
      <Link
        href={`/reviews/${review.slug}`}
        className="relative flex-shrink-0 w-full sm:w-48 aspect-video rounded-lg overflow-hidden bg-muted"
        aria-label={`Zur Review: ${review.title}`}
      >
        <Image
          src={imageUrl}
          alt={review.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, 192px"
        />
        <span
          className={cn(
            'absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded-full',
            'bg-background/90 backdrop-blur-sm text-foreground'
          )}
        >
          {getCategoryLabel(review.category, isEn)}
        </span>
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0">
        <Link href={`/reviews/${review.slug}`} className="group">
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {review.title}
          </h3>
        </Link>

        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
          <time dateTime={lastReadAt}>
            {formatRelativeDate(lastReadAt, isEn)}
          </time>
          <span aria-hidden="true">•</span>
          <span className="font-medium text-primary">
            {progress}% {isEn ? 'read' : 'gelesen'}
          </span>
          {progress === 100 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 rounded-full">
              {isEn ? 'Completed' : 'Abgeschlossen'}
            </span>
          )}
        </div>

        {/* Score */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-mono font-bold text-lg text-foreground">{review.score}</span>
            <span className="text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={cn(
          'absolute top-3 right-3 p-1.5 rounded-full bg-background/80 backdrop-blur-sm',
          'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
          'transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive',
          'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          isDeleting && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={isEn ? 'Remove from history' : 'Aus Verlauf entfernen'}
        title={isEn ? 'Remove from history' : 'Aus Verlauf entfernen'}
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </article>
  );
}

export function ReadingHistoryCardSkeleton() {
  return (
    <article className="flex flex-col sm:flex-row gap-4 p-4 bg-card border border-border rounded-xl animate-pulse" aria-hidden="true">
      <div className="flex-shrink-0 w-full sm:w-48 aspect-video rounded-lg bg-muted" />
      <div className="flex flex-col flex-1 min-w-0 space-y-3">
        <div className="h-5 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
        <div className="h-4 w-1/3 bg-muted rounded" />
        <div className="h-6 w-20 bg-muted rounded" />
      </div>
    </article>
  );
}