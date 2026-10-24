"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CollectionCard } from "./CollectionCard";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CollectionsListProps {
  initialCollections: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    itemCount: number;
    updatedAt: string | Date;
    owner: {
      id: string;
      username: string;
      displayName: string;
      profileImageUrl: string | null;
    };
  }[];
  initialCursor: string | null;
  searchQuery?: string;
  sort?: "updated" | "created" | "itemCount" | "popularity";
}

export function CollectionsList({
  initialCollections,
  initialCursor,
  searchQuery = "",
  sort = "updated",
}: CollectionsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [collections, setCollections] = useState(initialCollections);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [sortBy, setSortBy] = useState(sort);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const hasMore = cursor !== null;

  const fetchCollections = useCallback(
    async (cursorParam: string | null = null, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (cursorParam) params.set("cursor", cursorParam);
        if (searchTerm) params.set("q", searchTerm);
        params.set("sort", sortBy);
        params.set("limit", "20");

        const res = await fetch(`/api/listen?${params.toString()}`);
        if (!res.ok) throw new Error("Fehler beim Laden");

        const data = await res.json();
        if (append) {
          setCollections((prev) => [...prev, ...data.collections]);
        } else {
          setCollections(data.collections);
        }
        setCursor(data.nextCursor);
      } catch {
        toast({ title: "Fehler", description: "Fehler beim Laden der Listen", variant: "destructive" });
        if (!append) setCollections([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [searchTerm, sortBy]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm((prev) => prev.trim());
    setCollections([]);
    setCursor(null);
    fetchCollections(null, false);
  };

  const handleSortChange = (newSort: "updated" | "created" | "itemCount" | "popularity") => {
    setSortBy(newSort);
    setShowSortMenu(false);
    setCollections([]);
    setCursor(null);
    fetchCollections(null, false);
  };

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchCollections(cursor, true);
    }
  };

  if (loading && collections.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg p-4" />
        ))}
      </div>
    );
  }

  if (collections.length === 0 && !loading) {
    return (
      <EmptyState
        title={searchTerm ? "Keine Listen gefunden" : "Noch keine öffentlichen Listen"}
        description={searchTerm
          ? `Keine Listen gefunden für "${searchTerm}". Versuche einen anderen Suchbegriff.`
          : "Noch niemand hat eine öffentliche Liste erstellt. Sei der Erste!"}
      />
    );
  }

  return (
    <div>
      {/* Search & Sort */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start justify-between">
        <form onSubmit={handleSearch} className="flex-1 max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Listen suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label="Listen suchen"
            />
          </div>
          <Button type="submit" className="whitespace-nowrap">
            Suchen
          </Button>
        </form>

        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="gap-2 whitespace-nowrap"
          >
            <ChevronDown className="h-4 w-4" />
            Sortieren: {sortBy === "updated" ? "Neueste" : sortBy === "created" ? "Älteste" : sortBy === "itemCount" ? "Meiste Reviews" : "Beliebteste"}
          </Button>
          {showSortMenu && (
            <div className="absolute right-0 top-full mt-1 z-10 w-48 rounded-md border bg-popover p-1 shadow-lg">
              {[
                { value: "updated", label: "Neueste zuerst" },
                { value: "created", label: "Älteste zuerst" },
                { value: "itemCount", label: "Meiste Reviews" },
                { value: "popularity", label: "Beliebteste" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value as any)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    sortBy === option.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            slug={collection.slug}
            title={collection.title}
            description={collection.description}
            itemCount={collection.itemCount}
            updatedAt={collection.updatedAt}
            owner={collection.owner}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full sm:w-auto"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Mehr laden
          </Button>
        </div>
      )}
    </div>
  );
}