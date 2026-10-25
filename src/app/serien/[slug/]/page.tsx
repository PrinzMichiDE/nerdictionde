import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeriesBySlug } from "@/lib/review-series";
import { generateSeriesMetadata } from "@/lib/share-meta";
import { SeriesDetail } from "@/components/series/SeriesDetail";

interface SeriesPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    return { title: "Serie nicht gefunden | Nerdiction" };
  }

  return generateSeriesMetadata({
    id: series.id,
    slug: series.slug,
    title: series.title,
    description: series.description,
    coverImage: series.coverImage,
    partCount: series.partCount,
    aggregateScore: series.aggregateScore,
    createdAt: series.createdAt,
    updatedAt: series.updatedAt,
  });
}

export default async function SeriesDetailPage({ params }: SeriesPageProps) {
  if (process.env.FEATURE_REVIEW_SERIES !== "true") {
    notFound();
  }

  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  return <SeriesDetail series={series} />;
}