import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchSkeleton } from "@/components/search/SearchSkeleton";
import { SearchIcon, Loader2 } from "lucide-react";
import Link from "next/link";

interface SearchPageContentProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    minScore?: string;
    maxScore?: string;
    tags?: string;
    sort?: string;
    page?: string;
    // NEU: Erweiterte Filter
    releaseDateFrom?: string;
    releaseDateTo?: string;
    minPrice?: string;
    maxPrice?: string;
    platforms?: string;
    hasVideo?: string;
    hasDeal?: string;
    developer?: string;
    publisher?: string;
  }>;
}

const CATEGORIES = [
  { value: "all", label: "Alle" },
  { value: "game", label: "Games" },
  { value: "movie", label: "Filme" },
  { value: "series", label: "Serien" },
  { value: "hardware", label: "Hardware" },
] as const;

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevanz" },
  { value: "date-desc", label: "Neueste zuerst" },
  { value: "date-asc", label: "Älteste zuerst" },
  { value: "score-desc", label: "Beste Wertung" },
  { value: "score-asc", label: "Niedrigste Wertung" },
] as const;

export async function SearchPageContent({ searchParams }: SearchPageContentProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "all";
  const minScore = params.minScore ?? "";
  const maxScore = params.maxScore ?? "";
  const tags = params.tags?.split(",").filter(Boolean) ?? [];
  const sort = params.sort ?? "relevance";
  const page = Math.max(parseInt(params.page || "1"), 1);
  const limit = 12;

  // NEU: Erweiterte Filter Parameter extrahieren
  const releaseDateFrom = params.releaseDateFrom ?? "";
  const releaseDateTo = params.releaseDateTo ?? "";
  const minPrice = params.minPrice ?? "";
  const maxPrice = params.maxPrice ?? "";
  const platforms = params.platforms?.split(",").filter(Boolean) ?? [];
  const hasVideo = params.hasVideo === "true";
  const hasDeal = params.hasDeal === "true";
  const developer = params.developer ?? "";
  const publisher = params.publisher ?? "";

  // Build API URL for server-side fetch
  const apiParams = new URLSearchParams();
  if (query) apiParams.set("query", query);
  if (category !== "all") apiParams.set("category", category);
  if (minScore) apiParams.set("minScore", minScore);
  if (maxScore) apiParams.set("maxScore", maxScore);
  if (tags.length > 0) apiParams.set("tags", tags.join(","));
  // NEU: Erweiterte Filter an API übergeben
  if (releaseDateFrom) apiParams.set("releaseDateFrom", releaseDateFrom);
  if (releaseDateTo) apiParams.set("releaseDateTo", releaseDateTo);
  if (minPrice) apiParams.set("minPrice", minPrice);
  if (maxPrice) apiParams.set("maxPrice", maxPrice);
  if (platforms.length > 0) apiParams.set("platforms", platforms.join(","));
  if (hasVideo) apiParams.set("hasVideo", "true");
  if (hasDeal) apiParams.set("hasDeal", "true");
  if (developer) apiParams.set("developer", developer);
  if (publisher) apiParams.set("publisher", publisher);
  apiParams.set("sort", sort);
  apiParams.set("limit", String(limit));
  apiParams.set("page", String(page));

  let data: {
    reviews: Array<{
      id: string;
      title: string;
      title_en: string | null;
      slug: string;
      category: string;
      score: number;
      content: string;
      content_en: string | null;
      images: string[];
      createdAt: string;
      updatedAt: string;
      tags: Array<{ tag: { name: string; slug: string } }>;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } | null = null;

  let error: string | null = null;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/reviews/search?${apiParams.toString()}`, {
      next: { revalidate: 60, tags: ["search"] },
    });
    if (!res.ok) throw new Error("Fehler beim Laden der Suchergebnisse");
    data = await res.json();
  } catch (err) {
    error = err instanceof Error ? err.message : "Ein Fehler ist aufgetreten";
  }

  // Get popular tags for empty state suggestions
  let popularTags: Array<{ slug: string; name: string; count: number }> = [];
  if (!query) {
    try {
      const tagGroups = await prisma.reviewTag.groupBy({
        by: ["tagId"],
        where: { review: { status: "published" } },
        _count: { _all: true },
        orderBy: { _count: { tagId: "desc" } },
        take: 10,
      });
      const tagIds = tagGroups.map((g) => g.tagId);
      const tagDetails = await prisma.tag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true, name: true, slug: true },
      });
      popularTags = tagGroups
        .map((g) => {
          const tag = tagDetails.find((t) => t.id === g.tagId);
          return tag ? { slug: tag.slug, name: tag.name, count: g._count._all } : null;
        })
        .filter(Boolean) as Array<{ slug: string; name: string; count: number }>;
    } catch {
      // Ignore tag fetch errors
    }
  }

  // Get latest reviews for empty state
  let latestReviews: Array<{ id: string; title: string; slug: string; category: string; score: number }> = [];
  if (!query && !error) {
    try {
      latestReviews = await prisma.review.findMany({
        where: { status: "published" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, category: true, score: true },
      });
    } catch {
      // Ignore
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 py-8 px-4">
      {/* Hero / Search Input */}
      <section aria-labelledby="search-heading" className="space-y-6">
        <div>
          <h1 id="search-heading" className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
            Suche
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Finde Tests zu Games, Filmen, Serien und Hardware. Suche nach Titeln, Themen oder Schlagwörtern.
          </p>
        </div>

        {/* Large Search Form */}
        <form role="search" aria-label="Site-Suche" className="space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              name="q"
              value={query}
              placeholder="Was suchst du? z. B. „Cyberpunk“, „RTX 4090“, „Dune“…"
              className="w-full h-12 lg:h-14 pl-12 pr-4 text-lg lg:text-xl rounded-lg border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
              aria-autocomplete="list"
            />
            {query && (
              <Link
                href="/suche"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-1"
                aria-label="Suche leeren"
              >
                <SearchIcon className="size-5" />
              </Link>
            )}
          </div>

          {/* Inline Filters */}
          <SearchFilters
            category={category}
            minScore={minScore}
            maxScore={maxScore}
            tags={tags}
            sort={sort}
            // NEU: Erweiterte Filter an SearchFilters übergeben
            releaseDateFrom={releaseDateFrom}
            releaseDateTo={releaseDateTo}
            minPrice={minPrice}
            maxPrice={maxPrice}
            platforms={platforms}
            hasVideo={hasVideo}
            hasDeal={hasDeal}
            developer={developer}
            publisher={publisher}
            initialCategories={CATEGORIES}
            initialSortOptions={SORT_OPTIONS}
          />
        </form>
      </section>

      {/* Results */}
      <section aria-labelledby="results-heading" className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="results-heading" className="font-serif text-2xl font-semibold tracking-tight">
            {query
              ? `Ergebnisse für „${query}"`
              : "Beliebte Suchen & Neueste Tests"}
            {data && (
              <span className="text-base font-normal text-muted-foreground">
                ({data.pagination.total} {data.pagination.total === 1 ? "Treffer" : "Treffer"})
              </span>
            )}
          </h2>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Seite {data.pagination.page} von {data.pagination.totalPages}
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <Loader2 className="size-8 mx-auto text-destructive mb-3" />
            <p className="text-destructive font-medium">Fehler bei der Suche</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Link
              href="/reviews"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Alle Reviews ansehen
            </Link>
          </div>
        ) : query && data && data.reviews.length === 0 ? (
          <section className="text-center py-20">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
              Keine Treffer f&uuml;r &ldquo;{query}&rdquo;
            </h2>
            <div className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto space-y-6">
              <p className="mb-4">Versuche es mit anderen Begriffen oder Filtern.</p>
              <div className="space-y-4 text-left">
                {popularTags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Beliebte Tags:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {popularTags.slice(0, 8).map((tag) => (
                        <Link
                          key={tag.slug}
                          href={`/suche?tags=${tag.slug}`}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-sm hover:bg-accent transition-colors"
                        >
                          #{tag.name}
                          <span className="text-xs text-muted-foreground">({tag.count})</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {latestReviews.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Neueste Tests:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {latestReviews.map((r) => (
                        <Link
                          key={r.id}
                          href={`/reviews/${r.slug}`}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-sm hover:bg-accent transition-colors"
                        >
                          {r.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <Suspense fallback={<SearchSkeleton />}>
            <SearchResults
              reviews={data?.reviews ?? []}
              query={query}
              pagination={data?.pagination ?? null}
              baseParams={{
                category: category !== "all" ? category : undefined,
                minScore: minScore || undefined,
                maxScore: maxScore || undefined,
                tags: tags.length > 0 ? tags : undefined,
                sort: sort !== "relevance" ? sort : undefined,
                // NEU: Erweiterte Filter für Pagination-Links in SearchResults
                releaseDateFrom: releaseDateFrom || undefined,
                releaseDateTo: releaseDateTo || undefined,
                minPrice: minPrice || undefined,
                maxPrice: maxPrice || undefined,
                platforms: platforms.length > 0 ? platforms : undefined,
                hasVideo: hasVideo || undefined,
                hasDeal: hasDeal || undefined,
                developer: developer || undefined,
                publisher: publisher || undefined,
              }}
            />
          </Suspense>
        )}
      </section>
    </div>
  );
}