import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSeriesList } from "@/lib/review-series";
import { SeriesList } from "@/components/series/SeriesList";
import { SeriesSearch } from "@/components/series/SeriesSearch";
import { FEATURE_USER_SERIES } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review-Serien | Nerdiction",
  description: "Entdecke kuratierte Review-Serien zu Spielen, DLCs, Staffeln und Franchises. Alle Teile auf einen Blick mit Scores, Release-Daten und Navigation.",
};

const ITEMS_PER_PAGE = 20;

export default async function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; order?: string; cursor?: string; type?: string }>;
}) {
  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    notFound();
  }

  const params = await searchParams;
  const q = params.q || "";
  const sort = params.sort || "createdAt";
  const order = params.order || "desc";
  const cursor = params.cursor;
  const type = params.type; // "ADMIN" | "USER" | undefined

  const { series, nextCursor } = await getSeriesList({
    q,
    sort: sort as "title" | "createdAt" | "partCount" | "followersCount",
    order: order as "asc" | "desc",
    limit: ITEMS_PER_PAGE,
    cursor,
    type: type as "ADMIN" | "USER" | undefined,
    visibility: "PUBLIC",
  });

  const showUserSeriesFilter = FEATURE_USER_SERIES;

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Review-Serien</h1>
        <p className="mt-2 text-muted-foreground">
          Kuratierte Zusammenstellungen zu Franchises, DLC-Reihen, Staffeln und mehr.
          {series.length === 0 && " Noch keine Serien vorhanden."}
        </p>
      </header>

      {showUserSeriesFilter && (
        <nav className="mb-6" aria-label="Serien-Typ filtern">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/serien"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !type
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
              aria-current={!type ? "true" : "false"}
            >
              Alle
            </Link>
            <Link
              href="/serien?type=ADMIN"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                type === "ADMIN"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
              aria-current={type === "ADMIN" ? "true" : "false"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Redaktion
            </Link>
            <Link
              href="/serien?type=USER"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                type === "USER"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
              aria-current={type === "USER" ? "true" : "false"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Nutzer
            </Link>
          </div>
        </nav>
      )}

      <SeriesSearch initialQuery={q} />

      <SeriesList
        series={series}
        nextCursor={nextCursor}
        currentParams={{ q, sort, order, type }}
      />
    </main>
  );
}