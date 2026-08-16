import type { Prisma } from "@prisma/client";

export const SITE_NAME = "Nerdiction";

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://nerdiction.de")
  );
}

const reviewTypeMap: Record<string, string> = {
  game: "VideoGame",
  movie: "Movie",
  series: "TVSeries",
  hardware: "Product",
};

interface ReviewSchemaInput {
  slug?: string;
  title?: string;
  category?: string;
  score?: number;
  content?: string;
  images?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  metadata?: Prisma.JsonValue | null;
}

function plainText(md: string, maxLen = 400): string {
  const plain = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length <= maxLen ? plain : plain.substring(0, maxLen - 3) + "...";
}

export function generateReviewSchema(review: ReviewSchemaInput) {
  const url = `${getSiteUrl()}/reviews/${review.slug}`;
  const type = reviewTypeMap[review.category || ""] || "Product";
  const genres = (review.metadata as { genres?: string[] } | null)?.genres;

  return {
    "@context": "https://schema.org",
    "@type": "Review",
    "@id": `${url}#review`,
    "url": url,
    "headline": review.title,
    "name": `${review.title} Test & Review`,
    "image": review.images?.[0],
    "datePublished": review.createdAt instanceof Date ? review.createdAt.toISOString() : undefined,
    "dateModified": review.updatedAt instanceof Date ? review.updatedAt.toISOString() : undefined,
    "mainEntityOfPage": url,
    "itemReviewed": {
      "@type": type,
      "name": review.title,
      "image": review.images?.[0],
      "url": url,
      ...(review.category === "game" && genres?.length
        ? { genre: genres.map((g: string) => g) }
        : {}),
    },
    "author": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": getSiteUrl(),
    },
    "publisher": {
      "@type": "Organization",
      "name": SITE_NAME,
      "url": getSiteUrl(),
      "logo": {
        "@type": "ImageObject",
        "url": `${getSiteUrl()}/icon-512.png`,
      },
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.score,
      "bestRating": 100,
      "worstRating": 0,
      "alternateName": `${review.score} von 100`,
    },
    "reviewBody": plainText(review.content || ""),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url,
    })),
  };
}

export function generateItemListSchema(
  items: { name: string; url: string; image?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": item.url,
      "name": item.name,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

export function generateOrganizationSchema() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}#organization`,
    "name": SITE_NAME,
    "url": url,
    "logo": {
      "@type": "ImageObject",
      "url": `${url}/icon-512.png`,
      "width": 512,
      "height": 512,
    },
  };
}

export function generateWebsiteSchema() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}#website`,
    "name": SITE_NAME,
    "url": url,
    "description": "Die Plattform für detaillierte Hardware- und Game-Reviews für fundierte Kaufentscheidungen.",
    "inLanguage": "de-DE",
    "publisher": {
      "@id": `${url}#organization`,
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${url}/reviews?query={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
