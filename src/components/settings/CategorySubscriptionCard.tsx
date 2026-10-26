'use client';

import { ReviewCategory } from '@prisma/client';
import { useCategorySubscriptions } from '@/hooks/useCategorySubscriptions';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
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

const CATEGORY_DESCRIPTIONS: Record<ReviewCategory, string> = {
  GAMES: 'Neue Game-Reviews: Indie, AAA, Early Access',
  HARDWARE: 'Hardware-Tests: GPUs, CPUs, Peripherie, Displays',
  MOVIES: 'Film-Reviews: Kino, Streaming, Physical Media',
  SERIES: 'Serien-Reviews: Staffeln, Episoden, Streaming',
};

interface CategorySubscriptionCardProps {
  category: ReviewCategory;
}

export function CategorySubscriptionCard({ category }: CategorySubscriptionCardProps) {
  const { subscribedCategories, toggleCategory, isLoading } = useCategorySubscriptions();
  const isSubscribed = subscribedCategories.includes(category);
  const Icon = CATEGORY_ICONS[category];

  return (
    <Card className="flex items-center justify-between p-4 gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Icon className="h-6 w-6 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="font-medium truncate">{CATEGORY_LABELS[category]}</h3>
          <p className="text-sm text-muted-foreground truncate">{CATEGORY_DESCRIPTIONS[category]}</p>
        </div>
      </div>
      <Switch
        role="switch"
        aria-checked={isSubscribed}
        aria-label={`${CATEGORY_LABELS[category]} ${isSubscribed ? 'abonniert' : 'nicht abonniert'}`}
        checked={isSubscribed}
        onCheckedChange={(checked: boolean) => toggleCategory(category)}
        disabled={isLoading}
        className="flex-shrink-0"
      />
    </Card>
  );
}