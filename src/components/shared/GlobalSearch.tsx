"use client";

import { useState, useEffect, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Filter, Gamepad2, Film, Tv } from "lucide-react";
import Link from "next/link";
import { Review } from "@/types/review";
import { useRouter } from "next/navigation";

interface GlobalSearchProps {
  reviews?: Review[];
}

const categoryIcons = {
  game: Gamepad2,
  movie: Film,
  series: Tv,
};

export function GlobalSearch({ reviews: initialReviews = [] }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(-1);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery && selectedFilters.size === 0) {
      return [];
    }

    let filtered = reviews;

    if (selectedFilters.size > 0) {
      filtered = filtered.filter((review) => selectedFilters.has(review.category));
    }

    if (trimmedQuery) {
      const lowerQuery = trimmedQuery.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.title.toLowerCase().includes(lowerQuery) ||
          review.content?.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered.slice(0, 8);
  }, [query, selectedFilters, reviews]);

  useEffect(() => {
    if (reviews.length === 0) {
      fetch("/api/reviews?all=true")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setReviews(data.slice(0, 100));
          } else if (data?.reviews && Array.isArray(data.reviews)) {
            setReviews(data.reviews.slice(0, 100));
          }
        })
        .catch((error) => {
          console.error("Failed to fetch reviews for search:", error);
        });
    }
  }, [reviews.length]);

  const categories = ["game", "movie", "series"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleFilter = (category: string) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(category)) {
      newFilters.delete(category);
    } else {
      newFilters.add(category);
    }
    setSelectedFilters(newFilters);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && results.length > 0) {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length > 0) {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        handleResultClick(results[activeIndex].slug);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    } else {
      setActiveIndex(-1);
    }
  };

  const handleResultClick = (slug: string) => {
    router.push(`/reviews/${slug}`);
    setIsOpen(false);
    setQuery("");
    setActiveIndex(-1);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl lg:max-w-3xl">
      {/* Search Input */}
      <div className="search-field search-shine relative rounded-sm border border-input bg-background/50">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Suche nach Reviews"
          aria-expanded={isOpen}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `search-result-${results[activeIndex]?.id}` : undefined
          }
          autoComplete="off"
          placeholder="Suche nach Reviews..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          className="pl-11 pr-20 h-11 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {/* Kbd badge */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label="Suche löschen"
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
                inputRef.current?.focus();
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <kbd className="kbd-badge">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full shadow-xl z-50 max-h-[600px] overflow-hidden border border-border/50">
          <CardContent className="p-0" id="global-search-results">
            {/* Filter Tags */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Filter
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons];
                  const isSelected = selectedFilters.has(category);

                  return (
                    <button
                      key={category}
                      onClick={() => toggleFilter(category)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold transition-all duration-200 ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results */}
            <div
              className="max-h-[400px] overflow-y-auto"
              role="listbox"
              aria-label="Suchergebnisse"
            >
              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((review, index) => {
                    const Icon =
                      categoryIcons[review.category as keyof typeof categoryIcons] || Film;

                    return (
                      <button
                        key={review.id}
                        id={`search-result-${review.id}`}
                        role="option"
                        aria-selected={activeIndex === index}
                        onClick={() => handleResultClick(review.slug)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`w-full p-3 rounded-sm transition-all duration-200 text-left group ${
                          activeIndex === index
                            ? "bg-muted"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-sm bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                              {review.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {review.content?.substring(0, 100)}...
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs font-bold text-primary tabular-nums">
                                {review.score}/100
                              </span>
                              <span className="text-xs text-muted-foreground/40">|</span>
                              <span className="text-xs text-muted-foreground capitalize font-medium">
                                {review.category}
                              </span>
                            </div>
                          </div>
                          <svg
                            className="size-4 text-muted-foreground/30 group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5 shrink-0 mt-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 4.5l7.5 7.5-7.5 7.5"
                            />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : query || selectedFilters.size > 0 ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center size-12 rounded-full bg-muted mb-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Keine Ergebnisse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Versuche andere Suchbegriffe oder Filter
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center size-12 rounded-full bg-muted mb-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Beginne mit der Suche</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verwende Filter oder gib einen Suchbegriff ein
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {!query && selectedFilters.size === 0 && (
              <div className="p-4 border-t border-border bg-muted/30">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">
                  Schnellzugriff
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/reviews"
                    className="px-3 py-1.5 rounded-sm bg-background border border-border hover:border-primary/40 hover:text-primary text-xs font-semibold transition-all duration-200"
                  >
                    Alle Reviews
                  </Link>
                  <Link
                    href="/reviews?sort=score-desc"
                    className="px-3 py-1.5 rounded-sm bg-background border border-border hover:border-primary/40 hover:text-primary text-xs font-semibold transition-all duration-200"
                  >
                    Top Bewertete
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
