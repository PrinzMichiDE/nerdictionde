"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AdvancedFiltersProps {
  className?: string;
}

/**
 * Price range filter for hardware/product reviews.
 * Uses URL params: minPrice, maxPrice
 */
export function AdvancedFilters({ className }: AdvancedFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const updateURL = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
    router.push(params.toString() ? `/reviews?${params.toString()}` : "/reviews", { scroll: false });
  };

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <div className="space-y-2">
        <Label htmlFor="minPrice" className="text-xs font-medium text-muted-foreground">
          Min. Preis (€)
        </Label>
        <Input
          id="minPrice"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          value={minPrice}
          onChange={(e) => updateURL("minPrice", e.target.value || null)}
          className="h-9"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxPrice" className="text-xs font-medium text-muted-foreground">
          Max. Preis (€)
        </Label>
        <Input
          id="maxPrice"
          type="number"
          min="0"
          step="1"
          placeholder="—"
          value={maxPrice}
          onChange={(e) => updateURL("maxPrice", e.target.value || null)}
          className="h-9"
        />
      </div>
    </div>
  );
}
