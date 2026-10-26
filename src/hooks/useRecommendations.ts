// ============================================
// Client Hooks — Recommendations
// ============================================

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { RecommendationResult, RecommendationItem } from '@/types/recommendations';

interface UseRecommendationsOptions {
  limit?: number;
  autoFetch?: boolean;
}

interface UseRecommendationsReturn {
  data: RecommendationResult | null;
  loading: boolean;
  error: Error | null;
  fetch: (options?: { limit?: number; cursor?: string }) => Promise<void>;
  dismiss: (reviewId: string, reason?: 'not_interested' | 'already_read' | 'irrelevant') => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing home page recommendations
 */
export function useRecommendations(
  options: UseRecommendationsOptions = {}
): UseRecommendationsReturn {
  const { limit = 10, autoFetch = true } = options;
  
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async (fetchOptions: { limit?: number; cursor?: string } = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (fetchOptions.limit) params.set('limit', fetchOptions.limit.toString());
      if (fetchOptions.cursor) params.set('cursor', fetchOptions.cursor);
      
      const response = await window.fetch(`/api/recommendations?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch recommendations');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const dismiss = useCallback(async (
    reviewId: string,
    reason: 'not_interested' | 'already_read' | 'irrelevant' = 'not_interested'
  ) => {
    try {
      const response = await window.fetch('/api/recommendations/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, reason }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to dismiss recommendation');
      }
      
      // Optimistic update - remove dismissed item
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          recommendations: prev.recommendations.filter(item => item.review.id !== reviewId),
        };
      });
    } catch (err) {
      // Revert optimistic update on error by refetching
      await doFetch();
      throw err;
    }
  }, []);

  const refetch = useCallback(() => doFetch({ limit }), [limit]);

  useEffect(() => {
    if (autoFetch) {
      doFetch({ limit });
    }
  }, [autoFetch, limit]);

  return { data, loading, error, fetch: doFetch, dismiss, refetch };
}

interface UseReviewRecommendationsOptions {
  limit?: number;
  autoFetch?: boolean;
}

interface UseReviewRecommendationsReturn {
  data: RecommendationResult | null;
  loading: boolean;
  error: Error | null;
  fetch: (reviewSlug: string, options?: { limit?: number }) => Promise<void>;
  refetch: (reviewSlug: string) => Promise<void>;
}

/**
 * Hook for fetching and managing review detail page recommendations
 */
export function useReviewRecommendations(
  options: UseReviewRecommendationsOptions = {}
): UseReviewRecommendationsReturn {
  const { limit = 5, autoFetch = true } = options;
  
  const [data, setData] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async (reviewSlug: string, fetchOptions: { limit?: number } = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (fetchOptions.limit) params.set('limit', fetchOptions.limit.toString());
      
      const response = await window.fetch(`/api/reviews/${reviewSlug}/recommendations?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch recommendations');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback((reviewSlug: string) => doFetch(reviewSlug, { limit }), [limit]);

  useEffect(() => {
    if (autoFetch) {
      // Note: autoFetch for review recommendations requires a reviewSlug
      // This would need to be set externally, so we don't auto-fetch by default
    }
  }, [autoFetch]);

  return { data, loading, error, fetch: doFetch, refetch };
}