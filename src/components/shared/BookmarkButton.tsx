"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  reviewId: string;
  initialBookmarked?: boolean;
  className?: string;
}

export function BookmarkButton({
  reviewId,
  initialBookmarked = false,
  className,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/user/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      const data = await res.json();
      if (data.success) {
        setBookmarked(data.data.bookmarked);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "p-2 rounded-md transition-colors hover:bg-muted",
        bookmarked ? "text-primary" : "text-muted-foreground",
        className
      )}
      aria-label={bookmarked ? "Lesezeichen entfernen" : "Lesezeichen hinzufügen"}
    >
      {bookmarked ? (
        <BookmarkCheck className="size-5" />
      ) : (
        <Bookmark className="size-5" />
      )}
    </button>
  );
}
