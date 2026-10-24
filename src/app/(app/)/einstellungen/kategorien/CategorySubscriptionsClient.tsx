'use client';

import { useEffect, useState } from 'react';
import { ReviewCategory } from '@prisma/client';
import { CategorySubscriptionCard } from '@/components/settings/CategorySubscriptionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const ALL_CATEGORIES: ReviewCategory[] = ['GAMES', 'HARDWARE', 'MOVIES', 'SERIES'];

export function CategorySubscriptionsClient() {
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-live="polite">
        {ALL_CATEGORIES.map(cat => (
          <Card key={cat} className="h-24">
            <CardContent className="flex items-center justify-between p-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ALL_CATEGORIES.map(category => (
        <CategorySubscriptionCard key={category} category={category} />
      ))}
    </div>
  );
}