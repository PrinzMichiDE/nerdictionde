import { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";
import { SearchPageContent } from "./SearchPageContent";

export const metadata: Metadata = {
  title: "Suche - Nerdiction",
  description:
    "Durchsuche alle Nerdiction Tests nach Spielen, Filmen, Serien und Hardware. Filtere nach Kategorie, Wertung und Schlagwörtern.",
  alternates: {
    canonical: `${getSiteUrl()}/suche`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    minScore?: string;
    maxScore?: string;
    tags?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  return <SearchPageContent searchParams={searchParams} />;
}