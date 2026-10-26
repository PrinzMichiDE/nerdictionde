"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  X,
  ChevronDown,
  Tag,
  Star,
  Calendar,
  SlidersHorizontal,
  Film,
  TicketPercent,
  Monitor,
  Gamepad2,
  Euro,
  Code,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CANONICAL_PLATFORMS } from "@/lib/platform-utils";

interface SearchFiltersProps {
  category: string;
  minScore: string;
  maxScore: string;
  tags: string[];
  sort: string;
  releaseDateFrom: string;
  releaseDateTo: string;
  minPrice: string;
  maxPrice: string;
  platforms: string[];
  hasVideo: boolean;
  hasDeal: boolean;
  developer: string;
  publisher: string;
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
] as const;

const ADVANCED_ENABLED = process.env.NEXT_PUBLIC_FEATURE_ADVANCED_SEARCH_FILTERS === "true";

export function SearchFilters({
  category,
  minScore,
  maxScore,
  tags,
  sort,
  releaseDateFrom,
  releaseDateTo,
  minPrice,
  maxPrice,
  platforms,
  hasVideo,
  hasDeal,
  developer,
  publisher,
  initialCategories,
  initialSortOptions,
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Bestehende State
  const [localCategory, setLocalCategory] = useState<string>(() => category);
  const [localMinScore, setLocalMinScore] = useState<string>(() => minScore);
  const [localMaxScore, setLocalMaxScore] = useState<string>(() => maxScore);
  const [localSort, setLocalSort] = useState<string>(() => sort);
  const [showCategory, setShowCategory] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showScore, setShowScore] = useState(false);

  // NEU: Advanced Filter State
  const [localReleaseFrom, setLocalReleaseFrom] = useState<string>(() => releaseDateFrom);
  const [localReleaseTo, setLocalReleaseTo] = useState<string>(() => releaseDateTo);
  const [localMinPrice, setLocalMinPrice] = useState<string>(() => minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState<string>(() => maxPrice);
  const [localPlatforms, setLocalPlatforms] = useState<string[]>(() => platforms);
  const [localHasVideo, setLocalHasVideo] = useState<boolean>(() => hasVideo);
  const [localHasDeal, setLocalHasDeal] = useState<boolean>(() => hasDeal);
  const [localDeveloper, setLocalDeveloper] = useState<string>(() => developer);
  const [localPublisher, setLocalPublisher] = useState<string>(() => publisher);

  const [showDate, setShowDate] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

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
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDate(false);
      }
      if (priceRef.current && !priceRef.current.contains(e.target as Node)) {
        setShowPrice(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateURL = useCallback(
    (newParams: Record<string, string | string[] | boolean | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");

      Object.entries(newParams).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === "" ||
          value === false ||
          (Array.isArray(value) && value.length === 0)
        ) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else if (typeof value === "boolean") {
          params.set(key, value ? "true" : "false");
        } else {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      router.push(queryString ? `/suche?${queryString}` : "/suche", { scroll: false });
    },
    [router, searchParams]
  );

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

  // NEU: Release-Datum Handler
  const handleReleaseDateChange = (from: string, to: string) => {
    setLocalReleaseFrom(from);
    setLocalReleaseTo(to);
    updateURL({
      releaseDateFrom: from || undefined,
      releaseDateTo: to || undefined,
    });
  };

  const handleReleaseFromChange = (value: string) => {
    setLocalReleaseFrom(value);
    // Validierung: from <= to
    if (value && localReleaseTo && value > localReleaseTo) {
      setLocalReleaseTo(value);
      updateURL({ releaseDateFrom: value, releaseDateTo: value });
    } else {
      updateURL({ releaseDateFrom: value || undefined });
    }
  };

  const handleReleaseToChange = (value: string) => {
    setLocalReleaseTo(value);
    if (value && localReleaseFrom && value < localReleaseFrom) {
      setLocalReleaseFrom(value);
      updateURL({ releaseDateFrom: value, releaseDateTo: value });
    } else {
      updateURL({ releaseDateTo: value || undefined });
    }
  };

  // NEU: Preis Handler
  const handlePriceChange = (min: string, max: string) => {
    setLocalMinPrice(min);
    setLocalMaxPrice(max);
    updateURL({
      minPrice: min || undefined,
      maxPrice: max || undefined,
    });
  };

  const handleMinPriceChange = (value: string) => {
    setLocalMinPrice(value);
    if (value && localMaxPrice && Number(value) > Number(localMaxPrice)) {
      setLocalMaxPrice(value);
      updateURL({ minPrice: value, maxPrice: value });
    } else {
      updateURL({ minPrice: value || undefined });
    }
  };

  const handleMaxPriceChange = (value: string) => {
    setLocalMaxPrice(value);
    if (value && localMinPrice && Number(value) < Number(localMinPrice)) {
      setLocalMinPrice(value);
      updateURL({ minPrice: value, maxPrice: value });
    } else {
      updateURL({ maxPrice: value || undefined });
    }
  };

  // NEU: Plattform Handler
  const handlePlatformToggle = (platform: string) => {
    const newPlatforms = localPlatforms.includes(platform)
      ? localPlatforms.filter((p) => p !== platform)
      : [...localPlatforms, platform];
    setLocalPlatforms(newPlatforms);
    updateURL({ platforms: newPlatforms.length > 0 ? newPlatforms : undefined });
  };

  // NEU: Video/Deal Handler
  const handleHasVideoChange = (checked: boolean) => {
    setLocalHasVideo(checked);
    updateURL({ hasVideo: checked });
  };

  const handleHasDealChange = (checked: boolean) => {
    setLocalHasDeal(checked);
    updateURL({ hasDeal: checked });
  };

  // NEU: Developer/Publisher Handler (debounced)
  const handleDeveloperChange = (value: string) => {
    setLocalDeveloper(value);
    updateURL({ developer: value.trim() || undefined });
  };

  const handlePublisherChange = (value: string) => {
    setLocalPublisher(value);
    updateURL({ publisher: value.trim() || undefined });
  };

  const clearAllFilters = () => {
    setLocalCategory("all");
    setLocalMinScore("");
    setLocalMaxScore("");
    setLocalSort("relevance");
    setLocalReleaseFrom("");
    setLocalReleaseTo("");
    setLocalMinPrice("");
    setLocalMaxPrice("");
    setLocalPlatforms([]);
    setLocalHasVideo(false);
    setLocalHasDeal(false);
    setLocalDeveloper("");
    setLocalPublisher("");
    router.push("/suche", { scroll: false });
  };

  const hasActiveFilters =
    category !== "all" ||
    minScore ||
    maxScore ||
    tags.length > 0 ||
    sort !== "relevance" ||
    releaseDateFrom ||
    releaseDateTo ||
    minPrice ||
    maxPrice ||
    platforms.length > 0 ||
    hasVideo ||
    hasDeal ||
    developer ||
    publisher;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div
      ref={categoryRef}
      className="filters-bar sticky top-16 z-30 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8"
    >
      <span className="filter-progress" aria-hidden="true" />
      <div className="py-4 space-y-4">
        {/* Row 1: Category + Sort + Score + Release + Price */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {/* Category Dropdown */}
          <div className="relative flex-shrink-0" ref={categoryRef}>
            <button
              type="button"
              onClick={() => setShowCategory(!showCategory)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
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
          <div className="relative flex-shrink-0" ref={sortRef}>
            <button
              type="button"
              onClick={() => setShowSort(!showSort)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
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
          <div className="relative flex-shrink-0" ref={scoreRef}>
            <button
              type="button"
              onClick={() => setShowScore(!showScore)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
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

          {/* NEU: Release-Datum Dropdown */}
          {ADVANCED_ENABLED && (
            <div className="relative flex-shrink-0" ref={dateRef}>
              <button
                type="button"
                onClick={() => setShowDate(!showDate)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  showDate ? "ring-2 ring-ring" : "hover:bg-accent/50"
                )}
                aria-expanded={showDate}
                aria-haspopup="dialog"
                aria-label="Release-Datum filtern"
              >
                <Calendar className="size-3.5 text-muted-foreground" />
                <span>Release</span>
                <ChevronDown
                  className={cn("size-4 transition-transform", showDate && "rotate-180")}
                  aria-hidden="true"
                />
              </button>

              {showDate && (
                <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-3 shadow-lg min-w-[320px]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="releaseFrom" className="text-xs font-medium text-muted-foreground block mb-1">
                        Von
                      </label>
                      <input
                        type="date"
                        id="releaseFrom"
                        value={localReleaseFrom}
                        onChange={(e) => handleReleaseFromChange(e.target.value)}
                        max={today}
                        className="w-full h-8 rounded-sm border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div>
                      <label htmlFor="releaseTo" className="text-xs font-medium text-muted-foreground block mb-1">
                        Bis
                      </label>
                      <input
                        type="date"
                        id="releaseTo"
                        value={localReleaseTo}
                        onChange={(e) => handleReleaseToChange(e.target.value)}
                        max={today}
                        className="w-full h-8 rounded-sm border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NEU: Preis Dropdown */}
          {ADVANCED_ENABLED && (
            <div className="relative flex-shrink-0" ref={priceRef}>
              <button
                type="button"
                onClick={() => setShowPrice(!showPrice)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  showPrice ? "ring-2 ring-ring" : "hover:bg-accent/50"
                )}
                aria-expanded={showPrice}
                aria-haspopup="dialog"
                aria-label="Preis filtern"
              >
                <Euro className="size-3.5 text-muted-foreground" />
                <span>Preis</span>
                <ChevronDown
                  className={cn("size-4 transition-transform", showPrice && "rotate-180")}
                  aria-hidden="true"
                />
              </button>

              {showPrice && (
                <div className="absolute left-0 top-full z-10 mt-1 rounded-lg border border-border bg-card p-3 shadow-lg min-w-[280px]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="minPrice" className="text-xs font-medium text-muted-foreground block mb-1">
                        Min (EUR)
                      </label>
                      <input
                        type="number"
                        id="minPrice"
                        value={localMinPrice}
                        onChange={(e) => handleMinPriceChange(e.target.value)}
                        min={0}
                        step={0.01}
                        placeholder="z. B. 10"
                        className="w-full h-8 rounded-sm border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div>
                      <label htmlFor="maxPrice" className="text-xs font-medium text-muted-foreground block mb-1">
                        Max (EUR)
                      </label>
                      <input
                        type="number"
                        id="maxPrice"
                        value={localMaxPrice}
                        onChange={(e) => handleMaxPriceChange(e.target.value)}
                        min={0}
                        step={0.01}
                        placeholder="z. B. 50"
                        className="w-full h-8 rounded-sm border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* NEU: Advanced Filter Toggle & Content */}
        {ADVANCED_ENABLED && (
          <>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm px-2 py-1"
              aria-expanded={showAdvanced}
            >
              {showAdvanced ? (
                <>
                  <ChevronDown className="size-4 rotate-180 inline-block mr-1" aria-hidden="true" />
                  Weniger Filter
                </>
              ) : (
                <>
                  <ChevronDown className="size-4 inline-block mr-1" aria-hidden="true" />
                  Weitere Filter
                </>
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Plattform Multi-Select */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2 flex items-center gap-1.5">
                    <Monitor className="size-3.5" />
                    Plattform
                  </label>
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Plattform auswählen">
                    {CANONICAL_PLATFORMS.map((p) => (
                      <label
                        key={p}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm cursor-pointer transition-colors",
                          localPlatforms.includes(p)
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border hover:bg-accent/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          value={p}
                          checked={localPlatforms.includes(p)}
                          onChange={() => handlePlatformToggle(p)}
                          className="sr-only"
                          aria-label={p}
                        />
                        <span>{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Checkboxen: Video, Deal */}
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm cursor-pointer transition-colors",
                      localHasVideo
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:bg-accent/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={localHasVideo}
                      onChange={(e) => handleHasVideoChange(e.target.checked)}
                      className="sr-only"
                      aria-label="Nur Reviews mit Video"
                    />
                    <Film className="size-4" aria-hidden="true" />
                    <span>Mit Video</span>
                  </label>

                  <label
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm cursor-pointer transition-colors",
                      localHasDeal
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:bg-accent/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={localHasDeal}
                      onChange={(e) => handleHasDealChange(e.target.checked)}
                      className="sr-only"
                      aria-label="Nur Reviews mit Deal"
                    />
                    <TicketPercent className="size-4" aria-hidden="true" />
                    <span>Mit Deal</span>
                  </label>
                </div>

                {/* Developer / Publisher Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="developer" className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                      <Code className="size-3.5" />
                      Entwickler
                    </label>
                    <input
                      type="text"
                      id="developer"
                      value={localDeveloper}
                      onChange={(e) => handleDeveloperChange(e.target.value)}
                      placeholder="z. B. CD Projekt"
                      maxLength={100}
                      className="w-full h-8 rounded-sm border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label htmlFor="publisher" className="text-xs font-medium text-muted-foreground block mb-1 flex items-center gap-1">
                      <Building2 className="size-3.5" />
                      Publisher
                    </label>
                    <input
                      type="text"
                      id="publisher"
                      value={localPublisher}
                      onChange={(e) => handlePublisherChange(e.target.value)}
                      placeholder="z. B. Bethesda"
                      maxLength={100}
                      className="w-full h-8 rounded-sm border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

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

        {/* NEU: Advanced Filter Active Badges */}
        {ADVANCED_ENABLED && (
          releaseDateFrom ||
          releaseDateTo ||
          minPrice ||
          maxPrice ||
          platforms.length > 0 ||
          hasVideo ||
          hasDeal ||
          developer ||
          publisher
        ) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground">Aktive erweiterte Filter:</span>
            <div className="flex flex-wrap gap-1.5">
              {releaseDateFrom && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-sm">
                  <Calendar className="size-3" />
                  Release: {releaseDateFrom}{releaseDateTo && ` – ${releaseDateTo}`}
                  <button
                    type="button"
                    onClick={() => handleReleaseDateChange("", "")}
                    aria-label="Release-Filter entfernen"
                    className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {minPrice && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-sm">
                  <Euro className="size-3" />
                  Preis: ≥{minPrice}€
                  <button
                    type="button"
                    onClick={() => handlePriceChange("", maxPrice || "")}
                    aria-label="Min-Preis-Filter entfernen"
                    className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {maxPrice && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-sm">
                  <Euro className="size-3" />
                  Preis: ≤{maxPrice}€
                  <button
                    type="button"
                    onClick={() => handlePriceChange(minPrice || "", "")}
                    aria-label="Max-Preis-Filter entfernen"
                    className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {platforms.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-sm">
                  <Monitor className="size-3" />
                  {p}
                  <button
                    type="button"
                    onClick={() => handlePlatformToggle(p)}
                    aria-label={`Plattform ${p} entfernen`}
                    className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {hasVideo && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-sm">
                  <Film className="size-3" />
                  Mit Video
                  <button
                    type="button"
                    onClick={() => handleHasVideoChange(false)}
                    aria-label="Video-Filter entfernen"
                    className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {hasDeal && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-sm">
                  <TicketPercent className="size-3" />
                  Mit Deal
                  <button
                    type="button"
                    onClick={() => handleHasDealChange(false)}
                    aria-label="Deal-Filter entfernen"
                    className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {developer && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-sm">
                  <Code className="size-3" />
                  Dev: {developer}
                  <button
                    type="button"
                    onClick={() => handleDeveloperChange("")}
                    aria-label="Entwickler-Filter entfernen"
                    className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {publisher && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-sm">
                  <Building2 className="size-3" />
                  Pub: {publisher}
                  <button
                    type="button"
                    onClick={() => handlePublisherChange("")}
                    aria-label="Publisher-Filter entfernen"
                    className="text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
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