import { Metadata } from "next";
import { DealsList } from "@/components/deals/DealsList";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Deals & Angebote | Nerdiction",
  description: "Aktuelle Hardware- und Gaming-Deals. Die besten Angebote für Gaming-PCs, Hardware und mehr.",
};

async function getInitialDeals() {
  try {
    const deals = await prisma.deal.findMany({
      where: { 
        status: "active",
        OR: [
          {
            review: {
              category: { in: ["hardware", "game"] }
            }
          },
          {
            url: { contains: "amazon.de" }
          },
          {
            url: { contains: "amazon.com" }
          }
        ]
      },
      include: { review: { select: { id: true, slug: true, title: true, category: true } } },
      orderBy: { createdAt: "desc" },
      take: 24,
    });
    return deals as unknown as Array<{
      id: string;
      title: string;
      price: number;
      originalPrice?: number | null;
      discount?: number | null;
      currency: string;
      url: string;
      imageUrl?: string | null;
      source: string;
      category?: string | null;
      reviewId?: string | null;
      review?: { slug: string; title: string; category: string } | null;
    }>;
  } catch {
    return [];
  }
}

export default async function DealsPage() {
  const initialDeals = await getInitialDeals();

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      <div className="max-w-3xl space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Deals & Angebote
        </h1>
        <p className="text-lg text-muted-foreground">
          Aktuelle Hardware- und Gaming-Deals. Die besten Angebote für Gaming-PCs, Hardware und mehr.
        </p>
      </div>
      <DealsList initialDeals={initialDeals} />
    </div>
  );
}
