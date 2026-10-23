"use client";

import { useRouter, useSearchParams } from "next/navigation";

const CATEGORIES = [
  { value: "", label: "Alle", count: 0 },
  { value: "game", label: "Games", count: 0 },
  { value: "movie", label: "Filme", count: 0 },
  { value: "series", label: "Serien", count: 0 },
  { value: "hardware", label: "Hardware", count: 0 },
];

interface CategoryChipsProps {
  categoryCounts?: Record<string, number>;
  totalCount: number;
}

export function CategoryChips({ categoryCounts = {}, totalCount }: CategoryChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  const setCategory = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.push("?" + params.toString());
  };

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => {
        const count = cat.value ? categoryCounts[cat.value] || 0 : totalCount;
        const isActive = cat.value === currentCategory;
        return (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
            }`}
            aria-pressed={isActive}
          >
            {cat.label}
            <span className={`tabular-nums ${isActive ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
