"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Filter, SortDesc, Calendar, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ReviewCategory } from "@/types/review";
import { cn } from "@/lib/utils";

export function ReviewsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // States for all filters
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [category, setCategory] = useState<string>(searchParams.get("category") || "all");
  const [sort, setSort] = useState<string>(searchParams.get("sort") || "date-desc");
  const [dateFilter, setDateFilter] = useState<string>(searchParams.get("dateFilter") || "all");
  const [minScore, setMinScore] = useState(searchParams.get("minScore") || "");
  const [maxScore, setMaxScore] = useState(searchParams.get("maxScore") || "");

  // Update URL whenever a filter changes
  const updateURL = (newParams: Record<string, string | null>) => {
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
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    // Debounce this in a real app, but for now direct update
    updateURL({ query: value || null });
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

  return (
    <div className="space-y-6 pb-6 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="size-4" />
          <span>Filter & Suche</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="size-3 mr-1" />
            Filter zurücksetzen
          </Button>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Search */}
        <div className="relative col-span-full lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Nach Titel oder Inhalt suchen..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {query && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Category & Sort */}
        <div className="flex gap-2">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="flex-1" aria-label="Kategorie">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              <SelectItem value="game">Games</SelectItem>
              <SelectItem value="movie">Filme</SelectItem>
              <SelectItem value="series">Serien</SelectItem>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="amazon">Amazon</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="flex-1" aria-label="Sortierung">
              <div className="flex items-center gap-2">
                <SortDesc className="size-4 text-muted-foreground" />
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

        {/* Date & Score */}
        <div className="flex gap-2">
          <Select value={dateFilter} onValueChange={handleDateChange}>
            <SelectTrigger className="flex-1" aria-label="Zeitraum">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
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

          <div className="flex items-center gap-1 flex-1">
            <div className="relative flex-1">
              <Star className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              <Input
                type="number"
                placeholder="Min"
                min="0"
                max="100"
                value={minScore}
                onChange={(e) => handleScoreChange('min', e.target.value)}
                className="h-9 pl-7 text-xs"
              />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="relative flex-1">
              <Input
                type="number"
                placeholder="Max"
                min="0"
                max="100"
                value={maxScore}
                onChange={(e) => handleScoreChange('max', e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aktive Filter:</span>
          {query && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[10px] h-5">
              Suche: {query}
              <X className="size-2.5 cursor-pointer" onClick={() => handleSearch("")} />
            </Badge>
          )}
          {category !== "all" && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[10px] h-5 capitalize">
              {category}
              <X className="size-2.5 cursor-pointer" onClick={() => handleCategoryChange("all")} />
            </Badge>
          )}
          {dateFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[10px] h-5">
              Zeitraum: {dateFilter}
              <X className="size-2.5 cursor-pointer" onClick={() => handleDateChange("all")} />
            </Badge>
          )}
          {(minScore || maxScore) && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[10px] h-5">
              Score: {minScore || 0} - {maxScore || 100}
              <X className="size-2.5 cursor-pointer" onClick={() => { setMinScore(""); setMaxScore(""); updateURL({ minScore: null, maxScore: null }); }} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ children, variant, className }: any) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
      variant === "secondary" ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80" : "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
      className
    )}>
      {children}
    </span>
  );
}
