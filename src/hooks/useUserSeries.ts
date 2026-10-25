"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { CreateUserSeriesInput, UpdateUserSeriesInput, ReorderUserSeriesInput, AddUserSeriesItemInput } from "@/lib/user-series-schema";
import type { PublicSeries, UserSeriesEditData } from "@/lib/user-series-schema";

export type UseUserSeriesMutationsReturn = {
  createSeries: (input: CreateUserSeriesInput) => Promise<PublicSeries | null>;
  updateSeries: (slug: string, input: UpdateUserSeriesInput) => Promise<PublicSeries | null>;
  deleteSeries: (slug: string) => Promise<boolean>;
  reorderSeries: (slug: string, input: ReorderUserSeriesInput) => Promise<number | null>;
  addSeriesItem: (slug: string, input: AddUserSeriesItemInput) => Promise<number | null>;
  removeSeriesItem: (slug: string, reviewId: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
};

export function useUserSeriesMutations(): UseUserSeriesMutationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, defaultMessage: string): string => {
    const message = err instanceof Error ? err.message : defaultMessage;
    setError(message);
    toast.error(message);
    return message;
  };

  const createSeries = useCallback(async (input: CreateUserSeriesInput): Promise<PublicSeries | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/serien", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.errors
          ? Object.values(data.errors).flat().join(", ")
          : data.error || "Fehler beim Erstellen der Serie";
        throw new Error(errorMessage);
      }

      toast.success("Serie erfolgreich erstellt");
      return data.series;
    } catch (err) {
      handleError(err, "Fehler beim Erstellen der Serie");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSeries = useCallback(async (slug: string, input: UpdateUserSeriesInput): Promise<PublicSeries | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/serien/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Aktualisieren der Serie");
      }

      toast.success("Serie erfolgreich aktualisiert");
      return data.series;
    } catch (err) {
      handleError(err, "Fehler beim Aktualisieren der Serie");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSeries = useCallback(async (slug: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/serien/${slug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Löschen der Serie");
      }

      toast.success("Serie erfolgreich gelöscht");
      return true;
    } catch (err) {
      handleError(err, "Fehler beim Löschen der Serie");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reorderSeries = useCallback(async (slug: string, input: ReorderUserSeriesInput): Promise<number | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/serien/${slug}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Neusortieren");
      }

      toast.success("Reihenfolge aktualisiert");
      return data.version;
    } catch (err) {
      handleError(err, "Fehler beim Neusortieren");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addSeriesItem = useCallback(async (slug: string, input: AddUserSeriesItemInput): Promise<number | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/serien/${slug}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Hinzufügen des Reviews");
      }

      toast.success("Review zur Serie hinzugefügt");
      return data.seriesOrder;
    } catch (err) {
      handleError(err, "Fehler beim Hinzufügen des Reviews");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeSeriesItem = useCallback(async (slug: string, reviewId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/serien/${slug}/items/${reviewId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Entfernen des Reviews");
      }

      toast.success("Review aus der Serie entfernt");
      return true;
    } catch (err) {
      handleError(err, "Fehler beim Entfernen des Reviews");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createSeries,
    updateSeries,
    deleteSeries,
    reorderSeries,
    addSeriesItem,
    removeSeriesItem,
    isLoading,
    error,
  };
}

export type UseUserSeriesFollowReturn = {
  isFollowing: boolean;
  followersCount: number;
  isLoading: boolean;
  error: string | null;
  follow: () => Promise<void>;
  unfollow: () => Promise<void>;
  toggle: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useUserSeriesFollow(
  seriesId: string,
  slug: string,
  initialFollowing: boolean,
  initialCount: number
): UseUserSeriesFollowReturn {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [followersCount, setFollowersCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(
    async (method: "POST" | "DELETE"): Promise<{ followed: boolean; followersCount: number }> => {
      const res = await fetch(`/api/user/serien/${slug}/follow`, {
        method,
        headers: { "Content-Type": "application/json" },
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

    setIsFollowing(true);
    setFollowersCount((c) => c + 1);

    try {
      const result = await apiCall("POST");
      setFollowersCount(result.followersCount);
    } catch (err) {
      setIsFollowing(false);
      setFollowersCount((c) => c - 1);
      const message = err instanceof Error ? err.message : "Fehler beim Folgen";
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

    setIsFollowing(false);
    setFollowersCount((c) => Math.max(0, c - 1));

    try {
      const result = await apiCall("DELETE");
      setFollowersCount(result.followersCount);
    } catch (err) {
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
      const message = err instanceof Error ? err.message : "Fehler beim Entfolgen";
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
      const res = await fetch(`/api/user/serien/${slug}/follow`, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.followed);
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

export type UseUserSeriesCollaboratorsReturn = {
  collaborators: Array<{
    userId: string;
    username: string;
    displayName: string;
    role: "OWNER" | "EDITOR";
    invitedAt: string;
    acceptedAt: string | null;
  }>;
  isLoading: boolean;
  error: string | null;
  invite: (userId: string) => Promise<void>;
  updateRole: (userId: string, role: "OWNER" | "EDITOR") => Promise<void>;
  remove: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useUserSeriesCollaborators(
  slug: string,
  initialCollaborators: UseUserSeriesCollaboratorsReturn["collaborators"] = []
): UseUserSeriesCollaboratorsReturn {
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/serien/${slug}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators);
      }
    } catch {
      // Ignore refresh errors
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  const invite = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/serien/${slug}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "EDITOR" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Einladen");
      }

      toast.success("Einladung gesendet");
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Einladen";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [slug, refresh]);

  const updateRole = useCallback(async (userId: string, role: "OWNER" | "EDITOR") => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/serien/${slug}/collaborators/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Aktualisieren der Rolle");
      }

      toast.success("Rolle aktualisiert");
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Aktualisieren der Rolle";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [slug, refresh]);

  const remove = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/user/serien/${slug}/collaborators/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler beim Entfernen");
      }

      toast.success("Kollaborator entfernt");
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Entfernen";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [slug, refresh]);

  return {
    collaborators,
    isLoading,
    error,
    invite,
    updateRole,
    remove,
    refresh,
  };
}