"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, ChevronDown, Tag, Star, Calendar, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  category: string;
  minScore: string;
  maxScore: string;
  tags: string[];
  sort: string;
  initialCategories: readonly { value: string; label: string }[];
  initialSortOptions: readonly { value: string; label: string }[];
}

const SCORE_OPTIONS = [
  { value: "", label: "Min" },
  { value: "20", label: "20+" },
  { value: "40", label: "40+" },
  { value: "60", label: "60+" },
  { value: "70", label: "70+" },
  { value: "80", label: "80+" },
  { value: "90", label: "90+" },
];

export function SearchFilters({
  category,
  minScore,
  maxScore,
  tags,
  sort,
  initialCategories,
  initialSortOptions,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localCategory, setLocalCategory] = useState(category);
  const [localMinScore, setLocalMinScore] = useState(minScore);
  const [localMaxScore, setLocalMaxScore] = useState(maxScore);
  const [localSort, setLocalSort] = useState(sort);
  const [showCategory, setShowCategory] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);

  // Sync local state with URL params on mount
  useEffect(() => {
    setLocalCategory(category);
    setLocalMinScore(minScore);
    setLocalMaxScore(maxScore);
    setLocalSort(sort);
  }, [category, minScore, maxScore, sort]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setShowCategory(false);
      }
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSort(false);
      }
      if (scoreRef.current && !scoreRef.current.contains(e.target as Node)) {
        setShowScore(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateURL = (newParams: Record<string, string | string[] | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    router.push(queryString ? `/suche?${queryString}` : "/suche", { scroll: false });
  };

  const handleCategoryChange = (value: string) => {
    setLocalCategory(value);
    updateURL({ category: value !== "all" ? value : undefined });
    setShowCategory(false);
  };

  const handleSortChange = (value: string) => {
    setLocalSort(value);
    updateURL({ sort: value !== "relevance" ? value : undefined });
    setShowSort(false);
  };

  const handleMinScoreChange = (value: string) => {
    setLocalMinScore(value);
    updateURL({ minScore: value || undefined });
  };

  const handleMaxScoreChange = (value: string) => {
    setLocalMaxScore(value);
    updateURL({ maxScore: value || undefined });
  };

  const handleTagToggle = (tagSlug: string) => {
    const newTags = tags.includes(tagSlug)
      ? tags.filter((t) => t !== tagSlug)
      : [...tags, tagSlug];
    updateURL({ tags: newTags.length > 0 ? newTags : undefined });
  };

  const clearAllFilters = () => {
    setLocalCategory("all");
    setLocalMinScore("");
    setLocalMaxScore("");
    setLocalSort("relevance");
    router.push("/suche", { scroll: false });
  };

  const hasActiveFilters =
    category !== "all" ||
    minScore ||
    maxScore ||
    tags.length > 0 ||
    sort !== "relevance";

  return (
    <div
      ref={categoryRef}
      className="filters-bar sticky top-16 z-30 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8"
    >
      <span className="filter-progress" aria-hidden="true" />
      <div className="py-4 space-y-4">
        {/* Row 1: Category + Sort + Score */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="relative" ref={categoryRef}>
            <button
              type="button"
              onClick={() => setShowCategory(!showCategory)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors",
                showCategory ? "ring-2 ring-ring" : "hover:bg-accent/50"
              )}
              aria-expanded={showCategory}
              aria-haspopup="listbox"
              aria-label="Kategorie filtern"
            >
              <SlidersHorizontal className="size-3.5 text-muted-foreground" />
              <span>{initialCategories.find((c) => c.value === localCategory)?.label || "Alle"}</span>
              <ChevronDown
                className={cn("size-4 transition-transform", showCategory && "rotate-180")}
                aria-hidden="true"
              />
            </button>

            {showCategory && (
              <div
                className="absolute left-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-border bg-card shadow-lg overflow-hidden"
                role="listbox"
              >
                {initialCategories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    role="option"
                    aria-selected={localCategory === cat.value}
                    onClick={() => handleCategoryChange(cat.value)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors",
                      localCategory === cat.value
                        ? "bg-accent text-foreground font-medium"
                        : "hover:bg-accent/50"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setShowSort(!showSort)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors",
                showSort ? "ring-2 ring-ring" : "hover:bg-accent/50"
              )}
              aria-expanded={showSort}
              aria-haspopup="listbox"
              aria-label="Sortierung"
            >
              <ChevronDown className="size-3.5 text-muted-foreground" />
              <span>
                {initialSortOptions.find((s) => s.value === localSort)?.label || "Relevanz"}
              </span>
              <ChevronDown
                className={cn("size-4 transition-transform", showSort && "rotate-180")}
                aria-hidden="true"
              />
            </button>

            {showSort && (
              <div
                className="absolute left-0 top-full z-10 mt-1 min-w-[180px] rounded-lg border border-border bg-card shadow-lg overflow-hidden"
                role="listbox"
              >
                {initialSortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={localSort === opt.value}
                    onClick={() => handleSortChange(opt.value)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm transition-colors",
                      localSort === opt.value
                        ? "bg-accent text-foreground font-medium"
                        : "hover:bg-accent/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Score Range */}
          <div className="relative" ref={scoreRef}>
            <button
              type="button"
              onClick={() => setShowScore(!showScore)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors",
                showScore ? "ring-2 ring-ring" : "hover:bg-accent/50"
              )}
              aria-expanded={showScore}
              aria-haspopup="dialog"
              aria-label="Score filtern"
            >
              <Star className="size-3.5 text-muted-foreground" />
              <span>Score</span>
              <ChevronDown
                className={cn("size-4 transition-transform", showScore && "rotate-180")}
                aria-hidden="true"
              />
            </button>

            {showScore && (
              <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-3 shadow-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="minScore" className="text-xs font-medium text-muted-foreground block mb-1">
                      Min
                    </label>
                    <select
                      id="minScore"
                      value={localMinScore}
                      onChange={(e) => handleMinScoreChange(e.target.value)}
                      className="w-full h-8 rounded-sm border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {SCORE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="maxScore" className="text-xs font-medium text-muted-foreground block mb-1">
                      Max
                    </label>
                    <select
                      id="maxScore"
                      value={localMaxScore}
                      onChange={(e) => handleMaxScoreChange(e.target.value)}
                      className="w-full h-8 rounded-sm border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {SCORE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground">Tags:</span>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-sm text-foreground"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    aria-label={`Tag ${tag} entfernen`}
                    className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Row 3: Clear filters */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1"
            >
              Alle Filter zurücksetzen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}