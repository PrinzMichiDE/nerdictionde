"use client";

import Image from "next/image";
import Link from "next/link";
import { Review } from "@/types/review";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { SpotlightCard } from "./SpotlightCard";
import { ArrowRight, Play, Clock, Calendar, Crown } from "lucide-react";

const categoryLabels: Record<string, string> = {
  game: "Games",
  movie: "Filme",
  series: "Serien",
};

function getRatingLabel(score: number): string {
  if (score >= 90) return "Phänomenal";
  if (score >= 80) return "Hervorragend";
  if (score >= 70) return "Gut";
  if (score >= 60) return "Befriedigend";
  return "Ausreichend";
}

interface FeaturedSpotlightProps {
  review: Review;
}

export function FeaturedSpotlight({ review }: FeaturedSpotlightProps) {
  const imageUrl = review.images?.[0];
  const formattedDate = new Date(review.createdAt).toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const wordCount = (review.content || "").split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const pros = review.pros?.slice(0, 3) ?? [];

  return (
    <SpotlightCard className="rounded-3xl">
      <div className="relative grid overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/5 lg:grid-cols-12 transition-colors duration-500 hover:border-primary/25">
        {/* Ribbon */}
        <div
          className="absolute left-0 top-6 z-20 inline-flex items-center gap-1.5 rounded-r-full py-1.5 pl-4 pr-5 text-xs font-bold uppercase tracking-widest text-white shadow-lg"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--primary) 88%, black), var(--primary))",
          }}
        >
          <Crown className="size-3.5" />
          Review der Woche
        </div>

        {/* Bild-Seite */}
        <div className="relative aspect-[16/10] lg:col-span-7 lg:aspect-auto lg:min-h-[26rem] overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={review.title}
              fill
              priority
              unoptimized
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="ken-burns object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-muted-foreground text-sm font-medium">Kein Bild vorhanden</span>
            </div>
          )}
          <div
            className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent lg:bg-gradient-to-r lg:from-card lg:via-card/35 lg:to-transparent"
            aria-hidden="true"
          />
          <div className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6 z-10">
            <ScoreBadge
              score={review.score}
              className="h-16 w-16 md:h-20 md:w-20 text-2xl md:text-3xl border-4 border-card shadow-2xl"
            />
            <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-foreground">
              {getRatingLabel(review.score)}
            </p>
          </div>
        </div>

        {/* Content-Seite */}
        <div className="relative z-10 flex flex-col justify-center gap-5 p-6 md:p-10 lg:col-span-5 lg:p-12">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="kicker text-primary">
              {categoryLabels[review.category] || review.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {formattedDate}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {readingTime} Min.
            </span>
          </div>

          <h3 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight leading-[1.08] text-balance transition-colors hover:text-primary">
            {review.title}
          </h3>

          <p className="text-muted-foreground leading-relaxed line-clamp-3">
            {review.content?.replace(/[#*`]/g, "").substring(0, 260)}...
          </p>

          {pros.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {pros.map((pro, i) => (
                <li
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground"
                >
                  <span className="text-primary">✓</span>
                  {pro}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="shine group relative rounded-full px-7">
              <Link href={`/reviews/${review.slug}`} className="relative z-[2] inline-flex items-center gap-2">
                Review lesen
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {review.youtubeVideos?.[0] && (
              <Button asChild size="lg" variant="outline" className="rounded-full border-2">
                <a
                  href={`https://www.youtube.com/watch?v=${review.youtubeVideos[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <Play className="size-4 text-red-500" />
                  Video
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}
