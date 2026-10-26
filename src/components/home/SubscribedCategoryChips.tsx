'use client';

import { ReviewCategory } from '@prisma/client';
import Link from 'next/link';
import { useCategorySubscriptions } from '@/hooks/useCategorySubscriptions';
import { Badge } from '@/components/ui/badge';
import { Gamepad2, Monitor, Film, Tv } from 'lucide-react';

const CATEGORY_ICONS: Record<ReviewCategory, React.ComponentType<{ className?: string }>> = {
  GAMES: Gamepad2,
  HARDWARE: Monitor,
  MOVIES: Film,
  SERIES: Tv,
};

const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  GAMES: 'Games',
  HARDWARE: 'Hardware',
  MOVIES: 'Movies',
  SERIES: 'Series',
};

const CATEGORY_HREFS: Record<ReviewCategory, string> = {
  GAMES: '/suche?category=GAMES',
  HARDWARE: '/suche?category=HARDWARE',
  MOVIES: '/suche?category=MOVIES',
  SERIES: '/suche?category=SERIES',
};

export function SubscribedCategoryChips() {
  const { subscribedCategories, isLoading } = useCategorySubscriptions();

  if (isLoading || subscribedCategories.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Abonnierte Kategorien" className="flex flex-wrap gap-2">
      {subscribedCategories.map(category => {
        const Icon = CATEGORY_ICONS[category];
        return (
          <Link
            key={category}
            href={CATEGORY_HREFS[category]}
            className="inline-flex items-center gap-1.5"
          >
            <Badge variant="secondary" className="gap-1.5 px-2 py-1 h-auto">
              <Icon className="h-3 w-3" aria-hidden="true" />
              <span>{CATEGORY_LABELS[category]}</span>
            </Badge>
          </Link>
        );
      })}
    </nav>
  );
}