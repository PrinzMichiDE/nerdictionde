// ============================================
// UI Component — Recommendation Card (Home)
// ============================================

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecommendationItem } from '@/types/recommendations';

interface RecommendationCardProps {
  item: RecommendationItem;
  onDismiss: (reviewId: string, reason: 'not_interested' | 'already_read' | 'irrelevant') => void;
  variant?: 'home' | 'detail';
}

export function RecommendationCard({ item, onDismiss, variant = 'home' }: RecommendationCardProps) {
  const [dismissReason, setDismissReason] = useState<'not_interested' | 'already_read' | 'irrelevant' | null>(null);
  const [showDismissMenu, setShowDismissMenu] = useState(false);

  const review = item.review;
  const reason = item.reason;

  const handleDismissClick = (reason: 'not_interested' | 'already_read' | 'irrelevant') => {
    setDismissReason(reason);
    setShowDismissMenu(false);
    onDismiss(review.id, reason);
  };

  const dismissLabels: Record<'not_interested' | 'already_read' | 'irrelevant', string> = {
    not_interested: 'Nicht interessant',
    already_read: 'Bereits gelesen',
    irrelevant: 'Nicht relevant',
  };

  const formatCategory = (category: string): string => {
    const map: Record<string, string> = {
      game: 'Games',
      hardware: 'Hardware',
      amazon: 'Hardware',
      movie: 'Filme',
      series: 'Serien',
    };
    return map[category] || category;
  };

  return (
    <article className={cn(
      'group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm transition-all duration-200',
      'border border-gray-200 dark:border-gray-700',
      'hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700',
      variant === 'home' ? 'flex flex-col h-full' : 'w-72 flex-shrink-0'
    )}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {review.images.length > 0 ? (
          <Image
            src={review.images[0]}
            alt={review.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Category Badge */}
        <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-primary-600 text-white rounded-full">
          {formatCategory(review.category)}
        </span>

        {/* Score Badge */}
        <span className="absolute top-2 right-2 px-2 py-1 text-xs font-bold bg-black/70 text-white rounded-full backdrop-blur-sm">
          {review.score}
        </span>

        {/* Dismiss Button */}
        <div className="absolute top-2 right-2 hidden group-hover:block">
          <div className="relative">
            <button
              onClick={() => setShowDismissMenu(true)}
              className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              aria-label={`Empfehlung ausblenden: ${review.title}`}
              aria-expanded={showDismissMenu}
            >
              <XIcon className="w-4 h-4" />
            </button>
            
            {showDismissMenu && (
              <div className="absolute right-0 top-full mt-1 z-10 min-w-[140px]">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                  {(['not_interested', 'already_read', 'irrelevant'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => handleDismissClick(r)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" />
                      {dismissLabels[r]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn('p-3 flex flex-col', variant === 'home' ? 'flex-1' : '')}>
        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {review.title}
        </h3>

        {/* Reason Badge */}
        <div className="mb-2">
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mr-1.5" aria-hidden="true" />
            {reason.label}
          </span>
        </div>

        {variant === 'home' && review.metaDescription && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 flex-1 mb-2">
            {review.metaDescription}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500 mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
          {review.releaseDate && (
            <time dateTime={review.releaseDate.toISOString().split('T')[0]}>
              {new Date(review.releaseDate).getFullYear()}
            </time>
          )}
          {review.userRatingAvg !== null && review.userRatingAvg !== undefined && review.userRatingCount && review.userRatingCount > 0 && (
            <>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {review.userRatingAvg.toFixed(1)}
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}