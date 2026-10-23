"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Review } from "@/types/review";

interface ReviewCounts {
  total: number;
  published: number;
  drafts: number;
}

interface AdminReviewsStore {
  reviews: Review[];
  counts: ReviewCounts;
  loading: boolean;
  error: string | null;
  reload: () => void;
  updateReview: (review: Review) => void;
  removeReview: (id: string) => void;
}

const AdminReviewsContext = createContext<AdminReviewsStore | null>(null);

function fetchAllReviews(): Promise<Review[]> {
  return fetch("/api/reviews?all=true")
    .then((res) => {
      if (!res.ok) throw new Error(`Fehler beim Laden (${res.status})`);
      return res.json();
    })
    .then((data) => (Array.isArray(data) ? data : (data.reviews || [])));
}

export function AdminReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchAllReviews()
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const updateReview = useCallback((review: Review) => {
    setReviews((prev) => prev.map((r) => (r.id === review.id ? review : r)));
  }, []);

  const removeReview = useCallback((id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const counts = useMemo<ReviewCounts>(
    () => ({
      total: reviews.length,
      published: reviews.filter((r) => r.status === "published").length,
      drafts: reviews.filter((r) => r.status === "draft").length,
    }),
    [reviews]
  );

  const value = useMemo<AdminReviewsStore>(
    () => ({ reviews, counts, loading, error, reload, updateReview, removeReview }),
    [reviews, counts, loading, error, reload, updateReview, removeReview]
  );

  return (
    <AdminReviewsContext.Provider value={value}>
      {children}
    </AdminReviewsContext.Provider>
  );
}

export function useAdminReviews() {
  const ctx = useContext(AdminReviewsContext);
  if (!ctx) {
    throw new Error("useAdminReviews must be used within an AdminReviewsProvider");
  }
  return ctx;
}
