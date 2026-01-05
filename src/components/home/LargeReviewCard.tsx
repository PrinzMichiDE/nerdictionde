"use client";

import { Review } from "@/types/review";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { ArrowRight } from "lucide-react";

interface LargeReviewCardProps {
  review: Review;
  priority?: boolean;
}

export function LargeReviewCard({ review, priority = false }: LargeReviewCardProps) {
  const imageUrl = review.images?.[0];

  return (
    <Link href={`/reviews/${review.slug}`}>
      <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 h-full">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={review.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              priority={priority}
              unoptimized
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <span className="text-muted-foreground text-sm font-medium">Kein Bild</span>
            </div>
          )}
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Score Badge */}
          <div className="absolute top-4 md:top-5 lg:top-6 right-4 md:right-5 lg:right-6 z-10">
            <ScoreBadge
              score={review.score}
              className="h-14 w-14 md:h-16 md:w-16 lg:h-20 lg:w-20 text-xl md:text-2xl lg:text-3xl border-2 md:border-[3px] border-background shadow-xl"
            />
          </div>

          {/* Category Badge */}
          <div className="absolute top-4 md:top-5 lg:top-6 left-4 md:left-5 lg:left-6 z-10">
            <Badge
              variant="outline"
              className="capitalize bg-background/90 backdrop-blur-sm border-2 font-semibold text-xs md:text-sm lg:text-base px-2 md:px-3 lg:px-4 py-1 md:py-1.5 lg:py-2"
            >
              {review.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6 md:p-7 lg:p-8 space-y-4 md:space-y-5 lg:space-y-6">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {review.title}
          </h3>
          
          <p className="text-muted-foreground line-clamp-3 md:line-clamp-4 leading-relaxed text-base md:text-lg lg:text-xl">
            {review.content?.replace(/[#*`]/g, "").substring(0, 150)}...
          </p>

          {/* Pros Preview */}
          {review.pros && review.pros.length > 0 && (
            <div className="flex flex-wrap gap-2 md:gap-3 pt-2">
              {review.pros.slice(0, 2).map((pro, index) => (
                <Badge key={index} variant="secondary" className="text-xs md:text-sm lg:text-base px-2 md:px-3 py-1 md:py-1.5">
                  ✓ {pro}
                </Badge>
              ))}
            </div>
          )}

          {/* Read More */}
          <div className="flex items-center gap-2 md:gap-3 text-primary font-semibold pt-2 md:pt-3 group-hover:gap-3 md:group-hover:gap-4 transition-all text-base md:text-lg lg:text-xl">
            <span>Mehr erfahren</span>
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
