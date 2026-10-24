'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export type UseCollectionFollowReturn = {
  isFollowing: boolean;
  followersCount: number;
  isLoading: boolean;
  error: string | null;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  toggle: () => Promise<void>;
  refresh: () => Promise<void>;
};

/**
 * Hook für Collection Follow/Unfollow mit optimistischer UI
 * @param collectionId - ID der Collection
 * @param slug - Slug der Collection (für API-Calls)
 * @param initialFollowing - Initialer Follow-Status (aus SSR)
 * @param initialCount - Initialer Follower-Count (aus SSR)
 */
export function useCollectionFollow(
  collectionId: string,
  slug: string,
  initialFollowing: boolean,
  initialCount: number
): UseCollectionFollowReturn {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followersCount, setFollowersCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SSR-Werte bei Änderungen aktualisieren (z.B. nach Navigation)
  useEffect(() => {
    setIsFollowing(initialFollowing);
    setFollowersCount(initialCount);
  }, [initialFollowing, initialCount]);

  const apiCall = useCallback(
    async (method: 'POST' | 'DELETE'): Promise<{ followed: boolean; followersCount: number }> => {
      const res = await fetch(`/api/listen/${slug}/follow`, {
        method,
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      return res.json();
    },
    [slug]
  );

  const follow = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    // Optimistisches Update
    setIsFollowing(true);
    setFollowersCount((c) => c + 1);

    try {
      const result = await apiCall('POST');
      setFollowersCount(result.followersCount);
    } catch (err) {
      // Rollback
      setIsFollowing(false);
      setFollowersCount((c) => c - 1);
      const message = err instanceof Error ? err.message : 'Fehler beim Folgen';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, isLoading]);

  const unfollow = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    // Optimistisches Update
    setIsFollowing(false);
    setFollowersCount((c) => Math.max(0, c - 1));

    try {
      const result = await apiCall('DELETE');
      setFollowersCount(result.followersCount);
    } catch (err) {
      // Rollback
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
      const message = err instanceof Error ? err.message : 'Fehler beim Entfolgen';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiCall, isLoading]);

  const toggle = useCallback(async () => {
    if (isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  }, [isFollowing, follow, unfollow]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/listen/${slug}/follow-status`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
      }
    } catch {
      // Ignore refresh errors
    }
  }, [slug]);

  return {
    isFollowing,
    followersCount,
    isLoading,
    error,
    follow,
    unfollow,
    toggle,
    refresh,
  };
}