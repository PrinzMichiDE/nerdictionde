"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, Bookmark, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryColor } from "@/lib/utils";
import { FeedItem } from "@/lib/feed";

interface FeedPageProps {
  initialFeed: {
    items: FeedItem[];
    nextCursor: string | null;
  };
  userId: string;
}

export function FeedPage({ initialFeed, userId }: FeedPageProps) {
  const [items, setItems] = useState<FeedItem[]>(initialFeed.items);
  const [nextCursor, setNextCursor] = useState<string | null>(initialFeed.nextCursor);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialFeed.nextCursor);

  const fetchMore = async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/feed?cursor=${nextCursor}&limit=20`);
      const data = await response.json();
      if (data.success) {
        setItems((prev) => [...prev, ...data.data.items]);
        setNextCursor(data.data.nextCursor);
        setHasMore(!!data.data.nextCursor);
      }
    } catch (error) {
      console.error("Failed to fetch feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: FeedItem["type"]) => {
    switch (type) {
      case "rating":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "bookmark":
        return <Bookmark className="h-5 w-5 text-primary" />;
      default:
        return <Star className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActionText = (type: FeedItem["type"]) => {
    switch (type) {
      case "rating":
        return "hat bewertet";
      case "bookmark":
        return "hat gespeichert";
      default:
        return "Aktivität";
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="mx-auto mb-4 p-4 rounded-full bg-muted">
          <Star className="h-10 w-10 text-muted-foreground/30 mx-auto" />
        </div>
        <h2 className="font-serif text-xl font-semibold tracking-tight mb-2">
          Noch keine Aktivitäten
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Folge anderen Nutzern, um ihre Bewertungen und gespeicherten Reviews hier zu sehen.
        </p>
        <Link href="/suche" className="inline-flex items-center gap-2 text-primary hover:underline">
          Nutzer entdecken
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {items.map((item) => (
        <FeedCard key={item.id} item={item} getIcon={getIcon} getActionText={getActionText} />
      ))}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            onClick={fetchMore}
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
        </div>
      )}
    </div>
  );
}

interface FeedCardProps {
  item: FeedItem;
  getIcon: (type: FeedItem["type"]) => React.ReactNode;
  getActionText: (type: FeedItem["type"]) => string;
}

function FeedCard({ item, getIcon, getActionText }: FeedCardProps) {
  const timeAgo = getTimeAgo(item.createdAt);

  return (
    <article className="p-4 rounded-lg border border-border bg-card hover:border-muted-foreground/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-muted">
          {getIcon(item.type)}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Link
              href={`/u/${item.user.username}`}
              className="font-medium hover:text-primary transition-colors"
            >
              {item.user.displayName}
            </Link>
            <span className="text-muted-foreground">@{item.user.username}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{timeAgo}</span>
          </div>

          <p className="text-sm text-foreground">
            <span className="font-medium">{getActionText(item.type)}</span>
            {item.type === "rating" && (
              <>
                <Link
                  href={`/reviews/${item.review.slug}`}
                  className="font-medium hover:text-primary transition-colors ml-1"
                >
                  {item.review.title}
                </Link>
                <span className="text-muted-foreground"> ({item.rating.score}/10)</span>
              </>
            )}
            {item.type === "bookmark" && (
              <>
                <Link
                  href={`/reviews/${item.review.slug}`}
                  className="font-medium hover:text-primary transition-colors ml-1"
                >
                  {item.review.title}
                </Link>
                <span className="text-muted-foreground"> ({item.review.score}/100)</span>
              </>
            )}
          </p>

          {item.type === "rating" && item.rating.text && (
            <p className="text-sm text-muted-foreground italic">&ldquo;{item.rating.text.slice(0, 150)}{item.rating.text.length > 150 ? "&hellip;" : ""}&rdquo;</p>
          )}
        </div>
      </div>
    </article>
  );
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return "gerade eben";
  if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min.`;
  if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std.`;
  if (seconds < 604800) return `vor ${Math.floor(seconds / 86400)} Tagen`;
  return then.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}