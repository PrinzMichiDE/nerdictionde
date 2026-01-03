"use client";

import { Review } from "@/types/review";
import { ReviewCard } from "./ReviewCard";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { AnimatedCard } from "@/components/shared/AnimatedCard";
import { getSimilarReviews, getTrendingReviews, getYouMightAlsoLike } from "@/lib/recommendations";
import { Sparkles, TrendingUp, ThumbsUp } from "lucide-react";

interface RecommendationsProps {
  currentReview?: Review;
  allReviews: Review[];
  variant?: "similar" | "trending" | "personalized";
  title?: string;
  limit?: number;
}

export function Recommendations({
  currentReview,
  allReviews,
  variant = "similar",
  title,
  limit = 6,
}: RecommendationsProps) {
  let recommendations: Review[] = [];
  let defaultTitle = "";
  let icon = <Sparkles className="size-5" />;

  if (variant === "similar" && currentReview) {
    recommendations = getSimilarReviews(currentReview, allReviews, {
      maxResults: limit,
    });
    defaultTitle = "Ähnliche Reviews";
    icon = <ThumbsUp className="size-5" />;
  } else if (variant === "trending") {
    recommendations = getTrendingReviews(allReviews, limit);
    defaultTitle = "Trending Reviews";
    icon = <TrendingUp className="size-5" />;
  } else if (variant === "personalized" && currentReview) {
    recommendations = getYouMightAlsoLike(currentReview, allReviews, limit);
    defaultTitle = "Das könnte dir auch gefallen";
    icon = <Sparkles className="size-5" />;
  }

  if (recommendations.length === 0) return null;

  return (
    <AnimatedSection direction="up" delay={0.2} className="space-y-6 pt-12 border-t">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="text-3xl font-bold tracking-tight">
          {title || defaultTitle}
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((review, index) => (
          <AnimatedCard key={review.id} index={index} delay={0.1}>
            <ReviewCard review={review} />
          </AnimatedCard>
        ))}
      </div>
    </AnimatedSection>
  );
}
