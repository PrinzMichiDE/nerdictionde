"use client";

import { Review } from "@/types/review";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { ArrowRight, Play } from "lucide-react";

interface ReviewHeroProps {
  review: Review;
}

export function ReviewHero({ review }: ReviewHeroProps) {
  const imageUrl = review.images?.[0];

  return (
    <section className="relative w-full h-[80vh] min-h-[600px] max-h-[900px] overflow-hidden rounded-3xl mb-16 group">
      {/* Background Image */}
      {imageUrl ? (
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={review.title}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
            priority
            unoptimized
            sizes="100vw"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
      )}

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-12 lg:p-16">
        <div className="max-w-4xl">
          {/* Category Badge */}
          <Badge
            variant="outline"
            className="mb-4 bg-background/80 backdrop-blur-sm border-2 capitalize text-sm font-semibold px-4 py-2"
          >
            {review.category}
          </Badge>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-2xl">
            {review.title}
          </h1>

          {/* Score & Meta */}
          <div className="flex items-center gap-6 mb-6 flex-wrap">
            <ScoreBadge
              score={review.score}
              className="h-16 w-16 text-2xl border-4 border-white shadow-2xl"
            />
            <div className="text-white/90">
              <p className="text-lg font-semibold">
                {review.score >= 90
                  ? "Phänomenal"
                  : review.score >= 80
                  ? "Hervorragend"
                  : review.score >= 70
                  ? "Gut"
                  : "Befriedigend"}
              </p>
              <p className="text-sm text-white/70">
                {new Date(review.createdAt).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Excerpt */}
          <p className="text-white/90 text-lg md:text-xl mb-8 leading-relaxed line-clamp-3 max-w-3xl drop-shadow-lg">
            {review.content?.replace(/[#*`]/g, "").substring(0, 200)}...
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-white text-black hover:bg-white/90 shadow-2xl text-lg px-8 py-6 h-auto group"
            >
              <Link href={`/reviews/${review.slug}`} className="flex items-center gap-2">
                Vollständigen Review lesen
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            {review.youtubeVideos?.[0] && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-lg px-8 py-6 h-auto"
              >
                <a
                  href={`https://www.youtube.com/watch?v=${review.youtubeVideos[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  Video ansehen
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
