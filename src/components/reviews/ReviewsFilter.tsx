"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  SortDesc,
  Calendar,
  Star,
  LayoutGrid,
  Gamepad2,
  Film,
  Tv,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CategoryCounts {
  all: number;
  game: number;
  movie: number;
  series: number;
}

interface ReviewsFilterProps {
  categoryCounts?: CategoryCounts | null;
}

const categoryTabs = [
  { value: "all", label: "Alle", icon: LayoutGrid, color: "var(--primary)" },
  { value: "game", label: "Games", icon: Gamepad2, color: "var(--chart-3)" },
  { value: "movie", label: "Filme", icon: Film, color: "var(--chart-2)" },
  { value: "series", label: "Serien", icon: Tv, color: "var(--chart-5)" },
] as const;

const scoreKeyShortcut = "/";

export function ReviewsFilter({ categoryCounts }: ReviewsFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [category, setCategory] = useState<string>(searchParams.get("category") || "all");
  const [sort, setSort] = useState<string>(searchParams.get("sort") || "date-desc");
  const [dateFilter, setDateFilter] = useState<string>(searchParams.get("dateFilter") || "all");
  const [minScore, setMinScore] = useState(searchParams.get("minScore") || "");
  const [maxScore, setMaxScore] = useState(searchParams.get("maxScore") || "");

  const updateURL = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
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

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === scoreKeyShortcut && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const handleScoreChange = (type: "min" | "max", value: string) => {
    if (type === "min") setMinScore(value);
    else setMaxScore(value);
    updateURL({ [type === "min" ? "minScore" : "maxScore"]: value || null });
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

  const hasActiveFilters =
    query ||
    category !== "all" ||
    sort !== "date-desc" ||
    dateFilter !== "all" ||
    minScore ||
    maxScore;

  return (
    <div className="filter-bar sticky top-16 z-30 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 xl:-mx-12 xl:px-12">
      <span className="filter-progress" aria-hidden="true" />
      <div className="py-4 space-y-4">
        {/* Row 1 — Kategorie-Tabs + Suche */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Kategorie filtern"
            className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0"
          >
            {categoryTabs.map((tab) => {
              const Icon = tab.icon;
              const active = category === tab.value;
              const count = categoryCounts ? categoryCounts[tab.value] : null;
              return (
                <button
                  key={tab.value}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  data-active={active}
                  onClick={() => handleCategoryChange(tab.value)}
                  className={cn("filter-tab inline-flex items-center whitespace-nowrap")}
                  style={{ "--tab-color": tab.color } as CSSProperties}
                >
                  <Icon className="size-3.5 mr-1.5" />
                  {tab.label}
                  {count !== null && count !== undefined && (
                    <span className="filter-tab-count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Titel oder Inhalt durchsuchen…"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = setTimeout(() => updateURL({ query: v || null }), 300);
              }}
              className="h-9 pl-9 pr-9 rounded-sm"
            />
            {query ? (
              <button
                onClick={() => {
                  setQuery("");
                  updateURL({ query: null });
                }}
                aria-label="Suche leeren"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                <X className="size-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-flex">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Row 2 — Sortierung / Zeitraum / Score */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            <SlidersHorizontal className="size-3.5" />
            Sortieren
          </span>

          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger
              className="h-8 w-auto gap-2 rounded-sm text-xs px-3"
              aria-label="Sortierung"
            >
              <SortDesc className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Neueste zuerst" />
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

          <Select value={dateFilter} onValueChange={handleDateChange}>
            <SelectTrigger
              className="h-8 w-auto gap-2 rounded-sm text-xs px-3"
              aria-label="Zeitraum"
            >
              <Calendar className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Zeitraum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Gesamter Zeitraum</SelectItem>
              <SelectItem value="7d">Letzte 7 Tage</SelectItem>
              <SelectItem value="30d">Letzte 30 Tage</SelectItem>
              <SelectItem value="90d">Letzte 90 Tage</SelectItem>
              <SelectItem value="year">Dieses Jahr</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 rounded-sm border border-border bg-card h-8 px-2">
            <Star className="size-3 text-muted-foreground" />
            <input
              type="number"
              placeholder="Min"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => handleScoreChange("min", e.target.value)}
              className="h-7 w-11 bg-transparent text-xs focus:outline-none tabular-nums"
              aria-label="Minimaler Score"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <input
              type="number"
              placeholder="Max"
              min="0"
              max="100"
              value={maxScore}
              onChange={(e) => handleScoreChange("max", e.target.value)}
              className="h-7 w-11 bg-transparent text-xs focus:outline-none tabular-nums"
              aria-label="Maximaler Score"
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3 mr-1" />
              Zurücksetzen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
