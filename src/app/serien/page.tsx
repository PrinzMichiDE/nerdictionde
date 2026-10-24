import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeriesList } from "@/lib/review-series";
import { SeriesList } from "@/components/series/SeriesList";
import { SeriesSearch } from "@/components/series/SeriesSearch";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Review-Serien | Nerdiction",
  description: "Entdecke kuratierte Review-Serien zu Spielen, DLCs, Staffeln und Franchises. Alle Teile auf einen Blick mit Scores, Release-Daten und Navigation.",
};

const ITEMS_PER_PAGE = 20;

export default async function SeriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; order?: string; cursor?: string }>;
}) {
  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    notFound();
  }

  const params = await searchParams;
  const q = params.q || "";
  const sort = params.sort || "createdAt";
  const order = params.order || "desc";
  const cursor = params.cursor;

  const { series, nextCursor } = await getSeriesList({ q, sort: sort as "title" | "createdAt" | "partCount", order: order as "asc" | "desc", limit: ITEMS_PER_PAGE, cursor });

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Review-Serien</h1>
        <p className="mt-2 text-muted-foreground">
          Kuratierte Zusammenstellungen zu Franchises, DLC-Reihen, Staffeln und mehr.
          {series.length === 0 && " Noch keine Serien vorhanden."}
        </p>
      </header>

      <SeriesSearch initialQuery={q} />

      <SeriesList
        series={series}
        nextCursor={nextCursor}
        currentParams={{ q, sort, order }}
      />
    </main>
  );
}