'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ReviewReactionsResponse, ReactionType, ReactionCounts } from '@/types/review-reactions';

interface UseReviewReactionsOptions {
  reviewId: string;
  initialData?: ReviewReactionsResponse;
  onError?: (error: Error) => void;
}

interface UseReviewReactionsReturn {
  counts: ReactionCounts;
  total: number;
  myReaction: ReactionType | null;
  isLoading: boolean;
  isMutating: boolean;
  error: Error | null;
  toggleReaction: (type: ReactionType) => Promise<void>;
  removeReaction: (type: ReactionType) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useReviewReactions({
  reviewId,
  initialData,
  onError,
}: UseReviewReactionsOptions): UseReviewReactionsReturn {
  const [counts, setCounts] = useState<ReactionCounts>(initialData?.counts ?? {
    THUMBS_UP: 0,
    HEART: 0,
    PARTY: 0,
    THINKING: 0,
    CRY: 0,
    ANGRY: 0,
  });
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(initialData?.myReaction ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reviews/${reviewId}/reactions`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Fehler beim Laden der Reaktionen');
      const data = await response.json();
      setCounts(data.counts);
      setTotal(data.total);
      setMyReaction(data.myReaction);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unbekannter Fehler');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [reviewId, onError]);

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [initialData, fetchData]);

  const optimisticUpdate = (type: ReactionType, isAdding: boolean) => {
    const newCounts = { ...counts };
    const currentMyReaction = myReaction;

    if (isAdding) {
      newCounts[type] = (newCounts[type] ?? 0) + 1;
      setMyReaction(type);
    } else {
      newCounts[type] = Math.max(0, (newCounts[type] ?? 1) - 1);
      if (currentMyReaction === type) {
        setMyReaction(null);
      }
    }

    setCounts(newCounts);
    setTotal(Object.values(newCounts).reduce((sum, c) => sum + c, 0));
  };

  const toggleReaction = useCallback(async (type: ReactionType) => {
    const wasActive = myReaction === type;
    const isSwitching = myReaction !== null && !wasActive;

    // Optimistic update
    if (isSwitching) {
      // Switching from one reaction to another
      optimisticUpdate(myReaction!, false);
      optimisticUpdate(type, true);
    } else {
      optimisticUpdate(type, !wasActive);
    }

    setIsMutating(true);

    try {
      const method = wasActive ? 'DELETE' : 'POST';
      const url = wasActive
        ? `/api/reviews/${reviewId}/reactions?type=${type}`
        : `/api/reviews/${reviewId}/reactions`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: wasActive ? undefined : JSON.stringify({ type }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated - could trigger login modal
          throw new Error('Nicht authentifiziert');
        }
        throw new Error('Fehler beim Speichern der Reaktion');
      }

      const data = await response.json();
      setCounts(data.counts);
      setTotal(data.total);
      setMyReaction(data.myReaction);
      setError(null);
    } catch (err) {
      // Rollback optimistic update
      await fetchData();
      const error = err instanceof Error ? err : new Error('Unbekannter Fehler');
      setError(error);
      onError?.(error);
    } finally {
      setIsMutating(false);
    }
  }, [reviewId, myReaction, counts, fetchData, onError]);

  const removeReaction = useCallback(async (type: ReactionType) => {
    if (myReaction !== type) return;

    optimisticUpdate(type, false);
    setIsMutating(true);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/reactions?type=${type}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Fehler beim Entfernen der Reaktion');

      const data = await response.json();
      setCounts(data.counts);
      setTotal(data.total);
      setMyReaction(data.myReaction);
      setError(null);
    } catch (err) {
      await fetchData();
      const error = err instanceof Error ? err : new Error('Unbekannter Fehler');
      setError(error);
      onError?.(error);
    } finally {
      setIsMutating(false);
    }
  }, [reviewId, myReaction, fetchData, onError]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    counts,
    total,
    myReaction,
    isLoading,
    isMutating,
    error,
    toggleReaction,
    removeReaction,
    refresh,
  };
}