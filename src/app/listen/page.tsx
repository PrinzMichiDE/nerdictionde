import { Metadata } from "next";
import { getPublicCollections } from "@/lib/collections";
import { CollectionsList } from "@/components/collections/CollectionsList";

export const metadata: Metadata = {
  title: "Kuratierte Listen entdecken - Nerdiction",
  description:
    "Entdecke thematisch kuratierte Listen von Reviews: Beste Spiele, Hidden Gems, Koop-Titel und mehr. Von der Community für die Community.",
  openGraph: {
    title: "Kuratierte Listen entdecken - Nerdiction",
    description:
      "Entdecke thematisch kuratierte Listen von Reviews: Beste Spiele, Hidden Gems, Koop-Titel und mehr.",
    type: "website",
  },
};

interface Props {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    cursor?: string;
  }>;
}

export default async function ListenPage({ searchParams }: Props) {
  const params = await searchParams;
  const { collections, nextCursor } = await getPublicCollections({
    q: params.q,
    sort: (params.sort as "updated" | "created" | "itemCount" | "popularity") || "updated",
    cursor: params.cursor,
    limit: 20,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
          Kuratierte Listen entdecken
        </h1>
        <p className="mt-2 text-muted-foreground">
          Von der Community zusammengestellte Sammlungen: Beste Spiele, Hidden Gems, Koop-Titel und mehr.
        </p>
      </header>

      <CollectionsList
        initialCollections={collections}
        initialCursor={nextCursor}
        searchQuery={params.q}
        sort={params.sort as "updated" | "created" | "itemCount" | "popularity"}
      />
    </div>
  );
}