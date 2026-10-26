"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Review } from "@/types/review";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { getCategoryStyle } from "@/lib/review-category";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

type SortMode = "new" | "score";

const sorts: { value: SortMode; label: string }[] = [
  { value: "new", label: "Neueste" },
  { value: "score", label: "Beste Wertung" },
];

export function HomeReviews({ reviews }: { reviews: Review[] }) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortMode>("new");

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const review of reviews) {
      counts.set(review.category, (counts.get(review.category) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [reviews]);

  const visible = useMemo(() => {
    return reviews
      .filter((review) => category === "all" || review.category === category)
      .sort((a, b) =>
        sort === "score"
          ? b.score - a.score
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [reviews, category, sort]);

  if (reviews.length === 0) return null;

  if (visible.length === 0) {
    return (
      <section className="space-y-8">
        <EmptyState
          title="Keine Tests in dieser Kategorie"
          description="Versuche es mit einer anderen Kategorie oder sieh dir alle Tests an."
        />
        <Link
          href="/reviews"
          className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Alle Reviews
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            Alle Tests
          </h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Filtere nach Kategorie und sortiere nach Datum oder Wertung.
          </p>
        </div>
        <Link
          href="/reviews"
          className="group inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Alle Reviews
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="filter-bar sticky top-20 z-20">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-border py-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Kategorie">
            <FilterButton
              active={category === "all"}
              color="var(--foreground)"
              onClick={() => setCategory("all")}
              label="Alle"
              count={reviews.length}
            />
            {categories.map(([value, count]) => {
              const style = getCategoryStyle(value);
              return (
                <FilterButton
                  key={value}
                  active={category === value}
                  color={style.color}
                  onClick={() => setCategory(value)}
                  label={style.label}
                  count={count}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1.5" role="group" aria-label="Sortierung">
            {sorts.map((option) => (
              <FilterButton
                key={option.value}
                active={sort === option.value}
                color="var(--foreground)"
                onClick={() => setSort(option.value)}
                label={option.label}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" role="status">
        {visible.length} {visible.length === 1 ? "Test" : "Tests"} angezeigt
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}

function FilterButton({
  active,
  color,
  onClick,
  label,
  count,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-active={active}
      className="filter-tab"
      style={{ "--tab-color": color } as React.CSSProperties}
    >
      {label}
      {count !== undefined && (
        <span className="filter-tab-count tabular-nums opacity-60">{count}</span>
      )}
    </button>
  );
}
