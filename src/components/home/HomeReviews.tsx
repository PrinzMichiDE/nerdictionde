"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Review } from "@/types/review";

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
      <section
        className="magazine-section magazine-reveal"
        style={{ "--reveal-delay": "200ms" } as React.CSSProperties}
        aria-labelledby="reviews-title"
      >
        <header className="magazine-section-header">
          <h2 id="reviews-title" className="magazine-section-title">Alle Tests</h2>
          <Link
            href="/reviews"
            className="magazine-section-link"
          >
            Alle Reviews
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </header>
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
    <section
      className="magazine-section magazine-reveal"
      style={{ "--reveal-delay": "200ms" } as React.CSSProperties}
      aria-labelledby="reviews-title"
    >
      <header className="magazine-section-header">
        <div>
          <h2 id="reviews-title" className="magazine-section-title">Alle Tests</h2>
          <p className="magazine-section-desc mt-2">
            Filtere nach Kategorie und sortiere nach Datum oder Wertung.
          </p>
        </div>
        <Link
          href="/reviews"
          className="magazine-section-link"
        >
          Alle Reviews
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </header>

      <div className="magazine-filter-bar" role="search" aria-label="Tests filtern">
        <div className="magazine-filter-group" role="group" aria-label="Kategorie">
          <MagazineFilterButton
            active={category === "all"}
            color="var(--foreground)"
            onClick={() => setCategory("all")}
            label="Alle"
            count={reviews.length}
          />
          {categories.map(([value, count]) => {
            const style = getCategoryStyle(value);
            return (
              <MagazineFilterButton
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

        <div className="magazine-filter-group" role="group" aria-label="Sortierung">
          {sorts.map((option) => (
            <MagazineFilterButton
              key={option.value}
              active={sort === option.value}
              color="var(--foreground)"
              onClick={() => setSort(option.value)}
              label={option.label}
            />
          ))}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {visible.length} {visible.length === 1 ? "Test" : "Tests"} angezeigt
      </p>

      <div className="magazine-review-grid" role="list" aria-label="Testübersicht">
        {visible.map((review) => (
          <MagazineReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  );
}

function MagazineFilterButton({
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
      className="magazine-filter-btn"
      style={{ "--tab-color": color } as React.CSSProperties}
    >
      {label}
      {count !== undefined && (
        <span className="magazine-filter-count tabular-nums opacity-60">{count}</span>
      )}
    </button>
  );
}

function MagazineReviewCard({ review }: { review: Review }) {
  const image = review.images?.[0];
  const style = getCategoryStyle(review.category);
  const catColor = style.color;

  return (
    <Link href={`/reviews/${review.slug}`} className="magazine-review-card group block" aria-label={`${review.title}, ${review.score} von 100`}>
      <div className="magazine-review-image relative aspect-[16/9] overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image}
            alt={review.title}
            fill
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Kein Bild
          </div>
        )}
        <span className="magazine-review-category" style={{ background: catColor }}>
          {style.label}
        </span>
      </div>

      <div className="magazine-review-content">
        <h3 className="magazine-review-title">{review.title}</h3>

        <div className="magazine-review-meta">
          <span
            className="magazine-review-score"
            style={{
              color: catColor,
              borderColor: `color-mix(in oklab, ${catColor} 30%, transparent)`,
              background: `color-mix(in oklab, ${catColor} 12%, transparent)`,
            } as React.CSSProperties}
          >
            {review.score}
          </span>
          <span className="magazine-review-verdict">
            {review.category === "game" ? "Game" : review.category === "movie" ? "Film" : review.category === "series" ? "Serie" : "Hardware"}
          </span>
        </div>
      </div>
    </Link>
  );
}