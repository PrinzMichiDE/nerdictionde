import Link from "next/link";
import type { Review } from "@/types/review";
import { getCategoryStyle, getScoreColor, getVerdict } from "@/lib/review-category";
import { ArrowRight } from "lucide-react";

interface EditorialPicksProps {
  reviews: Review[];
}

export function EditorialPicks({ reviews }: EditorialPicksProps) {
  const picks = [...reviews].sort((a, b) => b.score - a.score).slice(0, 3);

  if (picks.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          Redaktionstipps
        </h2>
        <Link
          href="/reviews?sort=score"
          className="rounded-sm text-sm font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Alle Bestbewerteten
        </Link>
      </div>

      <ol className="border-t border-border">
        {picks.map((review, index) => {
          const style = getCategoryStyle(review.category);

          return (
            <li key={review.id} className="border-b border-border">
              <Link
                href={`/reviews/${review.slug}`}
                aria-label={`Platz ${index + 1}: ${review.title}, ${review.score} von 100`}
                className="pick-row group block"
              >
                <span
                  className="pick-index font-serif font-semibold tabular-nums text-muted-foreground"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <span className="kicker text-[0.6875rem]" style={{ color: style.color }}>
                    {style.label}
                  </span>
                  <h3
                    className="mt-0.5 line-clamp-1 font-serif text-lg font-semibold leading-snug md:text-xl"
                    title={review.title}
                  >
                    {review.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getVerdict(review.score)}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className="font-serif text-2xl font-semibold tabular-nums"
                    style={{ color: getScoreColor(review.score) }}
                  >
                    {review.score}
                  </span>
                  <span className="block text-xs text-muted-foreground">von 100</span>
                </div>

                <ArrowRight className="pick-arrow size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="pick-rule" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
