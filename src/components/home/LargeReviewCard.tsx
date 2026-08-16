"use client";

import { Review } from "@/types/review";
import Image from "next/image";
import Link from "next/link";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { ArrowRight } from "lucide-react";

interface LargeReviewCardProps {
  review: Review;
  priority?: boolean;
}

const categoryLabels: Record<string, string> = {
  game: "Games",
  movie: "Filme",
  series: "Serien",
};

export function LargeReviewCard({ review, priority = false }: LargeReviewCardProps) {
  const imageUrl = review.images?.[0];
  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/reviews/${review.slug}`} className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
      <article className="flex h-full flex-col">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden rounded-sm bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={review.title}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              priority={priority}
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground text-sm font-medium">Kein Bild</span>
            </div>
          )}
          <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3">
            <ScoreBadge score={review.score} className="h-11 w-11 md:h-12 md:w-12 text-base md:text-lg" />
          </div>
        </div>

        {/* Content */}
        <div className="pt-4 flex flex-1 flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="kicker text-primary">
              {categoryLabels[review.category] || review.category}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt}>
              {formattedDate}
            </time>
          </div>

          <h3 className="font-serif text-xl md:text-2xl font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-primary">
            {review.title}
          </h3>

          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {review.content?.replace(/[#*`]/g, "").substring(0, 160)}...
          </p>

          <div className="mt-auto pt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            <span>Zum Test</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </article>
    </Link>
  );
}
