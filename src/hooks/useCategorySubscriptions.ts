'use client';

import { useState, useCallback, useEffect } from 'react';
import { ReviewCategory } from '@prisma/client';
import { toast } from 'sonner';

interface UseCategorySubscriptionsReturn {
  subscribedCategories: ReviewCategory[];
  isLoading: boolean;
  toggleCategory: (category: ReviewCategory) => Promise<void>;
  refresh: () => Promise<void>;
}

const CATEGORY_LABELS: Record<ReviewCategory, string> = {
  GAMES: 'Games',
  HARDWARE: 'Hardware',
  MOVIES: 'Movies',
  SERIES: 'Series',
};

export function useCategorySubscriptions(): UseCategorySubscriptionsReturn {
  const [subscribedCategories, setSubscribedCategories] = useState<ReviewCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    try {
      const res = await fetch('/api/me/categories/subscriptions');
      if (res.status === 401) {
        setSubscribedCategories([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSubscribedCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleCategory = useCallback(async (category: ReviewCategory) => {
    const currentlySubscribed = subscribedCategories.includes(category);
    const newSubscribed = !currentlySubscribed;

    // Optimistic Update
    setSubscribedCategories(prev =>
      newSubscribed
        ? [...prev, category]
        : prev.filter(c => c !== category)
    );

    try {
      const method = newSubscribed ? 'POST' : 'DELETE';
      const url = newSubscribed
        ? '/api/me/categories/subscriptions'
        : `/api/me/categories/subscriptions/${category}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: newSubscribed ? JSON.stringify({ category }) : undefined,
      });

      if (!res.ok) throw new Error('Failed to toggle');

      toast.success(newSubscribed ? `${CATEGORY_LABELS[category]} abonniert` : `${CATEGORY_LABELS[category]} abbestellt`);
    } catch (err) {
      // Rollback
      setSubscribedCategories(prev =>
        currentlySubscribed
          ? [...prev, category]
          : prev.filter(c => c !== category)
      );
      toast.error('Fehler beim Speichern. Bitte versuche es erneut.');
    }
  }, [subscribedCategories]);

  // Initial fetch
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return { subscribedCategories, isLoading, toggleCategory, refresh: fetchSubscriptions };
}