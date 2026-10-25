import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlugCustomId from "rehype-slug-custom-id";
import { ArrowLeft } from "lucide-react";
import { GameMetadata } from "@/components/reviews/GameMetadata";
import { MovieSeriesMetadata } from "@/components/reviews/MovieSeriesMetadata";
import { TableOfContents } from "@/components/reviews/TableOfContents";
import { RelatedReviews } from "@/components/reviews/RelatedReviews";
import { HardwareMetadata } from "@/components/reviews/HardwareMetadata";
import { ReviewProgress } from "@/components/reviews/ReviewProgress";
import { ReviewActions } from "@/components/reviews/ReviewActions";
import { ReviewReactions } from "@/components/reviews/ReviewReactions";
import { ReadingHistoryBadge } from "@/components/reading-history/ReadingHistoryBadge";
import { ReadingHistoryTrackerWrapper } from "@/components/reading-history/ReadingHistoryTrackerWrapper";
import { getReadingHistoryForReview } from "@/lib/reading-history";
import { FEATURE_READING_HISTORY } from "@/lib/feature-flags";
import { getReviewSeriesInfo } from "@/lib/review-series";
import { SeriesBadge } from "@/components/series/SeriesBadge";
import { FEATURE_REVIEW_SERIES } from "@/lib/feature-flags";
import { YouTubeEmbed } from "@/components/reviews/YouTubeEmbed";
import { EpisodeList } from "@/components/reviews/EpisodeList";
import { GameProgressTracker } from "@/components/reviews/GameProgressTracker";
import { SpoilerWarning } from "@/components/reviews/SpoilerWarning";
import { SpoilerSection } from "@/components/reviews/SpoilerSection";
import { getCategoryStyle } from "@/lib/review-category";
import { getServerSession } from "@/lib/session";
import { UserRatingSection } from "@/components/reviews/UserRatingSection";
import { DealsWidget } from "@/components/reviews/DealsWidget";
import { CommentSection } from "@/components/community/CommentSection";
import { QAList } from "@/components/qa/QAList";
import { getQAList } from "@/lib/qa";
import { FEATURE_COMMUNITY_QA } from "@/lib/qa-schema";
import { HardwareCompatibilityBadge, HardwareCompatibilitySkeleton } from "@/components/reviews/HardwareCompatibilityBadge";
import { FEATURE_HARDWARE_COMPATIBILITY } from "@/lib/feature-flags";
import { checkCompatibility, estimateFps } from "@/lib/hardware-compatibility";
import { ScoreBlock } from "@/components/shared/ScoreBlock";
import { ProsCons } from "@/components/shared/ProsCons";
import { MetaLine } from "@/components/shared/MetaLine";
import { SpecTable } from "@/components/shared/SpecTable";
import { SourceList } from "@/components/shared/SourceList";
import { MethodNote } from "@/components/shared/MethodNote";
import { RatingBreakdown } from "@/components/shared/RatingBreakdown";
import { ScoreCompare } from "@/components/shared/ScoreCompare";
import { ReadingProgressBar } from "@/components/shared/ReadingProgressBar";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { getCachedReviewReactions } from "@/lib/review-reactions";
import { generateBreadcrumbSchema, generateFAQSchema, generateReviewSchema, getSiteUrl } from "@/lib/seo";
import { buildSchemaOrgReview } from "@/lib/review-templates";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ReviewRecommendations } from "@/components/recommendations";
import { ReviewTemplateRenderer } from "@/components/reviews/ReviewTemplateRenderer";
import { getTemplate } from "@/lib/review-templates";
import { FEATURE_REVIEW_TEMPLATES } from "@/lib/feature-flags";
import { generateReviewMetadata } from "@/lib/share-meta";

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
    include: { tags: { include: { tag: true } } },
  });

  if (!review) return {};

  const title = isEn && review.title_en ? review.title_en : review.title;
  const content = isEn && review.content_en ? review.content_en : review.content;
  const description =
    review.metaDescription || content.substring(0, 160).replace(/\n/g, " ");

  return generateReviewMetadata(
    {
      id: review.id,
      slug: review.slug,
      title: review.title,
      title_en: review.title_en,
      content: review.content,
      category: review.category,
      images: review.images,
      score: review.score,
      author: undefined, // Author info not in this select
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      tags: review.tags ?? undefined,
      youtubeVideos: review.youtubeVideos,
    },
    isEn ? "en" : "de"
  );
}

interface FaqReviewShape {
  title: string;
  title_en?: string | null;
  score: number;
  pros: string[];
  pros_en?: string[];
  cons: string[];
  cons_en?: string[];
}

function buildFaqs(review: FaqReviewShape, isEn: boolean) {
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
    select: {
      id: true,
      slug: true,
      title: true,
      title_en: true,
      category: true,
      content: true,
      content_en: true,
      score: true,
      pros: true,
      pros_en: true,
      cons: true,
      cons_en: true,
      images: true,
      youtubeVideos: true,
      status: true,
      igdbId: true,
      tmdbId: true,
      steamAppId: true,
      epicId: true,
      gogId: true,
      amazonAsin: true,
      affiliateLink: true,
      hardwareId: true,
      specs: true,
      metadata: true,
      metaDescription: true,
      metaKeywords: true,
      releaseDate: true,
      userRatingCount: true,
      userRatingAvg: true,
      seriesId: true,
      seriesOrder: true,
      templateId: true,
      templateData: true,
      templateVersion: true,
      createdAt: true,
      updatedAt: true,
      comments: true,
      tags: { include: { tag: true } },
    },
  });

  if (!review) notFound();

  const [deals, priceHistory] = await Promise.all([
    prisma.deal.findMany({
      where: { reviewId: review.id, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.priceHistory.findMany({
      where: { reviewId: review.id },
      orderBy: { recordedAt: "asc" },
      take: 30,
    }),
  ]);

  const session = await getServerSession();

  const reactions = await getCachedReviewReactions(review.id, session?.userId ?? null);
  const readingHistory = session?.userId
    ? await getReadingHistoryForReview(session.userId, review.id)
    : null;

  // QA List für SSR
  let qaInitialData = null;
  if (FEATURE_COMMUNITY_QA) {
    try {
      const qaList = await getQAList(review.id, undefined, 10, 'relevance', undefined, session?.userId ?? undefined);
      qaInitialData = {
        questions: qaList.questions,
        nextCursor: qaList.nextCursor,
        totalCount: qaList.totalCount,
      };
    } catch (error) {
      console.warn('[Review Detail] Failed to fetch QA list:', error);
    }
  }

  const seriesInfo = FEATURE_REVIEW_SERIES && review.seriesId
    ? await getReviewSeriesInfo(review.id)
    : null;

  // Hardware Compatibility Check (Server-side for SSR)
  let hardwareCompatibility = null;
  if (FEATURE_HARDWARE_COMPATIBILITY && review.category === 'hardware' && session?.userId) {
    try {
      const user = await prisma.twitchUser.findUnique({
        where: { id: session.userId },
        select: { hardwareProfile: true, hardwareProfileEnabled: true },
      });
      
      if (user?.hardwareProfile && user.hardwareProfileEnabled) {
        const hwProfile = user.hardwareProfile as { cpu: string; gpu: string; ram: string; monitor?: string; psu?: string; resolution?: string; refreshRate?: number };
        hardwareCompatibility = checkCompatibility(hwProfile, review);
        // Add FPS estimates for GPU reviews
        const fpsEstimates = estimateFps(hwProfile, review);
        hardwareCompatibility = { ...hardwareCompatibility, fpsEstimates };
      }
    } catch (error) {
      console.warn('[Review Detail] Failed to compute hardware compatibility:', error);
    }
  }

  // Fetch template if review has one
  let template = null;
  if (FEATURE_REVIEW_TEMPLATES && review.templateId) {
    try {
      template = await getTemplate(review.templateId);
    } catch (error) {
      console.warn('[Review Detail] Failed to fetch template:', error);
    }
  }

  const [userRating, isBookmarked, categoryAvg] = await Promise.all([
    session
      ? prisma.userRating.findUnique({
          where: { userId_reviewId: { userId: session.userId, reviewId: review.id } },
        })
      : null,
    session
      ? prisma.bookmark.findUnique({
          where: { userId_reviewId: { userId: session.userId, reviewId: review.id } },
        })
      : null,
    prisma.review.findMany({
      where: { category: review.category, status: "published", id: { not: review.id } },
      select: { score: true },
    }).then((r) => {
      if (r.length === 0) return null;
      return Math.round(r.reduce((a, b) => a + b.score, 0) / r.length);
    }),
  ]);

  const title = isEn && review.title_en ? review.title_en : review.title;
  const content = isEn && review.content_en ? review.content_en : review.content;
  const pros = isEn && review.pros_en.length > 0 ? review.pros_en : review.pros;
  const cons = isEn && review.cons_en.length > 0 ? review.cons_en : review.cons;

  const tags = (review.tags as { tag: { name: string } }[] | null)
    ?.map((t) => t.tag.name)
    .filter(Boolean) ?? [];

  const categoryLabel = getCategoryStyle(review.category).label;

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

  const wordCount = (content || "").split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const jsonLd = template && review.templateData && FEATURE_REVIEW_TEMPLATES
    ? buildSchemaOrgReview(
        { ...review, title, author: { displayName: "Redaktion", id: review.id }, id: review.id, slug: review.slug, templateData: review.templateData as Record<string, string> },
        template
      )
    : generateReviewSchema({ ...review, title, content });

  const siteUrl = getSiteUrl();
  const canonicalUrl = `${siteUrl}/reviews/${slug}`;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: isEn ? "Home" : "Startseite", url: siteUrl },
    { name: "Reviews", url: `${siteUrl}/reviews` },
    { name: title, url: canonicalUrl },
  ]);
  const faqs = buildFaqs(review, isEn);
  const faqSchema = generateFAQSchema(faqs);

  const specs = review.specs as Record<string, Record<string, string | undefined> | null>;

  // Extract headings from markdown content to generate table of contents
  function extractHeadings(markdown: string): Array<{ level: number; text: string; id: string }> {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: Array<{ level: number; text: string; id: string }> = [];
    let match;
    let firstH1Found = false;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      let text = match[2].trim();

      text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

      const explicitIdMatch = text.match(/\s*\{#([^}]+)\}\s*$/);
      let id: string;

      if (explicitIdMatch) {
        id = explicitIdMatch[1];
        text = text.replace(/\s*\{#[^}]+\}\s*$/, '').trim();
      } else {
        id = text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .trim();
      }

      if (level === 1 && !firstH1Found) {
        firstH1Found = true;
        continue;
      }

      const tocHeadingText = isEn ? "Table of Contents" : "Inhaltsverzeichnis";
      if (text.toLowerCase() === tocHeadingText.toLowerCase()) continue;

      headings.push({ level, text, id });
    }

    return headings;
  }

  const headings = extractHeadings(content || "");
  const hasTableOfContents = headings.length > 0;

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
    return (tree: MdastNode) => {
      walk(tree);
    };
  }

  const MarkdownComponents = {
    spoiler: ({ children }: { children?: React.ReactNode }) => (
      <SpoilerSection isEn={isEn}>{children}</SpoilerSection>
    ),
    p: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, React.ReactNode>) => {
      const content = (children ?? "").toString() || "";
      const match = content.match(/!\[\[IMAGE_(\d+)\]\]/);

      if (match) {
        const index = parseInt(match[1]);
        const imageUrl = review.images[index];

        if (imageUrl) {
          return (
            <figure className="my-12 relative aspect-video w-full overflow-hidden rounded-md group">
              <Image
                src={imageUrl}
                alt={`Screenshot ${index}`}
                fill
                className="object-cover"
                unoptimized
              />
              <figcaption className="mt-2 text-xs text-muted-foreground text-center">
                Abbildung {index + 1}
              </figcaption>
            </figure>
          );
        }
        return null;
      }
      return <p {...rest}>{children}</p>;
    },
    blockquote: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, React.ReactNode>) => (
      <blockquote
        className="my-6 pl-4 border-l-4 border-primary/30 bg-primary/5 rounded-r-md py-3 pr-4"
        {...rest}
      >
        {children}
      </blockquote>
    ),
    table: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, React.ReactNode>) => (
      <div className="my-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm" {...rest}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, React.ReactNode>) => (
      <th
        className="py-3 px-4 text-left font-semibold border-b-2 border-border bg-muted/50"
        {...rest}
      >
        {children}
      </th>
    ),
    td: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, React.ReactNode>) => (
      <td
        className="py-3 px-4 border-b border-border text-foreground/80"
        {...rest}
      >
        {children}
      </td>
    ),
    h2: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, React.ReactNode>) => (
      <h2
        className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mt-12 mb-6 scroll-mt-24"
        {...rest}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, React.ReactNode>) => (
      <h3
        className="font-serif text-xl md:text-2xl font-semibold tracking-tight mt-10 mb-4 scroll-mt-24"
        {...rest}
      >
        {children}
      </h3>
    ),
  };

  return (
    <article className="max-w-5xl mx-auto space-y-10 pb-12">
      <ReadingProgressBar />
      <ScrollToTop />
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

      <Link
        href="/reviews"
        className="group -mt-1 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
        {isEn ? "Back to all reviews" : "Zurück zu allen Reviews"}
      </Link>

      {/* Header Section */}
      <header className="border-b border-border pb-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-4 flex-1">
            <MetaLine
              date={review.createdAt}
              category={categoryLabel}
              readingTime={readingTime}
            />

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] max-w-4xl">
              {title}
            </h1>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Release & Updated */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {review.releaseDate && (
                <span>
                  Veröffentlicht: {format(new Date(review.releaseDate), "dd. MMMM yyyy", { locale: de })}
                </span>
              )}
              <span>
                Aktualisiert: {format(new Date(review.updatedAt), "dd. MMMM yyyy", { locale: de })}
              </span>
            </div>

            <div className="pt-1">
              <ReviewActions
                title={title}
                url={`/reviews/${slug}`}
                slug={slug}
                reviewId={review.id}
                isLoggedIn={!!session}
                initialBookmarked={!!isBookmarked}
                lang={isEn ? "en" : "de"}
              />
            </div>

            {/* Review Reactions */}
            <div className="pt-4">
              <ReviewReactions
                reviewId={review.id}
                initialData={reactions}
              />
            </div>

            {/* Reading History Badge */}
            {readingHistory && (
              <div className="pt-2">
                <ReadingHistoryBadge
                  initialData={readingHistory}
                  reviewId={review.id}
                  isEn={isEn}
                />
              </div>
            )}
          </div>

          <div className="flex items-center self-start lg:self-end gap-1 bg-muted rounded-md p-1 text-xs font-semibold uppercase tracking-widest border border-border shrink-0">
            <Link
              href={`/reviews/${slug}`}
              aria-label="Auf Deutsch anzeigen"
              className={`px-4 py-2 rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                !isEn
                  ? "bg-background text-foreground border border-border shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              DE
            </Link>
            <Link
              href={`/reviews/${slug}?lang=en`}
              aria-label="Auf Englisch anzeigen"
              className={`px-4 py-2 rounded-[4px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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

      {/* Series Badge */}
      {seriesInfo && FEATURE_REVIEW_SERIES && (
        <SeriesBadge seriesInfo={seriesInfo} />
      )}

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Category badge in hero */}
        <div className="absolute left-4 top-4 md:left-6 md:top-6">
          <span
            className="inline-flex items-center rounded-sm bg-black/55 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm"
          >
            {categoryLabel}
          </span>
        </div>

        {/* Score in hero */}
        <div className="absolute right-4 top-4 md:right-6 md:top-6 flex flex-col items-center gap-1.5 rounded-sm bg-black/55 px-3.5 py-3 backdrop-blur-sm">
          <ScoreBlock score={review.score} className="w-20 h-20 p-2" />
          <span
            className="text-[0.625rem] font-medium tracking-wider text-white/80"
            style={{ fontSize: "0.5625rem" }}
          >
            {review.score >= 90
              ? isEn ? "Phenomenal" : "Phänomenal"
              : review.score >= 80
                ? isEn ? "Excellent" : "Hervorragend"
                : review.score >= 70
                  ? isEn ? "Good" : "Gut"
                  : isEn ? "Satisfactory" : "Befriedigend"}
          </span>
        </div>

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/40 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/80">
              {readingTime} Min. Lesezeit
            </span>
            {tags.length > 0 && (
              <>
                <span className="text-white/30">·</span>
                <span className="text-xs text-white/80">{tags.length} Tags</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* At a Glance / Auf einen Blick */}
      <section
        aria-label={isEn ? "At a glance" : "Auf einen Blick"}
        className="rounded-md border border-border bg-card"
      >
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Score Column */}
            <div className="flex flex-col items-center gap-3 md:items-center md:border-r md:border-border md:pr-8 md:min-w-[160px]">
              <ScoreBlock score={review.score} className="w-24 h-24" />
              <div className="text-center">
                <p className="text-xs font-medium tracking-wider text-muted-foreground">
                  {review.score >= 90
                    ? isEn ? "Phenomenal" : "Phänomenal"
                    : review.score >= 80
                      ? isEn ? "Excellent" : "Hervorragend"
                      : review.score >= 70
                        ? isEn ? "Good" : "Gut"
                        : isEn ? "Satisfactory" : "Befriedigend"}
                </p>
              </div>
            </div>

            {/* Verdict Column */}
            <div className="flex-1 space-y-5">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                  {isEn ? "The Verdict" : "Das Urteil"}
                </h2>
                <p className="text-foreground/90 leading-relaxed text-lg">
                  {isEn
                    ? `${title} is ${verdictPhrase} and receives ${review.score} out of 100 points.`
                    : `${title} ist ${verdictPhrase} und erhält ${review.score} von 100 Punkten.`}
                </p>
              </div>

              {/* Score Band */}
              <div className="relative h-2 w-full rounded-full bg-muted/80 overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full"
                  style={{
                    width: `${review.score}%`,
                    backgroundColor: `var(--chart-${
                      review.score >= 90 ? 5
                        : review.score >= 75 ? 4
                        : review.score >= 50 ? 3
                        : review.score >= 25 ? 2
                        : 1
                    })`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[0.625rem] text-muted-foreground/60">
                <span>0</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100</span>
              </div>
              <ProsCons pros={pros} cons={cons} />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <MethodNote
              text={`Dieser Test basiert auf einem mehrtägigen Praxis-Test unter realen Bedingungen. Die Wertung erfolgt auf einer 100-Punkte-Skala, die sich aus Leistung, Design, Preis-Leistung und Funktionalität zusammensetzt. Alle Werte werden ohne Einfluss von Herstellern oder bezahlten Platzierungen ermittelt.`}
            />
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
          metadata={review.metadata as Record<string, unknown>}
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
          metadata={review.metadata as Record<string, unknown>}
          category="movie"
          isEn={isEn}
        />
      )}

      {/* Series Metadata Section */}
      {review.category === "series" && review.metadata && (
        <MovieSeriesMetadata
          metadata={review.metadata as Record<string, unknown>}
          category="series"
          isEn={isEn}
        />
      )}

      {/* Hardware Metadata Section */}
      {review.category === "hardware" && (
        <HardwareMetadata
          metadata={review.metadata as Record<string, unknown> | null}
          specs={review.specs as Record<string, unknown> | null}
          isEn={isEn}
        />
      )}

      {/* Hardware Compatibility Badge */}
      {review.category === "hardware" && FEATURE_HARDWARE_COMPATIBILITY && (
        <HardwareCompatibilityBadge
          data={hardwareCompatibility}
          reviewSlug={slug}
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

          {/* Template Renderer - for reviews with structured templates */}
          {template && review.templateData && FEATURE_REVIEW_TEMPLATES && (
            <ReviewTemplateRenderer
              template={template}
              templateData={review.templateData as Record<string, string>}
              review={{
                title: review.title,
                slug: review.slug,
                score: review.score,
                category: review.category,
                author: { displayName: "Redaktion" },
                createdAt: review.createdAt,
                images: review.images,
              }}
              variant="sections"
            />
          )}

          {/* Reading History Tracker - wraps main content for scroll/dwell tracking */}
          {!template && (
            <ReadingHistoryTrackerWrapper
              reviewId={review.id}
              featureEnabled={FEATURE_READING_HISTORY}
            >
              <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed prose-headings:scroll-mt-24 prose-headings:font-serif prose-headings:tracking-tight prose-headings:font-semibold" data-reading-content>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, spoilerPlugin]}
                  rehypePlugins={[[rehypeSlugCustomId, { enableCustomId: true }]]}
                  components={MarkdownComponents as Record<string, React.ComponentType<Record<string, unknown>>>}
                >
                  {content || ""}
                </ReactMarkdown>
              </div>
            </ReadingHistoryTrackerWrapper>
          )}

          {/* Hardware Requirements */}
          {review.category === "game" && specs && (
            <div className="space-y-6 pt-10 border-t border-border">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
                {isEn ? "System Requirements" : "Systemanforderungen"}
              </h2>

              {["minimum", "recommended"].map((type) => (
                <div key={type} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    {isEn ? (type === "minimum" ? "Minimum" : "Recommended") : (type === "minimum" ? "Minimum" : "Empfohlen")}
                  </h3>
                  <SpecTable
                    specs={[
                      { label: "OS", value: specs[type]?.os ?? "N/A" },
                      { label: "CPU", value: specs[type]?.cpu ?? "N/A" },
                      { label: "RAM", value: specs[type]?.ram ?? "N/A" },
                      { label: "GPU", value: specs[type]?.gpu ?? "N/A" },
                      { label: "Storage", value: specs[type]?.storage ?? "N/A" },
                    ]}
                  />
                </div>
              ))}
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

          {/* Review Recommendations */}
          <ReviewRecommendations reviewSlug={review.slug} limit={5} />

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

          {/* Quellen */}
          {review.images?.[0] || review.metadata && (
            <section className="space-y-4 pt-10 border-t border-border">
              <h3 className="font-serif text-xl font-semibold tracking-tight">
                {isEn ? "Sources" : "Quellen"}
              </h3>
              <SourceList
                sources={[
                  { name: "IGDB", url: "https://www.igdb.com" },
                  { name: "TMDB", url: "https://www.themoviedb.org" },
                  { name: "Steam", url: "https://store.steampowered.com" },
                  { name: "Twitch", url: "https://www.twitch.tv" },
                ].filter((s) => {
                  if (review.category === "game") return true;
                  if (review.category === "movie" || review.category === "series")
                    return s.name !== "IGDB";
                  return true;
                })}
              />
            </section>
          )}

          {/* Community Q&A */}
          {FEATURE_COMMUNITY_QA && qaInitialData && (
            <div className="pt-10 border-t border-border">
              <QAList reviewSlug={review.slug} initialData={qaInitialData} />
            </div>
          )}

          {/* Comment Section */}
          <CommentSection reviewId={review.id} initialComments={review.comments} />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Score Card */}
          <div className="p-6 rounded-md border border-border bg-card flex flex-col items-center text-center space-y-5 sticky top-24">
            <h3 className="font-serif text-xl font-semibold tracking-tight">
              {isEn ? "Nerdiction Score" : "Nerdiction Wertung"}
            </h3>
            <ScoreBlock score={review.score} className="w-28 h-28" />
            <p className="text-xs font-medium tracking-wider text-muted-foreground">
              {review.score >= 90
                ? isEn ? "Phenomenal" : "Phänomenal"
                : review.score >= 80
                  ? isEn ? "Excellent" : "Hervorragend"
                  : review.score >= 70
                    ? isEn ? "Good" : "Gut"
                    : isEn ? "Satisfactory" : "Befriedigend"}
            </p>

            <div className="w-full space-y-5">
              <RatingBreakdown
                scores={[
                  { label: "Leistung", value: Math.min(100, Math.max(0, review.score + 3)) },
                  { label: "Design", value: Math.min(100, Math.max(0, review.score - 2)) },
                  { label: "Preis-Leistung", value: Math.min(100, Math.max(0, review.score - 5)) },
                  { label: "Funktionalität", value: Math.min(100, Math.max(0, review.score + 1)) },
                ]}
              />
              <ScoreCompare
                reviewScore={review.score}
                categoryAverage={categoryAvg}
                categoryLabel={categoryLabel}
              />
            </div>
          </div>

          {/* Publication Info */}
          <div className="p-4 rounded-md border border-border bg-card space-y-3">
            <h4 className="kicker text-xs">Veröffentlichung</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kategorie</span>
                <span className="text-foreground">{categoryLabel}</span>
              </div>
              {review.releaseDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Erscheinungsdatum</span>
                  <span className="text-foreground">
                    {format(new Date(review.releaseDate), "dd.MM.yyyy", { locale: de })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Veröffentlicht am</span>
                <span className="text-foreground">
                  {format(new Date(review.createdAt), "dd.MM.yyyy", { locale: de })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Letzte Aktualisierung</span>
                <span className="text-foreground">
                  {format(new Date(review.updatedAt), "dd.MM.yyyy", { locale: de })}
                </span>
              </div>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="p-4 rounded-md border border-border bg-card space-y-3">
              <h4 className="kicker text-xs">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Preis & Angebote */}
          <DealsWidget deals={deals} priceHistory={priceHistory} />

          <UserRatingSection
            reviewId={review.id}
            userRatingAvg={review.userRatingAvg}
            userRatingCount={review.userRatingCount}
            isLoggedIn={!!session}
            initialUserRating={userRating ? { score: userRating.score, text: userRating.text } : null}
          />
        </aside>
      </div>
    </article>
  );
}
