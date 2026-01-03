"use client";

import { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackBookmark } from "@/lib/analytics";
import { motion } from "framer-motion";

interface BookmarkButtonProps {
  reviewId: string;
  reviewTitle: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BookmarkButton({
  reviewId,
  reviewTitle,
  className,
  size = "md",
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // Load bookmarks from localStorage
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    setIsBookmarked(bookmarks.includes(reviewId));
  }, [reviewId]);

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    let updatedBookmarks: string[];

    if (isBookmarked) {
      updatedBookmarks = bookmarks.filter((id: string) => id !== reviewId);
      trackBookmark(reviewId, "remove");
    } else {
      updatedBookmarks = [...bookmarks, reviewId];
      trackBookmark(reviewId, "add");
    }

    localStorage.setItem("bookmarks", JSON.stringify(updatedBookmarks));
    setIsBookmarked(!isBookmarked);
  };

  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleBookmark}
      className={cn(
        "rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isBookmarked
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:border-primary",
        sizeClasses[size],
        className
      )}
      aria-label={isBookmarked ? "Bookmark entfernen" : "Bookmark hinzufügen"}
      aria-pressed={isBookmarked}
    >
      {isBookmarked ? (
        <BookmarkCheck className="size-5" />
      ) : (
        <Bookmark className="size-5" />
      )}
    </motion.button>
  );
}
