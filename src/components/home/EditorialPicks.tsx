"use client";

import Link from "next/link";
import type { Review } from "@/types/review";
import { getCategoryStyle, getVerdict } from "@/lib/review-category";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const RANKS = [
  { label: "rank-gold", medal: "1" },
  { label: "rank-silver", medal: "2" },
  { label: "rank-bronze", medal: "3" },
] as const;

interface EditorialPicksProps {
  reviews: Review[];
}

export function EditorialPicks({ reviews }: EditorialPicksProps) {
  const picks = [...reviews]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (picks.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          Redaktionstipps
        </h2>
        <Link
          href="/reviews?sort=score"
          className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Alle Bestbewerteten
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid gap-4 md:flex md:flex-col md:gap-6">
        {picks.map((review, index) => {
          const rank = RANKS[index];
          const style = getCategoryStyle(review.category);
          const isTop = index === 0;

          return (
            <Link
              key={review.id}
              href={`/reviews/${review.slug}`}
              className={cn(
                "group relative flex items-center gap-3 rounded-sm border border-border bg-card overflow-hidden",
                isTop
                  ? "border-primary/60 shadow-lg shadow-primary/10"
                  : "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300",
              )}
              aria-label={`Platz ${index + 1}: ${review.title}, ${review.score} von 100`}
            >
              <div
                className={cn(
                  "relative shrink-0 size-12 md:size-14 rounded-sm border border-border bg-background flex items-center justify-center z-10",
                  rank && `bg-[${rank.label}] text-[${getScoreColor(review.score)}]`,
                )}
              >
                <span
                  className="font-serif font-bold text-base md:text-xl tabular-nums leading-none"
                  aria-hidden="true"
                >
                  {rank?.medal ?? index + 1}
                </span>
                <span className="sr-only">Platz {index + 1}</span>
              </div>

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: style.dot }}
                    aria-hidden="true"
                  />
                  <span className="kicker text-xs font-semibold uppercase tracking-wider" style={{ color: style.color }}>
                    {style.label}
                  </span>
                </div>
                <h3
                  className="font-serif text-lg font-semibold leading-snug line-clamp-1 md:text-xl transition-colors group-hover:text-primary"
                  title={review.title}
                >
                  {review.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {getVerdict(review.score)} · {review.score} von 100
                </p>
              </div>

              <div className="ml-auto shrink-0 flex items-center gap-2">
                <span className="font-serif text-xl font-semibold tabular-nums text-muted-foreground group-hover:text-foreground transition-colors">
                  {review.score}
                </span>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              {rank && (
                <div className={cn("absolute -top-2 -right-2 z-20", rank.label)}>
                  <span className="sr-only">Platz {index + 1}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#4a2400";
  if (score >= 75) return "#0b1f47";
  if (score >= 50) return "#3c1d05";
  if (score >= 25) return "#1e293b";
  return "#450a0a";
}
