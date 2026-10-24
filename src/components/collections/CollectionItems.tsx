"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ChevronLeft, ChevronRight, Trash2, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/hooks/use-toast";
import type { CollectionItem } from "@prisma/client";

interface CollectionItemsProps {
  initialItems: (CollectionItem & {
    review: {
      id: string;
      title: string;
      slug: string;
      category: string;
      score: number;
      images: string[];
      releaseDate: Date | null;
    };
  })[];
  initialCursor: number | null;
  slug: string;
  isOwner: boolean;
  onReorder?: (items: { reviewId: string; position: number }[]) => void;
  onRemove?: (reviewId: string) => void;
}

export function CollectionItems({
  initialItems,
  initialCursor,
  slug,
  isOwner,
  onReorder,
  onRemove,
}: CollectionItemsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const hasMore = cursor !== null;
  const ITEMS_PER_PAGE = 12;

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("cursor", cursor!.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());
      const res = await fetch(`/api/listen/${slug}?${params.toString()}`);
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } catch {
      toast({ title: "Fehler", description: "Fehler beim Laden weiterer Einträge", variant: "destructive" });
    } finally {
      setLoadingMore(false);
    }
  }, [slug, cursor, hasMore, loadingMore]);

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, reviewId: string) => {
    if (!isOwner) return;
    setDraggedItem(reviewId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", reviewId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isOwner) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetReviewId: string) => {
    if (!isOwner || !draggedItem || draggedItem === targetReviewId) return;
    e.preventDefault();

    const draggedIndex = items.findIndex((i) => i.reviewId === draggedItem);
    const targetIndex = items.findIndex((i) => i.reviewId === targetReviewId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);

    // Update positions
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      position: index,
    }));

    setItems(updatedItems);

    if (onReorder) {
      onReorder(updatedItems.map((i) => ({ reviewId: i.reviewId, position: i.position })));
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleRemove = async (reviewId: string) => {
    if (!confirm("Diesen Eintrag wirklich aus der Liste entfernen?")) return;
    if (onRemove) await onRemove(reviewId);
    setItems((prev) => prev.filter((i) => i.reviewId !== reviewId));
  };

  if (loading && items.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Diese Liste ist leer"
        description="Füge Reviews hinzu, um deine Liste zu füllen."
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
        {items.map((item, index) => (
          <article
            key={item.reviewId}
            role="listitem"
            className={cn(
              "group relative p-4 rounded-xl border border-border bg-card transition-all hover:shadow-lg",
              isOwner && "cursor-grab active:cursor-grabbing",
              draggedItem === item.reviewId && "opacity-50 rotate-1"
            )}
            draggable={isOwner}
            onDragStart={(e) => handleDragStart(e, item.reviewId)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item.reviewId)}
            onDragEnd={handleDragEnd}
          >
            {isOwner && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(item.reviewId)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label="Aus Liste entfernen"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <span className="p-1 text-muted-foreground" aria-hidden="true">
                  <GripVertical className="h-5 w-5" />
                </span>
              </div>
            )}
            <Link href={`/reviews/${item.review.slug}`} className="block">
              {item.review.images?.[0] ? (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-3 bg-muted">
                  <Image
                    src={item.review.images[0]}
                    alt={item.review.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-3 bg-muted flex items-center justify-center">
                  <span className="text-4xl">🎮</span>
                </div>
              )}
              <h3 className="font-semibold line-clamp-1 mb-1">{item.review.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {item.review.category}
                </span>
                {item.review.releaseDate && (
                  <time dateTime={new Date(item.review.releaseDate).toISOString()}>
                    {formatDistanceToNow(new Date(item.review.releaseDate), { addSuffix: true, locale: de })}
                  </time>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-yellow-500">★</span>
                <span className="font-medium">{item.review.score}</span>
              </div>
            </Link>
            {isOwner && (
              <div className="absolute bottom-2 left-2 right-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs text-muted-foreground">
                  Position: {item.position + 1}
                </span>
              </div>
            )}
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full sm:w-auto"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Mehr laden
          </Button>
        </div>
      )}
    </div>
  );
}