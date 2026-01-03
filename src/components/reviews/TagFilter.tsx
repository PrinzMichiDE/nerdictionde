"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Review } from "@/types/review";
import { extractTags, getAllTags, getTagCounts } from "@/lib/tags";
import { getAllTagsWithCounts } from "@/lib/db/tags";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface TagFilterProps {
  reviews: Review[];
  onFilterChange?: (filteredReviews: Review[]) => void;
  showCounts?: boolean;
  maxTags?: number;
}

export function TagFilter({
  reviews,
  onFilterChange,
  showCounts = true,
  maxTags = 20,
}: TagFilterProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dbTags, setDbTags] = useState<Array<{ name: string; reviewCount: number }>>([]);

  // Try to load tags from database, fallback to client-side extraction
  useEffect(() => {
    getAllTagsWithCounts()
      .then((tags) => {
        if (tags.length > 0) {
          setDbTags(tags);
        }
      })
      .catch(() => {
        // Fallback to client-side tags
      });
  }, []);

  const tagCounts = useMemo(() => getTagCounts(reviews), [reviews]);
  const allTags = useMemo(() => getAllTags(reviews), [reviews]);
  
  // Use database tags if available, otherwise use client-side tags
  const topTags = useMemo(() => {
    if (dbTags.length > 0) {
      return dbTags
        .sort((a, b) => b.reviewCount - a.reviewCount)
        .slice(0, maxTags)
        .map((tag) => tag.name);
    }
    return allTags
      .sort((a, b) => (tagCounts[b] || 0) - (tagCounts[a] || 0))
      .slice(0, maxTags);
  }, [dbTags, allTags, tagCounts, maxTags]);

  const getTagCount = (tagName: string): number => {
    if (dbTags.length > 0) {
      const dbTag = dbTags.find((t) => t.name === tagName);
      return dbTag?.reviewCount || tagCounts[tagName] || 0;
    }
    return tagCounts[tagName] || 0;
  };

  const filteredReviews = useMemo(() => {
    if (selectedTags.length === 0) return reviews;
    return reviews.filter((review) => {
      const reviewTags = extractTags(review);
      return selectedTags.every((tag) => reviewTags.includes(tag));
    });
  }, [reviews, selectedTags]);

  // Notify parent of filter changes
  useMemo(() => {
    onFilterChange?.(filteredReviews);
  }, [filteredReviews, onFilterChange]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  if (allTags.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Aktive Filter:</span>
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1.5 px-2.5 py-1 text-xs h-6 capitalize"
            >
              <span>{tag}</span>
              <button
                onClick={() => toggleTag(tag)}
                className="hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Tag ${tag} entfernen`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 text-xs"
          >
            Alle entfernen
          </Button>
        </div>
      )}

      {/* Tag Cloud */}
      <div className="flex flex-wrap gap-2">
        {topTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          const count = tagCounts[tag] || 0;

          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
              aria-pressed={isSelected}
              aria-label={`Filter nach ${tag}${showCounts ? ` (${getTagCount(tag)})` : ""}`}
            >
              {tag}
              {showCounts && (
                <span className="ml-1.5 opacity-70">({getTagCount(tag)})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Results Count */}
      {selectedTags.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {filteredReviews.length} {filteredReviews.length === 1 ? "Review" : "Reviews"} gefunden
        </p>
      )}
    </div>
  );
}
