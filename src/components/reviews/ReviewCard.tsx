"use client";

import Link from "next/link";
import Image from "next/image";
import { Review } from "@/types/review";
import { getCategoryStyle, getScoreColor, getVerdict } from "@/lib/review-category";
import { ArrowRight, Clock3 } from "lucide-react";
import { CompareButton } from "./CompareButton";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const style = getCategoryStyle(review.category);
  const snippet = (review.content || "").split(/\s+/).slice(0, 30).join(" ") + "…";
  const readingTime = Math.max(1, Math.ceil((review.content || "").split(/\s+/).length / 200));

  return (
    <Link
      href={`/reviews/${review.slug}`}
      className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
    >
      <article className="review-card flex h-full flex-col overflow-hidden rounded-sm border border-border bg-card">
        <div className="relative aspect-[16/9] w-full bg-muted">
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
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="kicker text-[0.6875rem]" style={{ color: style.color }}>
              {style.label}
            </span>
            <span className="inline-flex items-baseline gap-1.5">
              <span
                className="font-serif text-lg font-semibold tabular-nums"
                style={{ color: getScoreColor(review.score) }}
              >
                {review.score}
              </span>
              <span className="text-xs text-muted-foreground">
                {getVerdict(review.score)}
              </span>
            </span>
          </div>

          <h3 className="font-serif text-xl font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary">
            {review.title}
          </h3>

          <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
            {snippet}
          </p>

          <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3 text-sm">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <time
                dateTime={
                  review.createdAt instanceof Date
                    ? review.createdAt.toISOString()
                    : review.createdAt
                }
              >
                {formattedDate}
              </time>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3" />
                {readingTime} Min.
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">Weiterlesen</span>
              <ArrowRight className="size-4 text-primary" />
            </div>
            <CompareButton slug={review.slug} />
          </div>
        </div>
      </article>
    </Link>
  );
}
