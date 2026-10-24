'use client';

import { useReadingHistoryTracker } from '@/hooks/useReadingHistoryTracker';

interface ReadingHistoryTrackerWrapperProps {
  reviewId: string;
  featureEnabled: boolean;
  children: React.ReactNode;
}

export function ReadingHistoryTrackerWrapper({
  reviewId,
  featureEnabled,
  children,
}: ReadingHistoryTrackerWrapperProps) {
  useReadingHistoryTracker({
    reviewId,
    featureEnabled,
  });

  return <>{children}</>;
}