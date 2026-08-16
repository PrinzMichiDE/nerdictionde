import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import Image from "next/image";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateReviewSchema,
  getSiteUrl,
} from "@/lib/seo";
import { CommentSection } from "@/components/community/CommentSection";
import Link from "next/link";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlugCustomId from "rehype-slug-custom-id";
import { Monitor, Cpu, HardDrive, CpuIcon } from "lucide-react";
import { GameMetadata } from "@/components/reviews/GameMetadata";
import { MovieSeriesMetadata } from "@/components/reviews/MovieSeriesMetadata";
import { TableOfContents } from "@/components/reviews/TableOfContents";
import { RelatedReviews } from "@/components/reviews/RelatedReviews";
import { ReviewProgress } from "@/components/reviews/ReviewProgress";
import { ShareButtons } from "@/components/reviews/ShareButtons";
import { YouTubeEmbed } from "@/components/reviews/YouTubeEmbed";
import { EpisodeList } from "@/components/reviews/EpisodeList";
import { GameProgressTracker } from "@/components/reviews/GameProgressTracker";
import { SpoilerWarning } from "@/components/reviews/SpoilerWarning";
import { SpoilerSection } from "@/components/reviews/SpoilerSection";
import { Clock, Check, X } from "lucide-react";

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
  const content = isEn && review.content_en ? review.content_en : review.content;
  const description =
    review.metaDescription || content.substring(0, 160).replace(/\n/g, " ");

  const url = `${getSiteUrl()}/reviews/${slug}`;

  const image = review.images?.[0];

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        "de-DE": url,
        en: `${url}?lang=en`,
        "x-default": url,
      },
    },
    keywords: review.metaKeywords
      ? review.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
      : [title, review.category, "Review", "Test", "Kritik"],
    openGraph: {
      type: "article",
      title: `${title} Test & Review`,
      description,
      url,
      siteName: "Nerdiction",
      locale: "de_DE",
      images: image ? [{ url: image, alt: title }] : [],
      publishedTime: review.createdAt instanceof Date ? review.createdAt.toISOString() : undefined,
      modifiedTime: review.updatedAt instanceof Date ? review.updatedAt.toISOString() : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} Test & Review`,
      description,
      images: image ? [image] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

function buildFaqs(review: any, isEn: boolean) {
  const title = isEn && review.title_en ? review.title_en : review.title;
  const pros = (isEn && review.pros_en?.length ? review.pros_en : review.pros) || [];
  const cons = (isEn && review.cons_en?.length ? review.cons_en : review.cons) || [];
  const score = review.score;

  const verdict =
    score >= 90
      ? isEn
        ? "outstanding"
        : "phänomenal"
      : score >= 80
        ? isEn
          ? "excellent"
          : "hervorragend"
        : score >= 70
          ? isEn
            ? "good"
            : "gut"
          : isEn
            ? "satisfactory"
            : "befriedigend";

  const worthIt = score >= 70;

  const faqs = [
    {
      question: isEn ? `How good is ${title}?` : `Wie gut ist ${title}?`,
      answer: `${title} wurde von Nerdiction mit ${score} von 100 Punkten bewertet und ist damit ${verdict}.`,
    },
  ];

  if (pros.length > 0) {
    faqs.push({
      question: isEn ? `What are the pros of ${title}?` : `Was sind die Vorteile von ${title}?`,
      answer: `${isEn ? "The advantages of" : "Die Vorteile von"} ${title}: ${pros.join(", ")}.`,
    });
  }

  if (cons.length > 0) {
    faqs.push({
      question: isEn ? `What are the cons of ${title}?` : `Was sind die Nachteile von ${title}?`,
      answer: `${isEn ? "The disadvantages of" : "Die Nachteile von"} ${title}: ${cons.join(", ")}.`,
    });
  }

  faqs.push({
    question: isEn ? `Is ${title} worth it?` : `Lohnt sich ${title}?`,
    answer: worthIt
      ? isEn
        ? `Yes. ${title} received a score of ${score}/100 points and is ${verdict}.`
        : `Ja. ${title} erhält ${score} von 100 Punkten und ist ${verdict}.`
      : isEn
        ? `Only conditionally. ${title} received a score of ${score}/100 points.`
        : `Nur bedingt. ${title} erhält ${score} von 100 Punkten.`,
  });

  return faqs;
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
    }
  });

  if (!review) notFound();

  const title = isEn && review.title_en ? review.title_en : review.title;
  const content = isEn && review.content_en ? review.content_en : review.content;
  const pros = isEn && review.pros_en.length > 0 ? review.pros_en : review.pros;
  const cons = isEn && review.cons_en.length > 0 ? review.cons_en : review.cons;

  const verdictPhrase =
    review.score >= 90
      ? isEn
        ? "outstanding"
        : "phänomenal"
      : review.score >= 80
        ? isEn
          ? "excellent"
          : "hervorragend"
        : review.score >= 70
          ? isEn
            ? "good"
            : "gut"
          : isEn
            ? "satisfactory"
            : "befriedigend";

  // Calculate reading time
  const wordCount = (content || "").split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const jsonLd = generateReviewSchema({ ...review, title, content });

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/reviews/${slug}`;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: isEn ? "Home" : "Startseite", url: siteUrl },
    { name: "Reviews", url: `${siteUrl}/reviews` },
    { name: title, url: canonicalUrl },
  ]);
  const faqs = buildFaqs(review, isEn);
  const faqSchema = generateFAQSchema(faqs);

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
      
      // Remove markdown links from heading text first
      text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      
      // Check for explicit anchor ID like {#fazit}
      const explicitIdMatch = text.match(/\s*\{#([^}]+)\}\s*$/);
      let id: string;
      
      if (explicitIdMatch) {
        // Use explicit anchor ID
        id = explicitIdMatch[1];
        // Remove the explicit anchor ID from the text
        text = text.replace(/\s*\{#[^}]+\}\s*$/, '').trim();
      } else {
        // Generate ID automatically (similar to rehype-slug-custom-id)
        id = text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .trim();
      }
      
      // Skip the first H1 (main title) - it's already displayed at the top
      if (level === 1 && !firstH1Found) {
        firstH1Found = true;
        continue;
      }
      
      // Skip the table of contents heading itself
      const tocHeadingText = isEn ? "Table of Contents" : "Inhaltsverzeichnis";
      if (text.toLowerCase() === tocHeadingText.toLowerCase()) continue;
      
      headings.push({ level, text, id });
    }

    return headings;
  }

  const headings = extractHeadings(content || "");
  const hasTableOfContents = headings.length > 0;

  // remark plugin: converts "> SPOILER: …" blockquotes into custom "spoiler" nodes
  interface MdastNode {
    type: string;
    value?: string;
    children?: MdastNode[];
    data?: { hName?: string };
  }
  function spoilerPlugin() {
    const walk = (node: MdastNode) => {
      if (node.children) {
        for (const child of node.children) walk(child);
      }
      if (node.type === "blockquote") {
        const first = node.children?.find((c) => c.type === "paragraph");
        const text = first?.children?.find((c) => c.type === "text");
        if (text && /^spoiler/i.test(String(text.value).trim())) {
          text.value = String(text.value).replace(/^SPOILER(?:\s*[:：])?\s*/i, "");
          node.type = "spoiler";
          node.data = { hName: "spoiler" };
        }
      }
    };
    return () => (tree: MdastNode) => walk(tree);
  }

  // Custom component for Markdown images to handle placeholders
  const MarkdownComponents = {
    spoiler: ({ children }: { children?: React.ReactNode }) => (
      <SpoilerSection isEn={isEn}>{children}</SpoilerSection>
    ),
    p: ({ children, ...props }: any) => {
      // Check if children is a placeholder like ![[IMAGE_1]]
      const content = children?.toString() || "";
      const match = content.match(/!\[\[IMAGE_(\d+)\]\]/);
      
      if (match) {
        const index = parseInt(match[1]); // Index from placeholder (1-based)
        const imageUrl = review.images[index]; // Use index as is, because 0 is hero
        
        if (imageUrl) {
          return (
            <div className="my-12 relative aspect-video w-full overflow-hidden rounded-md group">
              <Image
                src={imageUrl}
                alt={`Screenshot ${index}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          );
        }
        return null; // Don't show anything if image is missing
      }
      return <p {...props}>{children}</p>;
    },
  };

  return (
    <article className="max-w-5xl mx-auto space-y-10 pb-12">
      <ReviewProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Breadcrumb */}
      <nav aria-label={isEn ? "Breadcrumb" : "Brotkrumen-Navigation"} className="-mb-2">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-primary transition-colors">
              {isEn ? "Home" : "Startseite"}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/reviews" className="hover:text-primary transition-colors">
              Reviews
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground/80 line-clamp-1">{title}</li>
        </ol>
      </nav>

      {/* Header Section */}
      <header className="border-b border-border pb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="kicker text-primary">
                {review.category === "game" ? "Test" : "Kritik"} · {review.category}
              </span>
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {readingTime} {isEn ? "min read" : "Min. Lesezeit"}
              </span>
              <time
                dateTime={review.createdAt.toISOString()}
                className="text-sm text-muted-foreground"
              >
                {isEn ? "Published on" : "Veröffentlicht am"} {formattedDate}
              </time>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] max-w-4xl">
              {title}
            </h1>

            <div className="pt-1">
              <ShareButtons title={title} url={`/reviews/${slug}`} />
            </div>
          </div>

          <div className="flex items-center self-start lg:self-end gap-1 bg-muted rounded-md p-1 text-xs font-semibold uppercase tracking-widest border border-border shrink-0">
            <Link
              href={`/reviews/${slug}`}
              className={`px-4 py-2 rounded-[4px] transition-colors ${
                !isEn
                  ? "bg-background text-foreground border border-border shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              DE
            </Link>
            <Link
              href={`/reviews/${slug}?lang=en`}
              className={`px-4 py-2 rounded-[4px] transition-colors ${
                isEn
                  ? "bg-background text-foreground border border-border shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
        {review.images?.[0] ? (
          <Image
            src={review.images[0]}
            alt={title}
            fill
            className="object-cover"
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground font-medium">Kein Bild vorhanden</span>
          </div>
        )}
      </div>

      {/* At a Glance / Auf einen Blick - for SEO & AEO */}
      <section
        aria-label={isEn ? "At a glance" : "Auf einen Blick"}
        className="p-6 md:p-8 rounded-md border border-border bg-card"
      >
        <div className="flex flex-col md:flex-row gap-6 md:items-start">
          <div className="flex items-center gap-4 md:flex-col md:items-center md:shrink-0">
            <ScoreBadge score={review.score} className="h-16 w-16 md:h-20 md:w-20 text-2xl" />
            <span className="kicker text-primary">
              {review.score >= 90 ? (isEn ? "Phenomenal" : "Phänomenal") : review.score >= 80 ? (isEn ? "Excellent" : "Hervorragend") : review.score >= 70 ? (isEn ? "Good" : "Gut") : (isEn ? "Satisfactory" : "Befriedigend")}
            </span>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <span className="kicker text-primary">{isEn ? "At a Glance" : "Auf einen Blick"}</span>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mt-1">
                {isEn ? "The Verdict" : "Das Urteil"}
              </h2>
            </div>
            <p className="text-foreground/90 leading-relaxed">
              {isEn
                ? `The Nerdiction verdict: ${title} is ${verdictPhrase} and receives ${review.score} out of 100 points.`
                : `Das Nerdiction-Urteil: ${title} ist ${verdictPhrase} und erhält ${review.score} von 100 Punkten.`}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {pros.length > 0 && (
                <div>
                  <h3 className="kicker text-green-700 dark:text-green-500 mb-2">Pro</h3>
                  <ul className="space-y-1.5">
                    {pros.slice(0, 3).map((pro, i) => (
                      <li key={i} className="flex items-start text-sm text-foreground/80">
                        <Check className="size-4 text-green-600 dark:text-green-500 mr-2 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cons.length > 0 && (
                <div>
                  <h3 className="kicker text-red-700 dark:text-red-500 mb-2">Contra</h3>
                  <ul className="space-y-1.5">
                    {cons.slice(0, 3).map((con, i) => (
                      <li key={i} className="flex items-start text-sm text-foreground/80">
                        <X className="size-4 text-red-600 dark:text-red-500 mr-2 shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* YouTube Videos Section */}
      {review.youtubeVideos && review.youtubeVideos.length > 0 && (
        <div className="space-y-6">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight border-b border-border pb-3">
            {isEn ? "Videos & Trailers" : "Videos & Trailer"}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {review.youtubeVideos.map((videoId, index) => (
              <YouTubeEmbed
                key={index}
                videoId={videoId}
                title={`${title} - ${isEn ? "Video" : "Video"} ${index + 1}`}
                reviewId={review.id}
                isEn={isEn}
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
                  steamAppId={review.steamAppId}
                  epicId={review.epicId}
                  gogId={review.gogId}
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

          {/* Spoiler warning for movie/series reviews */}
          {(review.category === "movie" || review.category === "series") && (
            <SpoilerWarning
              message={
                isEn
                  ? "This section may contain spoilers. Read at your own discretion."
                  : "Dieser Abschnitt kann Spoiler enthalten. Auf eigene Gefahr weiterlesen."
              }
            />
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed prose-headings:scroll-mt-24 prose-headings:font-serif prose-headings:tracking-tight prose-headings:font-semibold">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, spoilerPlugin]}
              rehypePlugins={[[rehypeSlugCustomId, { enableCustomId: true }]]}
              components={MarkdownComponents as any}
            >
              {content || ""}
            </ReactMarkdown>
          </div>

          {/* Hardware Requirements */}
          {review.category === "game" && specs && (
            <div className="space-y-6 pt-10 border-t border-border">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight flex items-center gap-3">
                <Monitor className="h-6 w-6 text-primary" />
                {isEn ? "System Requirements" : "Systemanforderungen"}
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {["minimum", "recommended"].map((type) => (
                  <div key={type} className="p-6 rounded-md bg-muted/40 border border-border space-y-4">
                    <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${type === "minimum" ? "bg-amber-500" : "bg-green-600"}`} />
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
                            <span className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</span>
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

          {/* Episode ratings for series reviews */}
          {review.category === "series" && (
            <EpisodeList reviewId={review.id} isEn={isEn} />
          )}

          {/* Tested playthrough for game reviews */}
          {review.category === "game" && (
            <GameProgressTracker reviewId={review.id} isEn={isEn} />
          )}

          {/* Related Reviews */}
          <RelatedReviews 
            currentReviewId={review.id} 
            category={review.category} 
            score={review.score} 
          />

          {/* FAQ Section - matches FAQPage schema for AEO */}
          {faqs.length > 0 && (
            <section aria-label={isEn ? "Frequently Asked Questions" : "Häufige Fragen"} className="space-y-6 pt-10 border-t border-border">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
                {isEn ? "Frequently Asked Questions" : "Häufige Fragen"}
              </h2>
              <div className="space-y-5">
                {faqs.map((faq, index) => (
                  <div key={index}>
                    <h3 className="font-serif text-lg font-semibold tracking-tight mb-1.5">
                      {faq.question}
                    </h3>
                    <p className="text-foreground/80 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Comment Section */}
          <CommentSection reviewId={review.id} initialComments={review.comments} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="p-6 rounded-md border border-border bg-card flex flex-col items-center text-center space-y-5 sticky top-24">
            <h3 className="font-serif text-xl font-semibold tracking-tight">
              {isEn ? "Nerdiction Score" : "Nerdiction Wertung"}
            </h3>
            <ScoreBadge score={review.score} className="h-20 w-20 text-2xl" />
            <p className="kicker text-primary">
              {review.score >= 90 ? (isEn ? "Phenomenal" : "Phänomenal") : review.score >= 80 ? (isEn ? "Excellent" : "Hervorragend") : review.score >= 70 ? (isEn ? "Good" : "Gut") : (isEn ? "Satisfactory" : "Befriedigend")}
            </p>

            <div className="w-full pt-4 space-y-5 border-t border-border">
              <div className="text-left space-y-2.5">
                <h4 className="kicker text-green-700 dark:text-green-500">Pro</h4>
                <ul className="space-y-2.5">
                  {pros.map((pro, i) => (
                    <li key={i} className="flex items-start text-sm leading-relaxed">
                      <Check className="size-4 text-green-600 dark:text-green-500 mr-2 shrink-0 mt-0.5" />
                      <span className="flex-1">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-left space-y-2.5">
                <h4 className="kicker text-red-700 dark:text-red-500">Contra</h4>
                <ul className="space-y-2.5">
                  {cons.map((con, i) => (
                    <li key={i} className="flex items-start text-sm leading-relaxed">
                      <X className="size-4 text-red-600 dark:text-red-500 mr-2 shrink-0 mt-0.5" />
                      <span className="flex-1">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </article>
  );
}
