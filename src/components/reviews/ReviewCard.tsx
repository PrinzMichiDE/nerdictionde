import Link from "next/link";
import { Review } from "@/types/review";
import { ScoreRing } from "./ScoreRing";
import { ArrowRight, Clock3 } from "lucide-react";
import Image from "next/image";
import { getCategoryStyle, getVerdict, stripMarkdown } from "@/lib/review-category";
import type { CSSProperties } from "react";

interface ReviewCardProps {
  review: Review;
  /** Laufende Nummer für den Editorial-Index (0-basiert) */
  index?: number;
}

export function ReviewCard({ review, index }: ReviewCardProps) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const style = getCategoryStyle(review.category);
  const snippet = stripMarkdown(review.content || "").substring(0, 150);
  const readingTime = Math.max(1, Math.ceil((review.content || "").split(/\s+/).length / 200));

  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
    >
      <article className="review-card flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card">
        <div className="review-card-image shine relative aspect-[16/9] w-full bg-muted">
          <span
            className="cat-bar"
            style={{ "--cat": style.color } as CSSProperties}
            aria-hidden="true"
          />
          {typeof index === "number" && (
            <span className="card-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
          )}
          {review.images?.[0] ? (
            <Image
              src={review.images[0]}
              alt={review.title}
              fill
              className="object-cover"
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground text-xs font-medium">Kein Bild</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          <div className="absolute top-2.5 right-2.5">
            <ScoreRing
              score={review.score}
              size={48}
              ringWidth={3.5}
              hole="var(--card)"
            />
          </div>

          <div className="absolute bottom-2.5 left-3">
            <span className="inline-flex items-center rounded-sm bg-black/60 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
              {getVerdict(review.score)}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-center gap-2 text-[0.6875rem] text-muted-foreground">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: style.dot }}
              aria-hidden="true"
            />
            <span className="kicker" style={{ color: style.color }}>
              {style.label}
            </span>
            <span aria-hidden="true">·</span>
            <time
              dateTime={
                review.createdAt instanceof Date
                  ? review.createdAt.toISOString()
                  : review.createdAt
              }
            >
              {formattedDate}
            </time>
            <span className="inline-flex items-center gap-1 ml-auto">
              <Clock3 className="size-3" />
              {readingTime} Min.
            </span>
          </div>

          <h3
            className="review-title-underline font-serif text-xl font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary"
            style={{ "--cat": style.color } as CSSProperties}
          >
            {review.title}
          </h3>

          <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
            {snippet}…
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-sm">
            <span className="font-semibold text-primary">Weiterlesen</span>
            <ArrowRight className="review-card-arrow size-4 text-primary" />
          </div>
        </div>
      </article>
    </Link>
  );
}
