"use client";

import { useState, useEffect } from "react";
import { ReviewCard } from "./ReviewCard";
import { AnimatedCard } from "@/components/shared/AnimatedCard";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Review } from "@/types/review";
import { BookmarkX, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookmarkedReviews() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load bookmarked IDs from localStorage
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    setBookmarkedIds(bookmarks);

    if (bookmarks.length === 0) {
      setIsLoading(false);
      return;
    }

    // Fetch reviews for bookmarked IDs
    const fetchReviews = async () => {
      try {
        const response = await fetch(`/api/reviews?all=true&limit=100`);
        if (response.ok) {
          const data = await response.json();
          const allReviews = data.success && data.data?.reviews 
            ? data.data.reviews 
            : data.reviews || [];
          
          const bookmarkedReviews = allReviews.filter((review: Review) =>
            bookmarks.includes(review.id)
          );
          setReviews(bookmarkedReviews);
        }
      } catch (error) {
        console.error("Error fetching bookmarked reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const clearAllBookmarks = () => {
    localStorage.setItem("bookmarks", "[]");
    setBookmarkedIds([]);
    setReviews([]);
  };

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Lade Bookmarks...</p>
      </div>
    );
  }

  if (bookmarkedIds.length === 0) {
    return (
      <AnimatedSection direction="up">
        <div className="text-center py-24 border-2 border-dashed rounded-xl bg-muted/30">
          <BookOpen className="size-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Noch keine Bookmarks</h3>
          <p className="text-muted-foreground mb-6">
            Speichere interessante Reviews, um sie später wiederzufinden.
          </p>
          <Button asChild>
            <a href="/reviews">Reviews durchsuchen</a>
          </Button>
        </div>
      </AnimatedSection>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {reviews.length} {reviews.length === 1 ? "Bookmark" : "Bookmarks"}
        </p>
        {reviews.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllBookmarks}
            className="gap-2"
          >
            <BookmarkX className="size-4" />
            Alle entfernen
          </Button>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, index) => (
          <AnimatedCard key={review.id} index={index} delay={0.1}>
            <ReviewCard review={review} />
          </AnimatedCard>
        ))}
      </div>
    </div>
  );
}
