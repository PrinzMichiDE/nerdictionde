"use client";

import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PCBuildCard } from "@/components/gaming-pcs/PCBuildCard";
import { PCBuild } from "@/types/pc-build";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, TrendingUp, Zap, DollarSign, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface GamingPCsTabsProps {
  desktops: PCBuild[];
  laptops: PCBuild[];
}

type PriceRange = "all" | "budget" | "mid-range" | "high-end" | "premium";
type SortOption = "price-asc" | "price-desc" | "performance";

const PRICE_RANGES: Record<PriceRange, { label: string; min?: number; max?: number; icon: typeof DollarSign }> = {
  all: { label: "Alle Preise", icon: DollarSign },
  budget: { label: "Budget (bis 800€)", min: 0, max: 800, icon: DollarSign },
  "mid-range": { label: "Mid-Range (800-1500€)", min: 800, max: 1500, icon: TrendingUp },
  "high-end": { label: "High-End (1500-2500€)", min: 1500, max: 2500, icon: Zap },
  premium: { label: "Premium (2500€+)", min: 2500, icon: Trophy },
};

function filterByPriceRange(builds: PCBuild[], range: PriceRange): PCBuild[] {
  if (range === "all") return builds;
  
  const config = PRICE_RANGES[range];
  return builds.filter((build) => {
    if (config.min !== undefined && config.max !== undefined) {
      return build.pricePoint >= config.min && build.pricePoint <= config.max;
    }
    if (config.min !== undefined) {
      return build.pricePoint >= config.min;
    }
    return true;
  });
}

function sortBuilds(builds: PCBuild[], sortOption: SortOption): PCBuild[] {
  const sorted = [...builds];
  
  switch (sortOption) {
    case "price-asc":
      return sorted.sort((a, b) => a.pricePoint - b.pricePoint);
    case "price-desc":
      return sorted.sort((a, b) => b.pricePoint - a.pricePoint);
    case "performance":
      // Sort by price descending as proxy for performance (higher price = better performance typically)
      return sorted.sort((a, b) => b.pricePoint - a.pricePoint);
    default:
      return sorted;
  }
}

export function GamingPCsTabs({ desktops, laptops }: GamingPCsTabsProps) {
  const [activeTab, setActiveTab] = useState("desktop");
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const [sortOption, setSortOption] = useState<SortOption>("price-asc");

  const currentBuilds = activeTab === "desktop" ? desktops : laptops;

  const filteredAndSortedBuilds = useMemo(() => {
    const filtered = filterByPriceRange(currentBuilds, priceRange);
    return sortBuilds(filtered, sortOption);
  }, [currentBuilds, priceRange, sortOption]);

  const stats = useMemo(() => {
    const total = currentBuilds.length;
    const minPrice = total > 0 ? Math.min(...currentBuilds.map((b) => b.pricePoint)) : 0;
    const maxPrice = total > 0 ? Math.max(...currentBuilds.map((b) => b.pricePoint)) : 0;
    const avgPrice = total > 0 ? Math.round(currentBuilds.reduce((sum, b) => sum + b.pricePoint, 0) / total) : 0;
    
    return { total, minPrice, maxPrice, avgPrice };
  }, [currentBuilds]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
      <div className="flex justify-center">
        <TabsList>
          <TabsTrigger value="desktop">
            Gaming PCs
          </TabsTrigger>
          <TabsTrigger value="laptop">
            Gaming Laptops
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Stats Section */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-md border border-border space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-tight font-medium">Gesamt</p>
            <p className="font-serif text-2xl font-semibold tracking-tight">{stats.total}</p>
          </div>
          <div className="bg-card p-4 rounded-md border border-border space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-tight font-medium">Ab</p>
            <p className="font-serif text-2xl font-semibold tracking-tight">{stats.minPrice}€</p>
          </div>
          <div className="bg-card p-4 rounded-md border border-border space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-tight font-medium">Bis</p>
            <p className="font-serif text-2xl font-semibold tracking-tight">{stats.maxPrice}€</p>
          </div>
          <div className="bg-card p-4 rounded-md border border-border space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-tight font-medium">Ø Preis</p>
            <p className="font-serif text-2xl font-semibold tracking-tight">{stats.avgPrice}€</p>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Preisbereich:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRICE_RANGES).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={priceRange === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPriceRange(key as PriceRange)}
                  className={cn(
                    "h-9 gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm",
                    priceRange === key && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{config.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Sortieren:</span>
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Sortieren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Preis: Niedrig → Hoch</SelectItem>
              <SelectItem value="price-desc">Preis: Hoch → Niedrig</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      {filteredAndSortedBuilds.length !== currentBuilds.length && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {filteredAndSortedBuilds.length} von {currentBuilds.length} Builds
          </Badge>
        </div>
      )}

      <TabsContent value="desktop">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedBuilds.length > 0 ? (
            filteredAndSortedBuilds.map((build) => (
              <PCBuildCard key={build.id} build={build as any} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-md flex items-center justify-center mb-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Keine Builds gefunden</h2>
              <p className="text-muted-foreground">
                Versuche einen anderen Preisbereich oder Filter auszuwählen.
              </p>
              {priceRange !== "all" && (
                <Button
                  variant="outline"
                  onClick={() => setPriceRange("all")}
                  className="mt-4"
                >
                  Alle Builds anzeigen
                </Button>
              )}
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="laptop">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedBuilds.length > 0 ? (
            filteredAndSortedBuilds.map((build) => (
              <PCBuildCard key={build.id} build={build as any} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-md flex items-center justify-center mb-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight">Keine Laptops gefunden</h2>
              <p className="text-muted-foreground">
                Versuche einen anderen Preisbereich oder Filter auszuwählen.
              </p>
              {priceRange !== "all" && (
                <Button
                  variant="outline"
                  onClick={() => setPriceRange("all")}
                  className="mt-4"
                >
                  Alle Builds anzeigen
                </Button>
              )}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

