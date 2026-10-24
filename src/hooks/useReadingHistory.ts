'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ReadingHistoryResponse, ReadingHistoryEntry } from '@/types/reading-history';

interface UseReadingHistoryOptions {
  initialData?: ReadingHistoryResponse;
  onError?: (error: Error) => void;
}

interface UseReadingHistoryReturn {
  items: ReadingHistoryEntry[];
  nextCursor: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  deleteEntry: (reviewId: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export function useReadingHistory({
  initialData,
  onError,
}: UseReadingHistoryOptions): UseReadingHistoryReturn {
  const [items, setItems] = useState<ReadingHistoryEntry[]>(initialData?.items ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(initialData?.nextCursor ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (cursor?: string, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');

      const response = await fetch(`/api/reading-history?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Nicht authentifiziert');
        }
        throw new Error('Fehler beim Laden des Leseverlaufs');
      }

      const data: ReadingHistoryResponse = await response.json();

      if (append) {
        setItems((prev) => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setNextCursor(data.nextCursor);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unbekannter Fehler');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [onError]);

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [initialData, fetchData]);

  const loadMore = useCallback(async () => {
    if (nextCursor && !isLoadingMore) {
      await fetchData(nextCursor, true);
    }
  }, [nextCursor, isLoadingMore, fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const deleteEntry = useCallback(async (reviewId: string) => {
    // Optimistic update
    setItems((prev) => prev.filter((item) => item.review.id !== reviewId));

    try {
      const response = await fetch(`/api/reading-history/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Nicht authentifiziert');
        if (response.status === 404) throw new Error('Eintrag nicht gefunden');
        throw new Error('Fehler beim Löschen');
      }
    } catch (err) {
      // Rollback on error
      await fetchData();
      const error = err instanceof Error ? err : new Error('Unbekannter Fehler');
      setError(error);
      onError?.(error);
    }
  }, [fetchData, onError]);

  const clearAll = useCallback(async () => {
    // Optimistic update
    const previousItems = items;
    setItems([]);

    try {
      const response = await fetch('/api/reading-history', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Nicht authentifiziert');
        throw new Error('Fehler beim Leeren des Verlaufs');
      }
    } catch (err) {
      // Rollback on error
      setItems(previousItems);
      const error = err instanceof Error ? err : new Error('Unbekannter Fehler');
      setError(error);
      onError?.(error);
    }
  }, [items, onError]);

  return {
    items,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
    deleteEntry,
    clearAll,
  };
}