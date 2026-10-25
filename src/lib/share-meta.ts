import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import type { ShareContentType } from "@prisma/client";

export interface ShareMetadataParams {
  contentType: ShareContentType;
  contentId: string;
  title: string;
  description?: string;
  image?: string;
  url: string;
  author?: string;
  authorUrl?: string;
  authorTwitter?: string;
  publishedAt?: Date;
  tags?: string[];
  section?: string;
}

const DEFAULT_IMAGE = "/og-default.png";
const SITE_NAME = "Nerdiction.de";
const TWITTER_SITE = "@nerdiction_de";

export function getFirstImage(images: string[] | undefined): string | undefined {
  return images?.[0];
}

export function truncateDescription(text: string | undefined, maxLength = 160): string {
  if (!text) return `Entdecke Reviews, News und Guides auf ${SITE_NAME}`;
  const truncated = text.length > maxLength ? text.slice(0, maxLength - 1) + "…" : text;
  return truncated;
}

export function buildArticleTags(tags: string[] = [], section?: string): string[] {
  const articleTags = [...tags];
  if (section) articleTags.push(section);
  return articleTags.slice(0, 6);
}

function createCacheTags(params: ShareMetadataParams): string[] {
  return [`share-meta:${params.contentType}:${params.contentId}`];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCachedShareMetadata = unstable_cache(
  async (params: ShareMetadataParams): Promise<Metadata> => {
    return generateShareMetadata(params);
  },
  ["share-meta"],
  {
    revalidate: 300,
    tags: createCacheTags as any,
  }
);

function baseOpenGraph(params: {
  fullUrl: string;
  title: string;
  description: string;
  image: string;
  type?: "article" | "website" | "profile";
}): Metadata["openGraph"] {
  return {
    type: params.type || "website",
    url: params.fullUrl,
    title: params.title,
    description: params.description,
    siteName: SITE_NAME,
    locale: "de_DE",
    images: [
      {
        url: params.image,
        width: 1200,
        height: 630,
        alt: params.title,
      },
    ],
  } as Metadata["openGraph"];
}

function baseTwitter(params: {
  title: string;
  description: string;
  image: string;
  creator?: string;
  card?: "summary" | "summary_large_image";
}): Metadata["twitter"] {
  return {
    card: params.card || "summary_large_image",
    site: TWITTER_SITE,
    creator: params.creator,
    title: params.title,
    description: params.description,
    images: [params.image],
  } as Metadata["twitter"];
}

export function generateShareMetadata(params: ShareMetadataParams): Metadata {
  const {
    contentType,
    contentId,
    title,
    description,
    image,
    url,
    author,
    authorUrl,
    authorTwitter,
    publishedAt,
    tags = [],
    section,
  } = params;

  const fullUrl = url.startsWith("http") ? url : `https://nerdiction.de${url}`;
  const ogImage = image || DEFAULT_IMAGE;
  const ogDescription = truncateDescription(description);
  const articleTags = buildArticleTags(tags, section);

  const openGraph = baseOpenGraph({
    fullUrl,
    title: `${title} | ${SITE_NAME}`,
    description: ogDescription,
    image: ogImage,
    type: contentType === "REVIEW" || contentType === "SERIES" ? "article" : "website",
  });

  const twitter = baseTwitter({
    title: `${title} | ${SITE_NAME}`,
    description: ogDescription,
    image: ogImage,
    creator: authorTwitter ? `@${authorTwitter}` : undefined,
    card: "summary_large_image",
  });

  const baseMetadata: Metadata = {
    title: `${title} | ${SITE_NAME}`,
    description: ogDescription,
    openGraph,
    twitter,
    robots: {
      index: true,
      follow: true,
    },
  };

  switch (contentType) {
    case "REVIEW": {
      return {
        ...baseMetadata,
        openGraph: {
          ...openGraph,
          type: "article",
          publishedTime: publishedAt?.toISOString(),
          modifiedTime: new Date().toISOString(),
          authors: author ? [author] : undefined,
          section,
          tags: articleTags,
        } as Metadata["openGraph"],
        twitter: {
          ...twitter,
          card: "summary_large_image",
        } as Metadata["twitter"],
        other: {
          "article:author": authorUrl || "",
          "article:publisher": "https://nerdiction.de",
          "article:section": section || "Review",
          "article:tag": articleTags.join(", "),
        },
      };
    }

    case "COLLECTION": {
      return {
        ...baseMetadata,
        openGraph: {
          ...openGraph,
          type: "website",
        } as Metadata["openGraph"],
        twitter: {
          ...twitter,
          card: "summary_large_image",
        } as Metadata["twitter"],
      };
    }

    case "SERIES": {
      return {
        ...baseMetadata,
        openGraph: {
          ...openGraph,
          type: "article",
          publishedTime: publishedAt?.toISOString(),
          modifiedTime: new Date().toISOString(),
          authors: author ? [author] : undefined,
          section: "Serie",
          tags: articleTags,
        } as Metadata["openGraph"],
        twitter: {
          ...twitter,
          card: "summary_large_image",
        } as Metadata["twitter"],
        other: {
          "article:author": authorUrl || "",
          "article:publisher": "https://nerdiction.de",
          "article:section": "Serie",
          "article:tag": articleTags.join(", "),
        },
      };
    }

    case "PROFILE": {
      return {
        ...baseMetadata,
        openGraph: {
          ...openGraph,
          type: "profile",
          profile: {
            firstName: author || "Nutzer",
            username: author || "nerdiction_user",
          },
        } as any,
        twitter: {
          ...twitter,
          card: "summary",
        } as Metadata["twitter"],
      };
    }

    default:
      return baseMetadata;
  }
}

export function generateReviewMetadata(
  review: {
    id: string;
    slug: string;
    title: string;
    title_en?: string | null;
    content: string;
    category: string;
    images: string[];
    score: number;
    author?: { username: string; displayName: string };
    createdAt: Date;
    updatedAt: Date;
    tags?: { tag: { name: string } }[];
    youtubeVideos?: string[];
  },
  locale: "de" | "en" = "de"
): Metadata {
  const title = locale === "en" && review.title_en ? review.title_en : review.title;
  const excerpt = review.content
    .replace(/[#*_`\[\]()]/g, "")
    .slice(0, 160);

  const tagNames = review.tags?.map((t) => t.tag.name) || [];
  const section = review.category === "game" ? "Games" : review.category === "hardware" ? "Hardware" : "Reviews";

  return generateShareMetadata({
    contentType: "REVIEW",
    contentId: review.id,
    title,
    description: excerpt,
    image: getFirstImage(review.images),
    url: `/reviews/${review.slug}`,
    author: review.author?.displayName || review.author?.username,
    authorUrl: review.author?.username ? `https://nerdiction.de/u/${review.author.username}` : undefined,
    authorTwitter: undefined,
    publishedAt: review.createdAt,
    tags: tagNames,
    section,
  });
}

export function generateCollectionMetadata(collection: {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  owner?: { username: string; displayName: string };
  items?: { review: { images: string[] } }[];
  createdAt: Date;
  updatedAt: Date;
}): Metadata {
  const image = collection.items?.[0]?.review?.images?.[0];
  const excerpt = collection.description
    ? collection.description.replace(/[#*_`\[\]()]/g, "").slice(0, 160)
    : `Kuratierte Liste von ${collection.owner?.displayName || collection.owner?.username || "Nerdiction"}`;

  return generateShareMetadata({
    contentType: "COLLECTION",
    contentId: collection.id,
    title: collection.title,
    description: excerpt,
    image,
    url: `/listen/${collection.slug}`,
    author: collection.owner?.displayName || collection.owner?.username,
    authorUrl: collection.owner?.username ? `https://nerdiction.de/u/${collection.owner.username}` : undefined,
    publishedAt: collection.createdAt,
  });
}

export function generateSeriesMetadata(series: {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  partCount: number;
  aggregateScore?: number | null;
  createdAt: Date;
  updatedAt: Date;
}): Metadata {
  const excerpt = series.description
    ? series.description.replace(/[#*_`\[\]()]/g, "").slice(0, 160)
    : `Review-Serie mit ${series.partCount} Teilen`;

  return generateShareMetadata({
    contentType: "SERIES",
    contentId: series.id,
    title: series.title,
    description: excerpt,
    image: series.coverImage || undefined,
    url: `/serien/${series.slug}`,
    publishedAt: series.createdAt,
    section: "Serie",
  });
}

export function generateProfileMetadata(profile: {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  followerCount: number;
  followingCount: number;
}): Metadata {
  const excerpt = profile.bio
    ? profile.bio.slice(0, 160)
    : `Profil von ${profile.displayName} (${profile.followerCount} Follower)`;

  return generateShareMetadata({
    contentType: "PROFILE",
    contentId: profile.id,
    title: profile.displayName,
    description: excerpt,
    image: profile.profileImageUrl || undefined,
    url: `/u/${profile.username}`,
    author: profile.displayName,
    authorUrl: `https://nerdiction.de/u/${profile.username}`,
  });
}