import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSeriesForAdmin } from "@/lib/review-series";
import { SeriesTable } from "@/components/admin/SeriesTable";
import { FEATURE_REVIEW_SERIES } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "Serien verwalten | Admin | Nerdiction",
};

export const dynamic = "force-dynamic";

export default async function AdminSeriesPage() {
  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serien verwalten</h1>
          <p className="mt-1 text-muted-foreground">
            Kuratierte Review-Serien anlegen, bearbeiten und löschen.
          </p>
        </div>
        <Link
          href="/admin/serien/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neue Serie
        </Link>
      </div>

      <SeriesTable />
    </main>
  );
}