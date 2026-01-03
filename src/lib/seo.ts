import { Review } from "@/types/review";

/**
 * Generate JSON-LD structured data for reviews
 * Improves SEO and enables rich snippets in search results
 */
export function generateReviewSchema(review: Review & { title: string; content: string }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";
  const reviewUrl = `${baseUrl}/reviews/${review.slug}`;
  const imageUrl = review.images?.[0] ? review.images[0] : `${baseUrl}/og-image.png`;

  // Determine review type based on category
  let itemType = "Product";
  if (review.category === "game") {
    itemType = "VideoGame";
  } else if (review.category === "hardware") {
    itemType = "Product";
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": itemType,
    name: review.title,
    description: review.content.substring(0, 200),
    image: imageUrl,
    url: reviewUrl,
    datePublished: review.createdAt instanceof Date ? review.createdAt.toISOString() : new Date(review.createdAt).toISOString(),
    dateModified: review.updatedAt instanceof Date ? review.updatedAt.toISOString() : new Date(review.updatedAt).toISOString(),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: review.score,
      bestRating: 100,
      worstRating: 0,
      ratingCount: 1,
    },
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.score,
        bestRating: 100,
        worstRating: 0,
      },
      author: {
        "@type": "Organization",
        name: "Nerdiction",
      },
      reviewBody: review.content.substring(0, 500),
    },
  };

  // Add game-specific metadata
  if (review.category === "game" && review.metadata) {
    const metadata = review.metadata as any;
    return {
      ...schema,
      "@type": "VideoGame",
      genre: metadata.genres || [],
      platform: metadata.platforms || [],
      publisher: metadata.publisher || null,
      developer: metadata.developer || null,
      releaseDate: metadata.releaseDate || null,
      ...(review.igdbId && { identifier: review.igdbId }),
      ...(review.steamAppId && { gamePlatform: "Steam" }),
    };
  }

  // Add hardware-specific metadata
  if (review.category === "hardware" && review.specs) {
    return {
      ...schema,
      "@type": "Product",
      brand: {
        "@type": "Brand",
        name: (review.specs as any).brand || "Unknown",
      },
      ...(review.amazonAsin && {
        offers: {
          "@type": "Offer",
          url: review.affiliateLink || `https://amazon.de/dp/${review.amazonAsin}`,
          availability: "https://schema.org/InStock",
        },
      }),
    };
  }

  return schema;
}

/**
 * Generate Organization schema for the website
 */
export function generateOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nerdiction",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "Professionelle Game- und Hardware-Reviews für fundierte Kaufentscheidungen.",
    sameAs: [
      // Add social media links here when available
    ],
  };
}

/**
 * Generate Website schema
 */
export function generateWebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nerdiction",
    url: baseUrl,
    description: "Professionelle Game- und Hardware-Reviews für fundierte Kaufentscheidungen.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/reviews?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
