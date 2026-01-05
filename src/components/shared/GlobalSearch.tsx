"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Filter, Gamepad2, Cpu, ShoppingCart, Film, Tv } from "lucide-react";
import Link from "next/link";
import { Review } from "@/types/review";
import { useRouter } from "next/navigation";

interface GlobalSearchProps {
  reviews?: Review[];
}

const categoryIcons = {
  game: Gamepad2,
  hardware: Cpu,
  amazon: ShoppingCart,
  movie: Film,
  series: Tv,
};

export function GlobalSearch({ reviews: initialReviews = [] }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Review[]>([]);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch reviews if not provided
  useEffect(() => {
    if (reviews.length === 0) {
      fetch("/api/reviews")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setReviews(data.slice(0, 100)); // Limit for performance
          }
        })
        .catch(() => {
          // Silently fail
        });
    }
  }, [reviews.length]);

  const categories = ["game", "hardware", "amazon", "movie", "series"];

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

  useEffect(() => {
    if (!query.trim() && selectedFilters.size === 0) {
      setResults([]);
      return;
    }

    let filtered = reviews;

    // Filter by category
    if (selectedFilters.size > 0) {
      filtered = filtered.filter((review) =>
        selectedFilters.has(review.category)
      );
    }

    // Filter by query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (review) =>
          review.title.toLowerCase().includes(lowerQuery) ||
          review.content?.toLowerCase().includes(lowerQuery)
      );
    }

    setResults(filtered.slice(0, 8));
  }, [query, selectedFilters, reviews]);

  const toggleFilter = (category: string) => {
    const newFilters = new Set(selectedFilters);
    if (newFilters.has(category)) {
      newFilters.delete(category);
    } else {
      newFilters.add(category);
    }
    setSelectedFilters(newFilters);
  };

  const handleResultClick = (slug: string) => {
    router.push(`/reviews/${slug}`);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl lg:max-w-3xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 md:left-5 lg:left-6 top-1/2 -translate-y-1/2 h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Suche nach Reviews... (⌘K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-12 md:pl-14 lg:pl-16 pr-12 md:pr-14 lg:pr-16 h-12 md:h-14 lg:h-16 text-base md:text-lg lg:text-xl border-2 focus:border-primary rounded-full"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full mt-2 w-full border-2 shadow-2xl z-50 max-h-[600px] overflow-hidden">
          <CardContent className="p-0">
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
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
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
            <div className="max-h-[400px] overflow-y-auto">
              {results.length > 0 ? (
                <div className="p-2">
                  {results.map((review) => {
                    const Icon =
                      categoryIcons[review.category as keyof typeof categoryIcons];

                    return (
                      <button
                        key={review.id}
                        onClick={() => handleResultClick(review.slug)}
                        className="w-full p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
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
                    className="px-3 py-1.5 rounded-lg bg-background border border-border hover:border-primary hover:text-primary text-sm font-medium transition-colors"
                  >
                    Alle Reviews
                  </Link>
                  <Link
                    href="/reviews?sort=score-desc"
                    className="px-3 py-1.5 rounded-lg bg-background border border-border hover:border-primary hover:text-primary text-sm font-medium transition-colors"
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
