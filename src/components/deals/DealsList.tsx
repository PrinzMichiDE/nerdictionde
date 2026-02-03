"use client";

import { useState, useEffect } from "react";
import { DealCard, DealData } from "./DealCard";
import { Skeleton } from "@/components/shared/Skeleton";

interface DealsListProps {
  category?: string;
  initialDeals?: DealData[];
}

export function DealsList({ category, initialDeals = [] }: DealsListProps) {
  const [deals, setDeals] = useState<DealData[]>(initialDeals);
  const [loading, setLoading] = useState(initialDeals.length === 0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "24");
    if (category) params.set("category", category);
    fetch(`/api/deals?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.deals) {
          setDeals((prev) => (page === 1 ? data.deals : [...prev, ...data.deals]));
          setHasMore(data.pagination?.hasNext ?? false);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, category]);

  if (loading && deals.length === 0) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed bg-muted/30 py-16 text-center text-muted-foreground">
        Keine Hardware- oder Gaming-Deals gefunden. Schau bald wieder vorbei!
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border-2 px-6 py-2 font-medium hover:bg-muted"
          >
            Mehr laden
          </button>
        </div>
      )}
    </div>
  );
}
