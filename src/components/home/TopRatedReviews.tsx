import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Review } from "@/types/review";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";

interface TopRatedReviewsProps {
  reviews: Review[];
}

export function TopRatedReviews({ reviews }: TopRatedReviewsProps) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30">
            <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Top-Rated Reviews</h2>
            <p className="text-muted-foreground mt-1">
              Die besten Bewertungen unserer Redaktion
            </p>
          </div>
        </div>
        <Link 
          href="/reviews?sort=score-desc" 
          className="hidden sm:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
        >
          Alle Top-Reviews
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, index) => (
          <div 
            key={review.id}
            className="animate-scale-in"
            style={{ animationDelay: `${index * 0.1}s`, animationFillMode: "both" }}
          >
            <ReviewCard review={review} />
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <Button 
          asChild 
          variant="outline" 
          className="sm:hidden border-2"
        >
          <Link href="/reviews?sort=score-desc">
            Alle Top-Reviews ansehen
          </Link>
        </Button>
      </div>
    </section>
  );
}

