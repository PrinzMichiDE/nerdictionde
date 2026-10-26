"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, Loader2, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PublicSeriesPart } from "@/lib/review-series-schema";

interface ReviewSearchResult {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  category: string;
  score: number;
  images: string[];
  releaseDate: string | null;
  seriesId: string | null;
  seriesOrder: number | null;
}

interface ReviewSearchAutocompleteProps {
  onSelect: (review: ReviewSearchResult) => void;
  excludeIds?: string[];
  placeholder?: string;
  className?: string;
  maxResults?: number;
}

export function ReviewSearchAutocomplete({
  onSelect,
  excludeIds = [],
  placeholder = "Review suchen...",
  className,
  maxResults = 10,
}: ReviewSearchAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReviewSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("query", searchQuery);
      params.set("limit", maxResults.toString());
      params.set("status", "published");

      const res = await fetch(`/api/reviews/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.reviews.filter(
          (r: ReviewSearchResult) => !excludeIds.includes(r.id) && !r.seriesId
        );
        setResults(filtered.slice(0, maxResults));
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [excludeIds, maxResults]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          onSelect(results[highlightedIndex]);
          setQuery("");
          setIsOpen(false);
          setHighlightedIndex(-1);
          if (inputRef.current) inputRef.current.blur();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (inputRef.current) inputRef.current.blur();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleFocus = () => {
    if (query.length >= 2 && results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelect = (review: ReviewSearchResult) => {
    onSelect(review);
    setQuery("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (inputRef.current) inputRef.current.blur();
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="review-search-results"
          aria-expanded={isOpen && results.length > 0}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleClear}
            aria-label="Suche löschen"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          id="review-search-results"
          role="listbox"
          className={cn(
            "absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-lg",
            "max-h-96 overflow-hidden"
          )}
        >
          <ScrollArea className="max-h-96">
            <div className="py-1">
              {results.map((review, index) => (
                <button
                  key={review.id}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  onClick={() => handleSelect(review)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "w-full px-3 py-2 text-left flex items-center gap-3 transition-colors",
                    index === highlightedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {review.images?.[0] && (
                    <div className="relative h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-muted">
                      <img
                        src={review.images[0]}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{review.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {review.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{review.score}</span>
                      </span>
                      {review.releaseDate && (
                        <time dateTime={review.releaseDate}>
                          {new Date(review.releaseDate).getFullYear()}
                        </time>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {isOpen && !isLoading && results.length === 0 && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-lg p-3 text-center text-sm text-muted-foreground">
          Keine passenden Reviews gefunden
        </div>
      )}
    </div>
  );
}