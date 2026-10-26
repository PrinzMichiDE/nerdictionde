'use client';

import { useState } from 'react';
import { useReviewReactions } from '@/hooks/useReviewReactions';
import { REACTION_TYPES, REACTION_EMOJIS, REACTION_LABELS_DE, type ReactionType } from '@/types/review-reactions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReviewReactionsProps {
  reviewId: string;
  initialData?: {
    counts: Record<ReactionType, number>;
    total: number;
    myReaction: ReactionType | null;
  };
  className?: string;
  compact?: boolean;
}

export function ReviewReactions({
  reviewId,
  initialData,
  className,
  compact = false,
}: ReviewReactionsProps) {
  const { toast } = useToast();
  const [showLoginTooltip, setShowLoginTooltip] = useState<ReactionType | null>(null);

  const {
    counts,
    total,
    myReaction,
    isLoading,
    isMutating,
    error,
    toggleReaction,
  } = useReviewReactions({
    reviewId,
    initialData,
    onError: (err) => {
      toast({
        title: 'Fehler',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const isAuthenticated = typeof window !== 'undefined' && document.cookie.includes('twitch_session');

  const handleClick = async (type: ReactionType) => {
    if (!isAuthenticated) {
      setShowLoginTooltip(type);
      setTimeout(() => setShowLoginTooltip(null), 3000);
      return;
    }
    await toggleReaction(type);
  };

  const getAriaLabel = (type: ReactionType) => {
    const count = counts[type] ?? 0;
    const isActive = myReaction === type;
    const label = REACTION_LABELS_DE[type];
    if (isActive) {
      return `${count} Nutzer finden dies ${label.toLowerCase()}. Deine Reaktion: ${label}. Klicken zum Entfernen.`;
    }
    return `${count} Nutzer finden dies ${label.toLowerCase()}. Klicken um zu reagieren.`;
  };

  if (isLoading) {
    return <ReviewReactionsSkeleton compact={compact} />;
  }

  return (
    <div
      className={cn('flex flex-wrap items-center gap-1.5', compact && 'gap-1', className)}
      role="group"
      aria-label={`Reaktionen: insgesamt ${total}`}
    >
      {REACTION_TYPES.map((type) => {
        const count = counts[type] ?? 0;
        const isActive = myReaction === type;
        const isHovered = showLoginTooltip === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => handleClick(type)}
            disabled={isMutating || !isAuthenticated}
            className={cn(
              'relative inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              compact
                ? 'text-xs px-2 py-1'
                : 'text-sm',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              isHovered && !isAuthenticated && 'ring-2 ring-primary'
            )}
            aria-label={getAriaLabel(type)}
            aria-pressed={isActive}
            aria-live="polite"
            title={!isAuthenticated ? 'Anmelden zum Reagieren' : undefined}
          >
            <span
              className={cn(
                'transition-transform duration-150',
                isActive && 'scale-110',
                !isAuthenticated && 'cursor-help'
              )}
              aria-hidden="true"
            >
              {REACTION_EMOJIS[type]}
            </span>
            <span
              className={cn(
                'font-medium tabular-nums transition-colors',
                isActive ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
              aria-live="polite"
              aria-atomic="true"
            >
              {count}
            </span>
            {isHovered && !isAuthenticated && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-popover text-popover-foreground border rounded shadow-lg whitespace-nowrap z-10"
                role="tooltip"
              >
                Anmelden zum Reagieren
              </div>
            )}
          </button>
        );
      })}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        Insgesamt {total} Reaktionen. {myReaction ? `Deine Reaktion: ${REACTION_LABELS_DE[myReaction]}. ` : 'Keine eigene Reaktion.'}
      </span>
    </div>
  );
}

function ReviewReactionsSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', compact && 'gap-1')}>
      {REACTION_TYPES.map((type) => (
        <div
          key={type}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-muted animate-pulse',
            compact ? 'text-xs px-2 py-1' : 'text-sm'
          )}
          aria-hidden="true"
        >
          <span className="w-4 h-4 bg-muted-foreground/30 rounded-full" />
          <span className="w-6 h-4 bg-muted-foreground/30 rounded" />
        </div>
      ))}
    </div>
  );
}