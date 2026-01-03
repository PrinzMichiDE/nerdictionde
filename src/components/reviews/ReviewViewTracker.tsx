"use client";

import { useEffect } from "react";
import { trackReviewView } from "@/lib/analytics";

interface ReviewViewTrackerProps {
  reviewId: string;
  reviewTitle: string;
}

export function ReviewViewTracker({ reviewId, reviewTitle }: ReviewViewTrackerProps) {
  useEffect(() => {
    // Track review view
    trackReviewView(reviewId, reviewTitle);
  }, [reviewId, reviewTitle]);

  return null;
}
