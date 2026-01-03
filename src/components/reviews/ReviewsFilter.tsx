"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Filter, SortDesc, Calendar, Star, ChevronDown, ChevronUp, Grid3x3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReviewCategory } from "@/types/review";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface ReviewsFilterProps {
  onViewChange?: (view: "grid" | "list") => void;
  currentView?: "grid" | "list";
}

export function ReviewsFilter({ onViewChange, currentView = "grid" }: ReviewsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States for all filters
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [category, setCategory] = useState<string>(searchParams.get("category") || "all");
  const [sort, setSort] = useState<string>(searchParams.get("sort") || "date-desc");
  const [dateFilter, setDateFilter] = useState<string>(searchParams.get("dateFilter") || "all");
  const [minScore, setMinScore] = useState(searchParams.get("minScore") || "");
  const [maxScore, setMaxScore] = useState(searchParams.get("maxScore") || "");
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebounce(query, 500);

  // Update URL whenever a filter changes
  const updateURL = useCallback((newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Reset to page 1 when filters change
    params.set("page", "1");

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    router.push(queryString ? `/reviews?${queryString}` : "/reviews", { scroll: false });
  }, [router, searchParams]);

  // Update URL when debounced query changes
  useEffect(() => {
    updateURL({ query: debouncedQuery || null });
  }, [debouncedQuery, updateURL]);

  const handleSearch = (value: string) => {
    setQuery(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    updateURL({ category: value });
  };

  const handleSortChange = (value: string) => {
    setSort(value);
    updateURL({ sort: value });
  };

  const handleDateChange = (value: string) => {
    setDateFilter(value);
    updateURL({ dateFilter: value });
  };

  const handleScoreChange = (type: 'min' | 'max', value: string) => {
    if (type === 'min') setMinScore(value);
    else setMaxScore(value);
    
    updateURL({ [type === 'min' ? 'minScore' : 'maxScore']: value || null });
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setSort("date-desc");
    setDateFilter("all");
    setMinScore("");
    setMaxScore("");
    router.push("/reviews", { scroll: false });
  };

  const hasActiveFilters = query || category !== "all" || sort !== "date-desc" || dateFilter !== "all" || minScore || maxScore;

  // Quick filter categories
  const quickFilters = [
    { value: "all", label: "Alle", icon: null },
    { value: "game", label: "Games", icon: null },
    { value: "hardware", label: "Hardware", icon: null },
    { value: "amazon", label: "Amazon", icon: null },
  ];

  return (
    <div className="space-y-6 pb-6 border-b">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="size-4 text-primary" />
          <span>Filter & Suche</span>
        </div>
        <div className="flex items-center gap-2">
          {onViewChange && (
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border">
              <Button
                variant={currentView === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("grid")}
                className="h-7 px-2"
                aria-label="Grid-Ansicht"
              >
                <Grid3x3 className="size-4" />
              </Button>
              <Button
                variant={currentView === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("list")}
                className="h-7 px-2"
                aria-label="Listen-Ansicht"
              >
                <List className="size-4" />
              </Button>
            </div>
          )}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
              aria-label="Alle Filter zurücksetzen"
            >
              <X className="size-3 mr-1" />
              Zurücksetzen
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {quickFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={category === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(filter.value)}
            className={cn(
              "h-8 rounded-full text-xs font-medium transition-all",
              category === filter.value && "shadow-md"
            )}
            aria-label={`Filter nach ${filter.label}`}
            aria-pressed={category === filter.value}
          >
            {filter.label}
          </Button>
        ))}
      </div>
      
      {/* Advanced Filters - Collapsible */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full sm:w-auto justify-between sm:justify-start gap-2 text-xs text-muted-foreground hover:text-foreground"
          aria-expanded={isExpanded}
          aria-controls="advanced-filters"
        >
          <span>Erweiterte Filter</span>
          {isExpanded ? (
            <ChevronUp className="size-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" aria-hidden="true" />
          )}
        </Button>

        <div
          id="advanced-filters"
          className={cn(
            "grid gap-4 transition-all duration-300 overflow-hidden",
            isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 sm:max-h-[500px] sm:opacity-100"
          )}
        >
          {/* Search */}
          <div className="relative col-span-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Nach Titel oder Inhalt suchen..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 pr-9"
              aria-label="Nach Reviews suchen"
            />
            {query && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-label="Suche zurücksetzen"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="col-span-full sm:col-span-1">
            <Select value={sort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full" aria-label="Sortierung">
                <div className="flex items-center gap-2">
                  <SortDesc className="size-4 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder="Sortieren nach" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Neueste zuerst</SelectItem>
                <SelectItem value="date-asc">Älteste zuerst</SelectItem>
                <SelectItem value="score-desc">Beste Wertung</SelectItem>
                <SelectItem value="score-asc">Niedrigste Wertung</SelectItem>
                <SelectItem value="title-asc">Titel A-Z</SelectItem>
                <SelectItem value="title-desc">Titel Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="col-span-full sm:col-span-1">
            <Select value={dateFilter} onValueChange={handleDateChange}>
              <SelectTrigger className="w-full" aria-label="Zeitraum">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
                  <SelectValue placeholder="Zeitraum" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Gesamter Zeitraum</SelectItem>
                <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                <SelectItem value="90d">Letzte 90 Tage</SelectItem>
                <SelectItem value="year">Dieses Jahr</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Score Range */}
          <div className="col-span-full sm:col-span-1">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Star className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => handleScoreChange('min', e.target.value)}
                  className="h-9 pl-7 text-xs"
                  aria-label="Mindest-Score"
                />
              </div>
              <span className="text-muted-foreground font-medium">-</span>
              <div className="relative flex-1">
                <Input
                  type="number"
                  placeholder="Max"
                  min="0"
                  max="100"
                  value={maxScore}
                  onChange={(e) => handleScoreChange('max', e.target.value)}
                  className="h-9 text-xs"
                  aria-label="Maximal-Score"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aktive Filter:</span>
          {query && (
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs h-6">
              <span>Suche: {query.length > 20 ? `${query.substring(0, 20)}...` : query}</span>
              <button
                onClick={() => handleSearch("")}
                className="hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Suche-Filter entfernen"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {category !== "all" && (
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs h-6 capitalize">
              <span>{category}</span>
              <button
                onClick={() => handleCategoryChange("all")}
                className="hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Kategorie-Filter entfernen"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {dateFilter !== "all" && (
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs h-6">
              <span>Zeitraum: {dateFilter === "7d" ? "7 Tage" : dateFilter === "30d" ? "30 Tage" : dateFilter === "90d" ? "90 Tage" : "Dieses Jahr"}</span>
              <button
                onClick={() => handleDateChange("all")}
                className="hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Zeitraum-Filter entfernen"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {(minScore || maxScore) && (
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs h-6">
              <span>Score: {minScore || 0} - {maxScore || 100}</span>
              <button
                onClick={() => { setMinScore(""); setMaxScore(""); updateURL({ minScore: null, maxScore: null }); }}
                className="hover:bg-secondary-foreground/20 rounded-full p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Score-Filter entfernen"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
