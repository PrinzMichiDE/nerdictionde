"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryColor } from "@/lib/utils";

interface ProfileBookmarksListProps {
  userId: string;
  username: string;
}

export function ProfileBookmarksList({ userId, username }: ProfileBookmarksListProps) {
  const [items, setItems] = useState<Array<{
    id: string;
    review: {
      id: string;
      title: string;
      slug: string;
      category: string;
      score: number;
      images: string[];
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchBookmarks = async (cursor?: string, append = false) => {
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "12");

      const response = await fetch(`/api/users/${username}?tab=bookmarks&${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        if (append) {
          setItems((prev) => [...prev, ...data.data.bookmarks.items]);
        } else {
          setItems(data.data.bookmarks.items);
        }
        setNextCursor(data.data.bookmarks.nextCursor);
        setHasMore(!!data.data.bookmarks.nextCursor);
        setTotalCount(data.data.bookmarks.totalCount);
      }
    } catch (error) {
      console.error("Failed to fetch bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [username]);

  const handleLoadMore = () => {
    if (nextCursor && !loading) {
      setLoading(true);
      fetchBookmarks(nextCursor, true);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center border border-border rounded-lg bg-muted/50">
        <Bookmark className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Noch keine öffentlichen gespeicherten Reviews.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((bookmark) => (
        <Link
          key={bookmark.id}
          href={`/reviews/${bookmark.review.slug}`}
          className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:border-muted-foreground/30 transition-all group"
        >
          <div className="w-16 h-16 rounded bg-muted shrink-0 flex items-center justify-center relative overflow-hidden">
            {bookmark.review.images?.[0] ? (
              <Image
                src={bookmark.review.images[0]}
                alt={bookmark.review.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="64px"
              />
            ) : (
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="absolute bottom-0 right-0 bg-primary/90 text-primary-foreground text-xs font-bold px-1.5 py-0.5">
              {bookmark.review.score}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {bookmark.review.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium ${getCategoryColor(bookmark.review.category)}`}>
                {bookmark.review.category}
              </span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
        </Link>
      ))}
      {hasMore && (
        <Button
          onClick={handleLoadMore}
          disabled={loading}
          variant="outline"
          className="w-full py-3"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <>
              Mehr laden
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      )}
      <p className="text-xs text-muted-foreground text-center">
        {items.length} von {totalCount} gespeicherten Reviews
      </p>
    </div>
  );
}