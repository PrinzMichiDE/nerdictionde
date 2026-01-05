import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://nerdiction.de");

  // Statische Seiten
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/reviews`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gaming-pcs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/impressum`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/datenschutz`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/kooperationen`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/mediadaten`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamische Seiten: Reviews
  const reviews = await prisma.review.findMany({
    where: {
      status: "published",
    },
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const reviewPages: MetadataRoute.Sitemap = reviews.map((review) => ({
    url: `${baseUrl}/reviews/${review.slug}`,
    lastModified: review.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Dynamische Seiten: Gaming PC Builds
  const pcBuilds = await prisma.pCBuild.findMany({
    where: {
      status: "published",
    },
    select: {
      slug: true,
      pricePoint: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const pcBuildPages: MetadataRoute.Sitemap = pcBuilds.map((build) => ({
    url: `${baseUrl}/gaming-pcs/${build.slug || build.pricePoint}`,
    lastModified: build.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Kombiniere alle Seiten
  return [...staticPages, ...reviewPages, ...pcBuildPages];
}

