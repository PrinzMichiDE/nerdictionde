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
      <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl h-full">
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
          <div className="absolute top-4 right-4 z-10">
            <ScoreBadge
              score={review.score}
              className="h-14 w-14 text-xl border-2 border-background shadow-xl"
            />
          </div>

          {/* Category Badge */}
          <div className="absolute top-4 left-4 z-10">
            <Badge
              variant="outline"
              className="capitalize bg-background/90 backdrop-blur-sm border-2 font-semibold"
            >
              {review.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-6 space-y-4">
          <h3 className="text-2xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {review.title}
          </h3>
          
          <p className="text-muted-foreground line-clamp-3 leading-relaxed">
            {review.content?.replace(/[#*`]/g, "").substring(0, 150)}...
          </p>

          {/* Pros Preview */}
          {review.pros && review.pros.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {review.pros.slice(0, 2).map((pro, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  ✓ {pro}
                </Badge>
              ))}
            </div>
          )}

          {/* Read More */}
          <div className="flex items-center gap-2 text-primary font-semibold pt-2 group-hover:gap-3 transition-all">
            <span>Mehr erfahren</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
