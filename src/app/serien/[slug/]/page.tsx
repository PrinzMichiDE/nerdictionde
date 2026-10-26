import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeriesBySlug } from "@/lib/review-series";
import { getUserSeriesDetail } from "@/lib/user-series";
import { generateSeriesMetadata } from "@/lib/share-meta";
import { SeriesDetail } from "@/components/series/SeriesDetail";
import { getServerSession } from "@/lib/session";
import { FEATURE_USER_SERIES, FEATURE_REVIEW_SERIES } from "@/lib/feature-flags";

interface SeriesPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // For metadata, we only show public series (no auth context)
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
  if (FEATURE_REVIEW_SERIES !== true) {
    notFound();
  }

  const { slug } = await params;
  const session = await getServerSession();
  const userId = session?.userId ?? null;

  // First try to get the series via public API (handles PUBLIC series, both ADMIN and USER)
  let series = await getSeriesBySlug(slug);

  // If not found via public API and user is logged in, check if it's a private user series
  // that the user owns or collaborates on
  if (!series && userId && FEATURE_USER_SERIES) {
    series = await getUserSeriesDetail(slug, userId);
  }

  // If still not found, it's either private and user doesn't have access, or doesn't exist
  if (!series) {
    notFound();
  }

  return <SeriesDetail series={series} />;
}