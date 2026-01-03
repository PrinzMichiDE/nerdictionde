"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Review } from "@/types/review";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getSearchSuggestions } from "@/lib/search";
import { trackSearch } from "@/lib/analytics";

interface SearchResult {
  reviews: Review[];
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Review[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load all reviews for suggestions (once)
  useEffect(() => {
    fetch("/api/reviews?limit=100")
      .then((res) => res.json())
      .then((data) => {
        const reviews = data.success && data.data?.reviews 
          ? data.data.reviews 
          : data.reviews || [];
        setAllReviews(reviews);
      })
      .catch(() => {
        // Silently fail
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen || results.length === 0) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            router.push(`/reviews/${results[selectedIndex].slug}`);
            setIsOpen(false);
            setQuery("");
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, router]);

  // Generate suggestions
  useEffect(() => {
    if (query.length > 1 && allReviews.length > 0) {
      const searchSuggestions = getSearchSuggestions(allReviews, query, 3);
      setSuggestions(searchSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [query, allReviews]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/reviews?query=${encodeURIComponent(query)}&limit=5`);
        if (response.ok) {
          const apiResponse = await response.json();
          // Handle new API response format: { success: true, data: { reviews } }
          const reviews = apiResponse.success && apiResponse.data?.reviews 
            ? apiResponse.data.reviews 
            : Array.isArray(apiResponse) 
            ? apiResponse 
            : apiResponse.reviews || [];
          setResults(reviews.slice(0, 5)); // Limit to 5 results
          setIsOpen(reviews.length > 0);
          trackSearch(query, reviews.length);
        } else {
          setResults([]);
          setIsOpen(false);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleResultClick = (slug: string) => {
    router.push(`/reviews/${slug}`);
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Reviews durchsuchen..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="pl-9 pr-9 h-9 w-full"
          aria-label="Globale Suche nach Reviews"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-autocomplete="list"
          aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined}
          role="combobox"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            aria-label="Suche zurücksetzen"
          >
            <X className="size-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-9 top-1/2 -translate-y-1/2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Suggestions */}
      {isOpen && suggestions.length > 0 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-popover border rounded-md shadow-lg p-2">
          <div className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase">
            Vorschläge
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(suggestion);
                router.push(`/reviews?query=${encodeURIComponent(suggestion)}`);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {isOpen && results.length > 0 && (
        <div
          id="search-results"
          className="absolute z-50 w-full mt-2 bg-popover border rounded-md shadow-lg max-h-[400px] overflow-auto"
          role="listbox"
        >
          {results.map((review, index) => (
            <Link
              key={review.id}
              id={`search-result-${index}`}
              href={`/reviews/${review.slug}`}
              onClick={() => handleResultClick(review.slug)}
              className={cn(
                "block px-4 py-3 hover:bg-accent transition-colors border-b last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selectedIndex === index && "bg-accent"
              )}
              role="option"
              aria-selected={selectedIndex === index}
              tabIndex={-1}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{review.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {review.content.replace(/[#*`]/g, "").substring(0, 100)}...
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded capitalize">
                      {review.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Score: {review.score}/100
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {results.length >= 5 && (
            <Link
              href={`/reviews?query=${encodeURIComponent(query)}`}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-3 text-center text-sm font-medium text-primary hover:bg-accent border-t transition-colors"
            >
              Alle Ergebnisse anzeigen →
            </Link>
          )}
        </div>
      )}

      {isOpen && !isLoading && query.trim() && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-popover border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
          Keine Ergebnisse gefunden
        </div>
      )}
    </div>
  );
}

