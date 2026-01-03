import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import Image from "next/image";
import { generateReviewSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { CommentSection } from "@/components/community/CommentSection";
import Link from "next/link";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { GameMetadata } from "@/components/reviews/GameMetadata";
import { SystemRequirements } from "@/components/reviews/SystemRequirements";
import { TableOfContents } from "@/components/reviews/TableOfContents";
import { RelatedReviews } from "@/components/reviews/RelatedReviews";
import { ReviewProgress } from "@/components/reviews/ReviewProgress";
import { ShareButtons } from "@/components/reviews/ShareButtons";
import { YouTubeEmbed } from "@/components/reviews/YouTubeEmbed";
import { ImageGallery } from "@/components/reviews/ImageGallery";
import { StickySidebar } from "@/components/reviews/StickySidebar";
import { createMarkdownComponents } from "@/components/reviews/MarkdownComponents";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { AnimatedText } from "@/components/shared/AnimatedText";
import { Recommendations } from "@/components/reviews/Recommendations";
import { PriceDisplay } from "@/components/reviews/PriceDisplay";
import { ImageZoom } from "@/components/reviews/ImageZoom";
import { BookmarkButton } from "@/components/shared/BookmarkButton";
import { ExportMenu } from "@/components/reviews/ExportMenu";
import { ReviewViewTracker } from "@/components/reviews/ReviewViewTracker";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Review } from "@/types/review";
import { incrementViewCount } from "@/lib/db/statistics";

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;
  const isEn = lang === "en";

  const review = await prisma.review.findUnique({
    where: { slug },
  });

  if (!review) return {};

  const title = isEn && review.title_en ? review.title_en : review.title;
  const description = (isEn && review.content_en ? review.content_en : review.content).substring(0, 160);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";
  const reviewUrl = `${baseUrl}/reviews/${slug}`;
  const imageUrl = review.images?.[0] || `${baseUrl}/og-image.png`;

  return {
    title: `${title} - Nerdiction`,
    description,
    alternates: {
      canonical: reviewUrl,
    },
    openGraph: {
      title,
      description,
      url: reviewUrl,
      siteName: "Nerdiction",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "article",
      publishedTime: review.createdAt instanceof Date ? review.createdAt.toISOString() : new Date(review.createdAt).toISOString(),
      modifiedTime: review.updatedAt instanceof Date ? review.updatedAt.toISOString() : new Date(review.updatedAt).toISOString(),
      authors: ["Nerdiction"],
      tags: [review.category],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ReviewDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const isEn = lang === "en";

  const review = await prisma.review.findUnique({
    where: { slug },
    include: { comments: true },
  });

  if (!review) notFound();

  // Increment view count (fire and forget - don't await to avoid blocking)
  incrementViewCount(review.id).catch(() => {
    // Silently fail if view count increment fails
  });

  // Fetch all reviews for recommendations
  const allReviews = (await prisma.review.findMany({
    where: { status: "published" },
  })) as unknown as Review[];

  const title = isEn && review.title_en ? review.title_en : review.title;
  const content = isEn && review.content_en ? review.content_en : review.content;
  const pros = isEn && review.pros_en.length > 0 ? review.pros_en : review.pros;
  const cons = isEn && review.cons_en.length > 0 ? review.cons_en : review.cons;

  // Calculate reading time
  const wordCount = (content || "").split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const jsonLd = generateReviewSchema({ ...review, title, content });

  const formattedDate = review.createdAt.toLocaleDateString(isEn ? "en-US" : "de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const specs = review.specs as any;

  // Extract headings from markdown content to generate table of contents
  function extractHeadings(markdown: string): Array<{ level: number; text: string; id: string }> {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: Array<{ level: number; text: string; id: string }> = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      let text = match[2].trim();
      
      // Remove markdown links from heading text
      text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      
      // Generate ID similar to rehype-slug (handles German umlauts and special chars)
      const id = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .trim();
      
      headings.push({ level, text, id });
    }

    return headings;
  }

  const headings = extractHeadings(content || "");
  const hasTableOfContents = headings.length > 0;

  // Create markdown components with images and review title
  const MarkdownComponents = createMarkdownComponents({
    images: review.images || [],
    reviewTitle: title,
  });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Startseite", url: baseUrl },
    { name: "Reviews", url: `${baseUrl}/reviews` },
    { name: title, url: `${baseUrl}/reviews/${slug}` },
  ]);

  return (
    <article className="max-w-5xl mx-auto space-y-10 pb-12 animate-fade-in">
      <ReviewProgress />
      <ReviewViewTracker reviewId={review.id} reviewTitle={title} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* Back Button */}
      <AnimatedSection direction="left" delay={0.1}>
        <Link
          href="/reviews"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-label={isEn ? "Back to reviews" : "Zurück zu Reviews"}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {isEn ? "Back to Reviews" : "Zurück zu Reviews"}
        </Link>
      </AnimatedSection>
      
      {/* Header Section */}
      <AnimatedSection direction="up" delay={0.2}>
        <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="capitalize text-xs font-semibold border-primary/30 bg-primary/5">
                {review.category}
              </Badge>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                <Clock className="size-3.5" />
                <span>{readingTime} {isEn ? "min read" : "Min. Lesezeit"}</span>
              </div>
              <time 
                dateTime={review.createdAt.toISOString()}
                className="text-sm text-muted-foreground font-medium"
              >
                {isEn ? "Published on" : "Veröffentlicht am"} {formattedDate}
              </time>
            </div>
            <AnimatedText variant="h1" stagger delay={0.3} className="text-4xl font-extrabold tracking-tight lg:text-5xl xl:text-6xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
              {title}
            </AnimatedText>
            <div className="flex items-center gap-3 pt-2">
              <ShareButtons title={title} url={`/reviews/${slug}`} reviewId={review.id} />
              <BookmarkButton reviewId={review.id} reviewTitle={title} />
              <ExportMenu review={review as Review} />
            </div>
          </div>

          <div className="flex bg-muted rounded-lg p-1 text-xs font-bold uppercase tracking-widest border">
            <Link 
              href={`/reviews/${slug}`} 
              className={`px-4 py-2 rounded-md transition-all ${
                !isEn 
                  ? "bg-background shadow-sm text-primary border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              DE
            </Link>
            <Link 
              href={`/reviews/${slug}?lang=en`} 
              className={`px-4 py-2 rounded-md transition-all ${
                isEn 
                  ? "bg-background shadow-sm text-primary border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 shadow-2xl group">
        {review.images?.[0] ? (
          <>
            <Image
              src={review.images[0]}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-muted-foreground font-medium">
              {isEn ? "No image available" : "Kein Bild vorhanden"}
            </span>
          </div>
        )}
        </motion.div>
      </AnimatedSection>

      {/* Image Gallery */}
      {review.images && review.images.length > 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">
            {isEn ? "Screenshots" : "Screenshots"}
          </h2>
          <ImageGallery images={review.images.slice(1)} title={title} />
        </div>
      )}

      {/* YouTube Videos Section */}
      {review.youtubeVideos && review.youtubeVideos.length > 0 && (
        <AnimatedSection direction="up" delay={0.3}>
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">
              {isEn ? "Videos & Trailers" : "Videos & Trailer"}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {review.youtubeVideos.map((videoId, index) => (
                <YouTubeEmbed
                  key={index}
                  videoId={videoId}
                  title={`${title} - ${isEn ? "Video" : "Video"} ${index + 1}`}
                  timestamps={
                    index === 0
                      ? [
                          { time: 30, label: "Gameplay" },
                          { time: 120, label: "Features" },
                          { time: 240, label: "Fazit" },
                        ]
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

              {/* Game Metadata Section */}
              {review.category === "game" && review.metadata && (
                <GameMetadata 
                  metadata={review.metadata as any} 
                  nerdictionScore={review.score}
                  isEn={isEn}
                />
              )}

              <div className="grid gap-12 md:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div className="space-y-12">
          {/* Table of Contents */}
          {hasTableOfContents && <TableOfContents headings={headings} isEn={isEn} />}

          <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed prose-headings:scroll-mt-24">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSlug]}
              components={MarkdownComponents as any}
            >
              {content || ""}
            </ReactMarkdown>
          </div>

          {/* Hardware Requirements */}
          {review.category === "game" && specs && (
            <SystemRequirements specs={specs} isEn={isEn} />
          )}

          {/* Recommendations */}
          <Recommendations
            currentReview={review as Review}
            allReviews={allReviews}
            variant="similar"
            limit={6}
          />

          {/* Related Reviews */}
          <RelatedReviews 
            currentReviewId={review.id} 
            category={review.category} 
            score={review.score} 
          />

          {/* Comment Section */}
          <CommentSection reviewId={review.id} initialComments={review.comments} />
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <StickySidebar
            score={review.score}
            pros={pros}
            cons={cons}
            affiliateLink={review.affiliateLink}
            title={title}
            url={`/reviews/${slug}`}
            isEn={isEn}
          />

          {/* Price Display */}
          {(review.affiliateLink || review.amazonAsin) && (
            <AnimatedSection direction="up" delay={0.4}>
              <PriceDisplay
                reviewId={review.id}
                affiliateLink={review.affiliateLink}
                amazonAsin={review.amazonAsin}
                category={review.category}
              />
            </AnimatedSection>
          )}
        </div>
      </div>
    </article>
  );
}
