"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Review } from "@/types/review";

interface AdvancedSearchProps {
  onSearch?: (query: string) => void;
  suggestions?: string[];
  recentSearches?: string[];
  className?: string;
}

export function AdvancedSearch({
  onSearch,
  suggestions = [],
  recentSearches = [],
  className,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recent-searches");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          recentSearches.push(...parsed.slice(0, 5));
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save to recent searches
    const recent = JSON.parse(localStorage.getItem("recent-searches") || "[]");
    const updated = [searchQuery, ...recent.filter((s: string) => s !== searchQuery)].slice(0, 10);
    localStorage.setItem("recent-searches", JSON.stringify(updated));

    // Navigate to search results
    router.push(`/reviews?query=${encodeURIComponent(searchQuery)}`);
    setIsOpen(false);
    setShowSuggestions(false);
    onSearch?.(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      handleSearch(query);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Erweiterte Suche... (Titel, Inhalt, Tags)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (query.length > 0 || recentSearches.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="pl-12 pr-12 h-12 text-base rounded-full border-2 focus-visible:border-primary"
          aria-label="Erweiterte Suche"
          aria-expanded={isOpen}
          aria-controls="search-suggestions"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            aria-label="Suche zurücksetzen"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            id="search-suggestions"
            className="absolute z-50 w-full mt-2 bg-popover border rounded-lg shadow-xl max-h-[400px] overflow-auto"
            role="listbox"
          >
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                  <TrendingUp className="size-3" />
                  Vorschläge
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
                    role="option"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && query.length === 0 && (
              <div className="p-2 border-t">
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                  <Clock className="size-3" />
                  Kürzliche Suchen
                </div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm flex items-center justify-between"
                    role="option"
                  >
                    <span>{search}</span>
                    <X
                      className="size-3 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        const recent = JSON.parse(
                          localStorage.getItem("recent-searches") || "[]"
                        );
                        const updated = recent.filter((s: string) => s !== search);
                        localStorage.setItem("recent-searches", JSON.stringify(updated));
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            {query.trim() && (
              <div className="p-2 border-t">
                <Button
                  onClick={() => handleSearch(query)}
                  className="w-full justify-center"
                  size="sm"
                >
                  <Search className="mr-2 size-4" />
                  Suche nach "{query}"
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
