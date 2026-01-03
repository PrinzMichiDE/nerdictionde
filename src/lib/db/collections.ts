import prisma from "@/lib/prisma";
import { Review } from "@/types/review";

/**
 * Create or update collections from review data
 */
export async function syncCollections() {
  // Define collections
  const collections = [
    {
      name: "Top Bewertete Reviews",
      name_en: "Top Rated Reviews",
      slug: "top-rated",
      description: "Die besten Reviews mit höchsten Nerdiction Scores",
      description_en: "The best reviews with highest Nerdiction scores",
      type: "auto" as const,
      featured: true,
      sortOrder: 1,
      autoRules: {
        minScore: 80,
        sortBy: "score",
        order: "desc",
        limit: 20,
      },
    },
    {
      name: "Must-Have Games",
      name_en: "Must-Have Games",
      slug: "must-have-games",
      description: "Essentielle Spiele, die jeder Gamer kennen sollte",
      description_en: "Essential games every gamer should know",
      type: "auto" as const,
      featured: true,
      sortOrder: 2,
      autoRules: {
        category: "game",
        minScore: 80,
        sortBy: "score",
        order: "desc",
        limit: 20,
      },
    },
    {
      name: "Beste Hardware",
      name_en: "Best Hardware",
      slug: "best-hardware",
      description: "Top Hardware-Komponenten für Gaming & Performance",
      description_en: "Top hardware components for gaming & performance",
      type: "auto" as const,
      featured: true,
      sortOrder: 3,
      autoRules: {
        category: "hardware",
        minScore: 80,
        sortBy: "score",
        order: "desc",
        limit: 20,
      },
    },
    {
      name: "Trending Reviews",
      name_en: "Trending Reviews",
      slug: "trending",
      description: "Aktuell beliebte und viel diskutierte Reviews",
      description_en: "Currently popular and much-discussed reviews",
      type: "auto" as const,
      featured: true,
      sortOrder: 4,
      autoRules: {
        daysSince: 7,
        sortBy: "createdAt",
        order: "desc",
        limit: 20,
      },
    },
    {
      name: "Amazon Empfehlungen",
      name_en: "Amazon Recommendations",
      slug: "amazon-deals",
      description: "Top bewertete Produkte mit Amazon Affiliate Links",
      description_en: "Top rated products with Amazon affiliate links",
      type: "auto" as const,
      featured: true,
      sortOrder: 5,
      autoRules: {
        category: "amazon",
        hasAffiliateLink: true,
        sortBy: "score",
        order: "desc",
        limit: 20,
      },
    },
    {
      name: "Hidden Gems",
      name_en: "Hidden Gems",
      slug: "hidden-gems",
      description: "Unterbewertete Perlen, die mehr Aufmerksamkeit verdienen",
      description_en: "Underrated gems that deserve more attention",
      type: "auto" as const,
      featured: false,
      sortOrder: 6,
      autoRules: {
        minScore: 70,
        maxScore: 85,
        sortBy: "score",
        order: "desc",
        limit: 20,
      },
    },
  ];

  // Create or update collections
  for (const collectionData of collections) {
    await prisma.collection.upsert({
      where: { slug: collectionData.slug },
      update: {
        name: collectionData.name,
        name_en: collectionData.name_en,
        description: collectionData.description,
        description_en: collectionData.description_en,
        autoRules: collectionData.autoRules,
        featured: collectionData.featured,
        sortOrder: collectionData.sortOrder,
      },
      create: collectionData,
    });
  }

  // Sync review collections based on auto rules
  await syncAutoCollections();
}

/**
 * Sync auto-generated collections based on rules
 */
async function syncAutoCollections() {
  const autoCollections = await prisma.collection.findMany({
    where: { type: "auto" },
  });

  for (const collection of autoCollections) {
    const rules = collection.autoRules as any;
    if (!rules) continue;

    const where: any = {
      status: "published",
    };

    // Apply filters
    if (rules.category) {
      where.category = rules.category;
    }

    if (rules.minScore !== undefined) {
      where.score = { gte: rules.minScore };
    }

    if (rules.maxScore !== undefined) {
      where.score = { ...where.score, lte: rules.maxScore };
    }

    if (rules.hasAffiliateLink) {
      where.affiliateLink = { not: null };
    }

    if (rules.daysSince) {
      const date = new Date();
      date.setDate(date.getDate() - rules.daysSince);
      where.createdAt = { gte: date };
    }

    // Determine orderBy
    const orderBy: any = {};
    if (rules.sortBy === "score") {
      orderBy.score = rules.order || "desc";
    } else if (rules.sortBy === "createdAt") {
      orderBy.createdAt = rules.order || "desc";
    }

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where,
      orderBy,
      take: rules.limit || 20,
    });

    // Clear existing collection items
    await prisma.reviewCollection.deleteMany({
      where: { collectionId: collection.id },
    });

    // Add reviews to collection
    await prisma.reviewCollection.createMany({
      data: reviews.map((review, index) => ({
        reviewId: review.id,
        collectionId: collection.id,
        sortOrder: index,
      })),
    });
  }
}

/**
 * Get reviews for a collection
 */
export async function getCollectionReviews(collectionSlug: string, limit?: number) {
  const collection = await prisma.collection.findUnique({
    where: { slug: collectionSlug },
    include: {
      reviews: {
        include: { review: true },
        orderBy: { sortOrder: "asc" },
        ...(limit && { take: limit }),
      },
    },
  });

  if (!collection) return null;

  return {
    ...collection,
    reviews: collection.reviews.map((rc) => rc.review),
  };
}
