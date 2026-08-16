import { Review } from "@/types/review";
import type { CSSProperties } from "react";

function ratingWord(score: number): string {
  if (score >= 90) return "Phänomenal";
  if (score >= 80) return "Hervorragend";
  if (score >= 70) return "Gut";
  if (score >= 60) return "Befriedigend";
  if (score >= 45) return "Durchwachsen";
  return "Enttäuschend";
}

function TickerRow({ items }: { items: Review[] }) {
  return (
    <>
      {items.map((review) => (
        <span
          key={review.id}
          className="inline-flex items-center gap-3 px-7 font-serif text-base md:text-lg font-medium whitespace-nowrap"
        >
          <span className="text-muted-foreground">{review.title}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-primary">
            {review.score}/100
          </span>
          <span className="text-muted-foreground/70 text-sm">{ratingWord(review.score)}</span>
          <span className="ml-3 text-primary/50" aria-hidden="true">
            ✦
          </span>
        </span>
      ))}
    </>
  );
}

export function VerdictTicker({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  return (
    <div className="full-bleed border-y border-border bg-card/60 py-5" aria-hidden="true">
      <div className="marquee marquee-reverse" style={{ "--marquee-speed": "52s" } as CSSProperties}>
        <div className="marquee-track">
          <TickerRow items={reviews} />
          <TickerRow items={reviews} />
        </div>
      </div>
    </div>
  );
}
