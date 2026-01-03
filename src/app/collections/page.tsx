import { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { AnimatedText } from "@/components/shared/AnimatedText";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, TrendingUp, Gamepad2, Cpu, ShoppingCart, Sparkles } from "lucide-react";
import { Review } from "@/types/review";
import { getCollectionReviews } from "@/lib/db/collections";
import { syncCollections } from "@/lib/db/collections";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";

export const metadata: Metadata = {
  title: "Collections - Top Reviews & Empfehlungen",
  description: "Entdecke unsere kuratierten Collections: Top Reviews, Must-Have Hardware, Beste Games und mehr.",
  alternates: {
    canonical: `${baseUrl}/collections`,
  },
  openGraph: {
    title: "Collections - Top Reviews & Empfehlungen | Nerdiction",
    description: "Entdecke unsere kuratierten Collections: Top Reviews, Must-Have Hardware, Beste Games und mehr.",
    url: `${baseUrl}/collections`,
    type: "website",
  },
};

interface Collection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  reviews: Review[];
  badge?: string;
}

export default async function CollectionsPage() {
  // Sync collections (ensure they exist)
  await syncCollections();

  // Fetch collections from database
  const dbCollections = await prisma.collection.findMany({
    where: { featured: true },
    orderBy: { sortOrder: "asc" },
  });

  // Fetch reviews for each collection
  const collections: Collection[] = await Promise.all(
    dbCollections.map(async (dbCollection) => {
      const collectionData = await getCollectionReviews(dbCollection.slug, 6);
      
      const icons: Record<string, React.ReactNode> = {
        "top-rated": <Trophy className="size-6" />,
        "must-have-games": <Gamepad2 className="size-6" />,
        "best-hardware": <Cpu className="size-6" />,
        "trending": <TrendingUp className="size-6" />,
        "amazon-deals": <ShoppingCart className="size-6" />,
        "hidden-gems": <Sparkles className="size-6" />,
      };

      return {
        id: dbCollection.id,
        title: dbCollection.name,
        description: dbCollection.description || "",
        icon: icons[dbCollection.slug] || <Star className="size-6" />,
        badge: dbCollection.featured ? "Premium" : undefined,
        reviews: (collectionData?.reviews || []) as Review[],
      };
    })
  );

  // Fallback to manual collections if database is empty
  if (collections.length === 0) {
    const allReviews = (await prisma.review.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
    })) as unknown as Review[];

    const fallbackCollections: Collection[] = [
      {
        id: "top-rated",
        title: "Top Bewertete Reviews",
        description: "Die besten Reviews mit höchsten Nerdiction Scores",
        icon: <Trophy className="size-6" />,
        badge: "Premium",
        reviews: allReviews
          .sort((a, b) => b.score - a.score)
          .slice(0, 6),
      },
      {
        id: "must-have-games",
        title: "Must-Have Games",
        description: "Essentielle Spiele, die jeder Gamer kennen sollte",
        icon: <Gamepad2 className="size-6" />,
        reviews: allReviews
          .filter((r) => r.category === "game" && r.score >= 80)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6),
      },
      {
        id: "best-hardware",
        title: "Beste Hardware",
        description: "Top Hardware-Komponenten für Gaming & Performance",
        icon: <Cpu className="size-6" />,
        reviews: allReviews
          .filter((r) => r.category === "hardware" && r.score >= 80)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6),
      },
      {
        id: "trending",
        title: "Trending Reviews",
        description: "Aktuell beliebte und viel diskutierte Reviews",
        icon: <TrendingUp className="size-6" />,
        reviews: allReviews
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6),
      },
      {
        id: "amazon-deals",
        title: "Amazon Empfehlungen",
        description: "Top bewertete Produkte mit Amazon Affiliate Links",
        icon: <ShoppingCart className="size-6" />,
        reviews: allReviews
          .filter((r) => r.category === "amazon" && r.affiliateLink)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6),
      },
      {
        id: "hidden-gems",
        title: "Hidden Gems",
        description: "Unterbewertete Perlen, die mehr Aufmerksamkeit verdienen",
        icon: <Sparkles className="size-6" />,
        reviews: allReviews
          .filter((r) => r.score >= 70 && r.score < 85)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6),
      },
    ].filter((collection) => collection.reviews.length > 0);
  }

  return (
    <div className="space-y-16 pb-12">
      {/* Header */}
      <AnimatedSection direction="up">
        <div className="space-y-4 text-center">
          <AnimatedText variant="h1" stagger className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Collections
          </AnimatedText>
          <AnimatedText variant="p" delay={0.2} className="max-w-2xl mx-auto text-muted-foreground text-lg">
            Entdecke unsere kuratierten Sammlungen der besten Reviews, Must-Have Games und Hardware-Empfehlungen.
          </AnimatedText>
        </div>
      </AnimatedSection>

      {/* Collections Grid */}
      <div className="space-y-16">
        {collections.map((collection, collectionIndex) => (
          <AnimatedSection
            key={collection.id}
            direction="up"
            delay={collectionIndex * 0.1}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  {collection.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-bold tracking-tight">{collection.title}</h2>
                    {collection.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {collection.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">{collection.description}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collection.reviews.map((review, index) => (
                <div key={review.id} style={{ animationDelay: `${index * 0.05}s` }}>
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>

            {collection.reviews.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                <p className="text-muted-foreground">Noch keine Reviews in dieser Collection.</p>
              </div>
            )}
          </AnimatedSection>
        ))}
      </div>

      {/* CTA Section */}
      <AnimatedSection direction="up" delay={0.3}>
        <div className="text-center py-16 border-t">
          <h3 className="text-2xl font-bold mb-4">Mehr entdecken</h3>
          <p className="text-muted-foreground mb-6">
            Durchstöbere alle unsere Reviews und finde genau das, was du suchst.
          </p>
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition-colors"
          >
            Alle Reviews ansehen
            <span>→</span>
          </Link>
        </div>
      </AnimatedSection>
    </div>
  );
}
