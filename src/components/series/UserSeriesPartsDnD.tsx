"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GripVertical, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicSeriesPart } from "@/lib/review-series-schema";

interface UserSeriesPartsDnDProps {
  initialParts: Array<{
    reviewId: string;
    seriesOrder: number;
    review: {
      id: string;
      slug: string;
      title: string;
      score: number;
      images: string[];
      category: string;
      releaseDate: string | null;
    };
  }>;
  isOwner: boolean;
  onReorder?: (items: { reviewId: string; seriesOrder: number }[]) => Promise<void>;
  onRemove?: (reviewId: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function UserSeriesPartsDnD({
  initialParts,
  isOwner,
  onReorder,
  onRemove,
  disabled = false,
  className,
}: UserSeriesPartsDnDProps) {
  const [parts, setParts] = useState(initialParts);
  const [draggedPart, setDraggedPart] = useState<string | null>(null);
  const [dragOverPart, setDragOverPart] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setParts(initialParts);
  }, [initialParts]);

  const handleDragStart = (e: React.DragEvent, reviewId: string) => {
    if (!isOwner || disabled) return;
    setDraggedPart(reviewId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", reviewId);
  };

  const handleDragOver = (e: React.DragEvent, reviewId: string) => {
    if (!isOwner || disabled || draggedPart === reviewId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverPart(reviewId);
  };

  const handleDragLeave = () => {
    setDragOverPart(null);
  };

  const handleDrop = async (e: React.DragEvent, targetReviewId: string) => {
    if (!isOwner || disabled || !draggedPart || draggedPart === targetReviewId) return;
    e.preventDefault();

    const draggedIndex = parts.findIndex((p) => p.reviewId === draggedPart);
    const targetIndex = parts.findIndex((p) => p.reviewId === targetReviewId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newParts = [...parts];
    const [removed] = newParts.splice(draggedIndex, 1);
    newParts.splice(targetIndex, 0, removed);

    const updatedParts = newParts.map((part, index) => ({
      ...part,
      seriesOrder: index + 1,
    }));

    setParts(updatedParts);
    setDragOverPart(null);

    if (onReorder) {
      setIsReordering(true);
      try {
        await onReorder(updatedParts.map((p) => ({ reviewId: p.reviewId, seriesOrder: p.seriesOrder })));
      } catch {
        // Rollback on error
        setParts(parts);
      } finally {
        setIsReordering(false);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedPart(null);
    setDragOverPart(null);
  };

  const handleRemove = async (reviewId: string) => {
    if (!isOwner || disabled) return;
    if (!confirm("Diesen Teil wirklich aus der Serie entfernen?")) return;

    setRemovingId(reviewId);
    try {
      if (onRemove) {
        await onRemove(reviewId);
      }
      setParts((prev) => prev.filter((p) => p.reviewId !== reviewId));
    } finally {
      setRemovingId(null);
    }
  };

  if (parts.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <p className="text-muted-foreground">Keine Teile hinzugefügt. Füge Reviews über die Suche hinzu.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div role="list" className="space-y-3" aria-label="Serien-Teile">
        {parts.map((part, index) => (
          <article
            key={part.reviewId}
            role="listitem"
            className={cn(
              "group relative flex items-start gap-4 p-4 rounded-xl border border-border bg-card transition-all",
              isOwner && !disabled && "cursor-grab active:cursor-grabbing",
              draggedPart === part.reviewId && "opacity-50 rotate-1 ring-2 ring-primary",
              dragOverPart === part.reviewId && "ring-2 ring-primary bg-accent/50"
            )}
            draggable={isOwner && !disabled}
            onDragStart={(e) => handleDragStart(e, part.reviewId)}
            onDragOver={(e) => handleDragOver(e, part.reviewId)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, part.reviewId)}
            onDragEnd={handleDragEnd}
            aria-grabbed={draggedPart === part.reviewId}
            aria-dropeffect={dragOverPart === part.reviewId ? "move" : "none"}
          >
            <div
              className={cn(
                "flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors",
                isOwner && !disabled ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              )}
              aria-hidden="true"
              aria-label={isOwner && !disabled ? "Zum Verschieben ziehen" : undefined}
            >
              <GripVertical className="h-5 w-5" />
            </div>

            <div className="relative aspect-video w-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              {part.review.images?.[0] ? (
                <img
                  src={part.review.images[0]}
                  alt={part.review.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <span className="text-3xl flex h-full w-full items-center justify-center">🎮</span>
              )}
              <div className="absolute top-1 left-1">
                <span className={cn(
                  "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                  "bg-primary/90 text-primary-foreground backdrop-blur-sm"
                )}>
                  {part.seriesOrder}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate">{part.review.title}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                  {part.review.category}
                </span>
                {part.review.releaseDate && (
                  <time dateTime={part.review.releaseDate} className="text-xs">
                    {new Date(part.review.releaseDate).toLocaleDateString("de-DE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm mt-1">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                  part.review.score >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                  part.review.score >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                )}>
                  <span className="text-yellow-500">★</span>
                  {part.review.score}
                </span>
              </div>
            </div>

            {isOwner && !disabled && (
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(part.reviewId)}
                  disabled={removingId === part.reviewId || isReordering}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Teil "${part.review.title}" entfernen`}
                >
                  {removingId === part.reviewId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
                <span className="px-2 py-0.5 bg-background/80 backdrop-blur-sm rounded-full text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  Position: {part.seriesOrder}
                </span>
              </div>
            )}
          </article>
        ))}
      </div>

      {isReordering && (
        <div className="text-center text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
          Speichere Reihenfolge...
        </div>
      )}
    </div>
  );
}