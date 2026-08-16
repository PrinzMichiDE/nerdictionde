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

    // Filter by category
    if (selectedFilters.size > 0) {
      filtered = filtered.filter((review) => selectedFilters.has(review.category));
    }

    // Filter by query
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

  // Fetch reviews if not provided
  useEffect(() => {
    if (reviews.length === 0) {
      fetch("/api/reviews?all=true")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setReviews(data.slice(0, 100)); // Limit for performance
          } else if (data?.reviews && Array.isArray(data.reviews)) {
            // Handle paginated response format
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
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
          placeholder="Suche nach Reviews... (⌘K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          className="pl-11 pr-10 h-11 text-base border focus:border-primary rounded-sm"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            aria-label="Suche löschen"
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full shadow-lg z-50 max-h-[600px] overflow-hidden">
          <CardContent className="p-0" id="global-search-results">
            {/* Filter Tags */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Filter:
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
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
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
                        className={`w-full p-3 rounded-sm transition-colors text-left group ${
                          activeIndex === index ? "bg-muted" : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-sm bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                              {review.title}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {review.content?.substring(0, 100)}...
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs font-medium text-primary">
                                Score: {review.score}/100
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {review.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : query || selectedFilters.size > 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">Keine Ergebnisse gefunden</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Versuche andere Suchbegriffe oder Filter
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Beginne mit der Suche...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Verwende Filter oder gib einen Suchbegriff ein
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {!query && selectedFilters.size === 0 && (
              <div className="p-4 border-t border-border bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Quick Actions:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/reviews"
                    className="px-3 py-1.5 rounded-sm bg-background border border-border hover:border-primary hover:text-primary text-sm font-medium transition-colors"
                  >
                    Alle Reviews
                  </Link>
                  <Link
                    href="/reviews?sort=score-desc"
                    className="px-3 py-1.5 rounded-sm bg-background border border-border hover:border-primary hover:text-primary text-sm font-medium transition-colors"
                  >
                    Top Reviews
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
