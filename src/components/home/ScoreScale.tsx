import Link from "next/link";
import type { Review } from "@/types/review";
import { getScoreColor, getVerdict } from "@/lib/review-category";
import { cn } from "@/lib/utils";

const bands = [
  { min: 90, max: 100, label: "Phänomenal" },
  { min: 80, max: 89, label: "Hervorragend" },
  { min: 70, max: 79, label: "Gut" },
  { min: 60, max: 69, label: "Solide" },
  { min: 50, max: 59, label: "Mittelmaß" },
  { min: 0, max: 49, label: "Enttäuschend" },
];

export function ScoreScale({ reviews }: { reviews: Review[] }) {
  const markers = [...reviews].sort((a, b) => a.score - b.score);

  return (
    <div className="rounded-sm border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-serif text-xl font-semibold">Die 100-Punkte-Skala</h3>
        <span className="text-xs text-muted-foreground">
          {reviews.length} {reviews.length === 1 ? "Test" : "Tests"} darauf
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Jeder Test liegt auf derselben Skala. Fahre über einen Punkt, um den Test zu sehen.
      </p>

      <div className="mt-8">
        <div className="relative h-24">
          {markers.map((review, index) => {
            const color = getScoreColor(review.score);

            return (
              <Link
                key={review.id}
                href={`/reviews/${review.slug}`}
                aria-label={`${review.score} von 100: ${review.title}`}
                className="group absolute z-10 -translate-x-1/2 rounded-full focus-visible:outline-none"
                style={{ left: `${review.score}%`, bottom: `${(index % 3) * 20}px` }}
              >
                <span
                  className="block size-3 rounded-full border-2 border-card ring-1 ring-foreground/15 transition-transform duration-150 group-hover:scale-125 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-card"
                  style={{ backgroundColor: color }}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute bottom-full z-20 mb-2 w-56 rounded-sm border border-border bg-popover p-3 text-left opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
                    review.score < 20 && "left-0",
                    review.score >= 20 && review.score <= 65 && "left-1/2 -translate-x-1/2",
                    review.score > 65 && "right-0"
                  )}
                >
                  <span className="flex items-baseline gap-2 text-xs font-medium tabular-nums" style={{ color }}>
                    <span>{review.score}/100</span>
                    <span className="text-muted-foreground">{getVerdict(review.score)}</span>
                  </span>
                  <span className="mt-1 block font-serif text-sm font-semibold leading-snug text-popover-foreground">
                    {review.title}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="h-1.5 w-full rounded-full bg-muted" aria-hidden="true" />
        <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>0</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        {bands.map((band) => (
          <div
            key={band.label}
            className="border-t pt-2"
            style={{ borderColor: getScoreColor(band.min) }}
          >
            <dt className="text-sm font-medium">{band.label}</dt>
            <dd className="text-xs tabular-nums text-muted-foreground">
              {band.min} bis {band.max}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
