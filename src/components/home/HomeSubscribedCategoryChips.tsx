'use client';

import { SubscribedCategoryChips } from '@/components/home/SubscribedCategoryChips';
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from '@/lib/feature-flags';

export function HomeSubscribedCategoryChips() {
  if (!FEATURE_CATEGORY_SUBSCRIPTIONS) {
    return null;
  }

  return (
    <div className="mt-8">
      <SubscribedCategoryChips />
    </div>
  );
}