'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface QASkeletonProps {
  count?: number;
  className?: string;
}

export function QASkeleton({ count = 5, className }: QASkeletonProps) {
  return (
    <div className={`space-y-3 ${className || ''}`} role="status" aria-live="polite" aria-label="Fragen werden geladen">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}