import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSeriesBySlug } from "@/lib/review-series";
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

  return {
    title: `${series.title} | Nerdiction`,
    description: series.description || `Alle Teile der Serie "${series.title}" – ${series.partCount} Reviews mit Scores, Release-Daten und Details.`,
    openGraph: {
      title: series.title,
      description: series.description || `Alle ${series.partCount} Teile der Serie "${series.title}"`,
      type: "website",
      images: series.coverImage ? [series.coverImage] : (series.parts[0]?.coverImage ? [series.parts[0].coverImage] : []),
    },
    twitter: {
      card: "summary_large_image",
      title: series.title,
      description: series.description || `Alle ${series.partCount} Teile der Serie "${series.title}"`,
      images: series.coverImage ? [series.coverImage] : (series.parts[0]?.coverImage ? [series.parts[0].coverImage] : []),
    },
    other: {
      "schema.org": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: series.title,
        description: series.description,
        numberOfItems: series.partCount,
        itemListElement: series.parts.map((part, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `https://nerdiction.de/reviews/${part.slug}`,
          name: part.title,
        })),
      }),
    },
  };
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