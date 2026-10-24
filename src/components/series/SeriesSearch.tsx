"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, FormEvent } from "react";
import { cn } from "@/lib/utils";

interface SeriesSearchProps {
  initialQuery: string;
}

export function SeriesSearch({ initialQuery }: SeriesSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      params.delete("cursor");
      router.push(`/serien?${params.toString()}`);
    },
    [query, router, searchParams]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("cursor");
    router.push(`/serien?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2 max-w-xl">
        <label htmlFor="series-search" className="sr-only">
          Serien suchen
        </label>
        <input
          id="series-search"
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Serien durchsuchen (Titel, Beschreibung)..."
          className={cn(
            "flex-1 px-4 py-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "transition-colors"
          )}
          autoComplete="off"
        />
        <button
          type="submit"
          className={cn(
            "px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium",
            "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-colors whitespace-nowrap"
          )}
        >
          Suchen
        </button>
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "px-4 py-2 border rounded-lg font-medium",
              "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "transition-colors whitespace-nowrap"
            )}
            aria-label="Suche zurücksetzen"
          >
            × Zurücksetzen
          </button>
        )}
      </div>
    </form>
  );
}