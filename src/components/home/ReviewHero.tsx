"use client";

import { Review } from "@/types/review";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { ArrowRight, Play, Clock } from "lucide-react";

interface ReviewHeroProps {
  review: Review;
}

function getRatingLabel(score: number): string {
  if (score >= 90) return "Phänomenal";
  if (score >= 80) return "Hervorragend";
  if (score >= 70) return "Gut";
  if (score >= 60) return "Befriedigend";
  return "Ausreichend";
}

export function ReviewHero({ review }: ReviewHeroProps) {
  const imageUrl = review.images?.[0];

  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const wordCount = (review.content || "").split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <section className="mb-12 md:mb-16">
      {/* Editorial header */}
      <div className="border-b border-border pb-6 md:pb-8 mb-6 md:mb-8">
        <div className="kicker text-primary mb-3 md:mb-4">
          {review.category === "game" ? "Test" : "Kritik"} ·{" "}
          {review.category}
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight leading-[1.1] max-w-5xl">
          {review.title}
        </h1>

        {review.content && (
          <p className="mt-4 md:mt-5 text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl line-clamp-2">
            {review.content.replace(/[#*`]/g, "").substring(0, 220)}...
          </p>
        )}

        <div className="mt-4 md:mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Nerdiction Redaktion</span>
          <span aria-hidden="true">·</span>
          <time dateTime={review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt}>
            {formattedDate}
          </time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {readingTime} Min. Lesezeit
          </span>
        </div>
      </div>

      {/* Feature image */}
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-md bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={review.title}
            fill
            priority
            unoptimized
            sizes="100vw"
            quality={85}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground text-sm font-medium">Kein Bild vorhanden</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <div className="absolute top-3 right-3 md:top-4 md:right-4">
          <ScoreBadge
            score={review.score}
            className="h-12 w-12 md:h-16 md:w-16 text-lg md:text-2xl border border-white/20"
          />
        </div>

        <div className="absolute bottom-3 left-3 md:bottom-5 md:left-5 flex flex-wrap items-center gap-2 md:gap-3">
          <span className="text-white text-xs md:text-sm font-semibold uppercase tracking-widest bg-black/60 px-2.5 py-1 rounded-sm">
            {getRatingLabel(review.score)}
          </span>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-6 md:mt-8 flex flex-wrap items-center gap-3 md:gap-4">
        <Button asChild size="lg">
          <Link href={`/reviews/${review.slug}`} className="inline-flex items-center gap-2">
            Vollständigen Review lesen
            <ArrowRight className="size-4" />
          </Link>
        </Button>
        {review.youtubeVideos?.[0] && (
          <Button asChild size="lg" variant="outline">
            <a
              href={`https://www.youtube.com/watch?v=${review.youtubeVideos[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Play className="size-4" />
              Video ansehen
            </a>
          </Button>
        )}
      </div>
    </section>
  );
}
