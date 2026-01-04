import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import Image from "next/image";
import { generateReviewSchema } from "@/lib/seo";
import { CommentSection } from "@/components/community/CommentSection";
import Link from "next/link";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Monitor, Cpu, HardDrive, CpuIcon } from "lucide-react";
import { GameMetadata } from "@/components/reviews/GameMetadata";
import { MovieSeriesMetadata } from "@/components/reviews/MovieSeriesMetadata";
import { HardwareMetadata } from "@/components/reviews/HardwareMetadata";
import { AmazonMetadata } from "@/components/reviews/AmazonMetadata";
import { TableOfContents } from "@/components/reviews/TableOfContents";
import { RelatedReviews } from "@/components/reviews/RelatedReviews";
import { ReviewProgress } from "@/components/reviews/ReviewProgress";
import { ShareButtons } from "@/components/reviews/ShareButtons";
import { YouTubeEmbed } from "@/components/reviews/YouTubeEmbed";
import { HardwareSpecs } from "@/components/reviews/HardwareSpecs";
import { Clock, ShoppingCart } from "lucide-react";

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

  return {
    title: `${title} - Nerdiction`,
    description,
    openGraph: {
      title,
      description,
      images: review.images?.[0] ? [review.images[0]] : [],
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
    include: { 
      comments: true,
      hardware: true // Include hardware relation for hardware reviews
    }
  });

  if (!review) notFound();

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
    let firstH1Found = false;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      let text = match[2].trim();
      
      // Remove markdown links from heading text
      text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      
      // Skip the first H1 (main title) - it's already displayed at the top
      if (level === 1 && !firstH1Found) {
        firstH1Found = true;
        continue;
      }
      
      // Skip the table of contents heading itself
      const tocHeadingText = isEn ? "Table of Contents" : "Inhaltsverzeichnis";
      if (text.toLowerCase() === tocHeadingText.toLowerCase()) continue;
      
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

  // Custom component for Markdown images to handle placeholders
  const MarkdownComponents = {
    p: ({ children, ...props }: any) => {
      // Check if children is a placeholder like ![[IMAGE_1]]
      const content = children?.toString() || "";
      const match = content.match(/!\[\[IMAGE_(\d+)\]\]/);
      
      if (match) {
        const index = parseInt(match[1]); // Index from placeholder (1-based)
        const imageUrl = review.images[index]; // Use index as is, because 0 is hero
        
        if (imageUrl) {
          return (
            <div className="my-12 relative aspect-video w-full overflow-hidden rounded-2xl border-2 shadow-xl group">
              <Image
                src={imageUrl}
                alt={`Screenshot ${index}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          );
        }
        return null; // Don't show anything if image is missing
      }
      return <p {...props}>{children}</p>;
    },
  };

  return (
    <article className="max-w-5xl mx-auto space-y-10 pb-12 animate-fade-in">
      <ReviewProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Header Section */}
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
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl xl:text-6xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
              {title}
            </h1>
            <div className="pt-2">
              <ShareButtons title={title} url={`/reviews/${slug}`} />
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
          <Image
            src={review.images[0]}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <span className="text-muted-foreground font-medium">Kein Bild vorhanden</span>
          </div>
        )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
              </div>

      {/* YouTube Videos Section */}
      {review.youtubeVideos && review.youtubeVideos.length > 0 && (
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
              />
            ))}
          </div>
        </div>
      )}

              {/* Game Metadata Section */}
              {review.category === "game" && review.metadata && (
                <GameMetadata 
                  metadata={review.metadata as any} 
                  nerdictionScore={review.score}
                  isEn={isEn}
                />
              )}

              {/* Movie Metadata Section */}
              {review.category === "movie" && review.metadata && (
                <MovieSeriesMetadata 
                  metadata={review.metadata as any} 
                  category="movie"
                  isEn={isEn}
                />
              )}

              {/* Series Metadata Section */}
              {review.category === "series" && review.metadata && (
                <MovieSeriesMetadata 
                  metadata={review.metadata as any} 
                  category="series"
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

          {/* Hardware Metadata */}
          {review.category === "hardware" && (
            <HardwareMetadata 
              hardware={review.hardware}
              specs={review.specs || specs}
              affiliateLink={review.affiliateLink}
              isEn={isEn}
            />
          )}

          {/* Hardware Specifications */}
          {review.category === "hardware" && (review.specs || specs) && (
            <HardwareSpecs specs={review.specs || specs} isEn={isEn} />
          )}

          {/* Amazon Metadata */}
          {review.category === "amazon" && (
            <AmazonMetadata 
              asin={review.amazonAsin}
              specs={review.specs || specs}
              affiliateLink={review.affiliateLink}
              isEn={isEn}
            />
          )}

          {/* Hardware Requirements */}
          {review.category === "game" && specs && (
            <div className="space-y-6 pt-10 border-t">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Monitor className="h-8 w-8 text-primary" />
                {isEn ? "System Requirements" : "Systemanforderungen"}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {["minimum", "recommended"].map((type) => (
                  <div key={type} className="p-6 rounded-2xl bg-muted/30 border-2 border-border/50 space-y-4">
                    <h3 className="text-xl font-bold capitalize flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${type === "minimum" ? "bg-yellow-500" : "bg-green-500"}`} />
                      {isEn ? (type === "minimum" ? "Minimum" : "Recommended") : (type === "minimum" ? "Minimum" : "Empfohlen")}
                    </h3>
                    
                    <div className="space-y-3">
                      {[
                        { icon: Monitor, label: "OS", key: "os" },
                        { icon: Cpu, label: "CPU", key: "cpu" },
                        { icon: CpuIcon, label: "RAM", key: "ram" },
                        { icon: Monitor, label: "GPU", key: "gpu" },
                        { icon: HardDrive, label: "Storage", key: "storage" },
                      ].map((item) => (
                        <div key={item.key} className="flex items-start gap-3 text-sm">
                          <item.icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground/70">{item.label}</span>
                            <span className="text-foreground/80">{specs[type]?.[item.key] || "N/A"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        <aside className="space-y-8">
          <div className="p-8 border-2 border-primary/20 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col items-center text-center space-y-6 shadow-xl sticky top-24 backdrop-blur-sm">
            <h3 className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {isEn ? "Nerdiction Score" : "Nerdiction Wertung"}
            </h3>
            <ScoreBadge score={review.score} className="h-28 w-28 text-4xl border-4 border-background shadow-2xl" />
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              {review.score >= 90 ? (isEn ? "Phenomenal" : "Phänomenal") : review.score >= 80 ? (isEn ? "Excellent" : "Hervorragend") : review.score >= 70 ? (isEn ? "Good" : "Gut") : (isEn ? "Satisfactory" : "Befriedigend")}
            </p>
            
            <div className="w-full pt-4 space-y-6 border-t border-primary/20">
                <div className="text-left space-y-3">
                    <h4 className="font-bold flex items-center text-green-500 dark:text-green-400 uppercase text-xs tracking-widest">
                        <span className="mr-2 text-lg">+</span> Pro
                    </h4>
                    <ul className="space-y-2.5">
                    {pros.map((pro, i) => (
                        <li key={i} className="flex items-start text-sm leading-relaxed">
                        <span className="text-green-500 dark:text-green-400 mr-2.5 font-bold mt-0.5">✓</span> 
                        <span className="flex-1">{pro}</span>
                        </li>
                    ))}
                    </ul>
                </div>

                <div className="text-left space-y-3">
                    <h4 className="font-bold flex items-center text-red-500 dark:text-red-400 uppercase text-xs tracking-widest">
                        <span className="mr-2 text-lg">-</span> Contra
                    </h4>
                    <ul className="space-y-2.5">
                    {cons.map((con, i) => (
                        <li key={i} className="flex items-start text-sm leading-relaxed">
                        <span className="text-red-500 dark:text-red-400 mr-2.5 font-bold mt-0.5">✗</span> 
                        <span className="flex-1">{con}</span>
                        </li>
                    ))}
                    </ul>
                </div>
            </div>

            {/* Amazon Affiliate Link - Only show in sidebar if not shown in metadata section */}
            {review.category === "hardware" && !review.affiliateLink && (
              <div className="w-full pt-6 border-t border-primary/20">
                <div className="text-center p-4 rounded-lg bg-muted/50 border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    {isEn 
                      ? "Amazon link not available" 
                      : "Amazon-Link nicht verfügbar"}
                  </p>
                </div>
              </div>
            )}
            
            {/* Other affiliate links (for non-hardware, non-amazon) */}
            {review.category !== "hardware" && review.category !== "amazon" && review.affiliateLink && (
              <div className="w-full pt-6 border-t border-primary/20">
                <a 
                  href={review.affiliateLink} 
                  target="_blank" 
                  rel="nofollow sponsored"
                  className="flex items-center justify-center w-full bg-[#FF9900] hover:bg-[#E68A00] text-black font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] group"
                >
                  <span>{isEn ? "View on Amazon" : "Auf Amazon ansehen"}</span>
                  <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
