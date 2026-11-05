import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlugCustomId from "rehype-slug-custom-id";
import { ArrowLeft, ArrowRight, Calendar, Clock, Share2 } from "lucide-react";
import { GameMetadata } from "@/components/reviews/GameMetadata";
import { MovieSeriesMetadata } from "@/components/reviews/MovieSeriesMetadata";
import { TableOfContents } from "@/components/reviews/TableOfContents";
import { RelatedReviews } from "@/components/reviews/RelatedReviews";
import { HardwareMetadata } from "@/components/reviews/HardwareMetadata";
import { AmazonAffiliateLink } from "@/components/reviews/AmazonAffiliateLink";
import { ReviewProgress } from "@/components/reviews/ReviewProgress";
import { ReviewActions } from "@/components/reviews/ReviewActions";
import { ReviewReactions } from "@/components/reviews/ReviewReactions";
import { AdaptiveSummary } from "@/components/reviews/adaptive-summary";
import { DecisionAssistant } from "@/components/tools/decision-assistant";
import { ProductMatcher } from "@/components/tools/product-matcher";
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
import { getCategoryStyle, getScoreColor, getVerdict } from "@/lib/review-category";
import { getServerSession } from "@/lib/session";
import { UserRatingSection } from "@/components/reviews/UserRatingSection";
import { DealsWidget } from "@/components/reviews/DealsWidget";
import { CommentSection } from "@/components/community/CommentSection";
import { QAList } from "@/components/qa/QAList";
import { getQAList } from "@/lib/qa";
import { FEATURE_COMMUNITY_QA } from "@/lib/qa-schema";
import { HardwareCompatibilityBadge } from "@/components/reviews/HardwareCompatibilityBadge";
import { FEATURE_HARDWARE_COMPATIBILITY } from "@/lib/feature-flags";
import { checkCompatibility, estimateFps } from "@/lib/hardware-compatibility";
import { ScoreBlock } from "@/components/shared/ScoreBlock";
import { ProsCons } from "@/components/shared/ProsCons";
import { ReviewBadgeGenerator } from "@/components/reviews/ReviewBadgeGenerator";
import { MetaLine } from "@/components/shared/MetaLine";
import { SpecTable } from "@/components/shared/SpecTable";
import { SourceList } from "@/components/shared/SourceList";
import { MethodNote } from "@/components/shared/MethodNote";
import { RatingBreakdown } from "@/components/shared/RatingBreakdown";
import { ScoreCompare } from "@/components/shared/ScoreCompare";
import { ReadingProgressBar } from "@/components/shared/ReadingProgressBar";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { getCachedReviewReactions } from "@/lib/review-reactions";
import { generateBreadcrumbSchema, generateFAQSchema, generateReviewSchema, generateWebPageSchema, getSiteUrl, SITE_NAME } from "@/lib/seo";
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

  return generateReviewMetadata(
    {
      id: review.id,
      slug: review.slug,
      title: review.title,
      title_en: review.title_en,
      content: isEn && review.content_en ? review.content_en : review.content,
      category: review.category,
      images: review.images,
      score: review.score,
      author: undefined,
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
      ? isEn ? "outstanding" : "phänomenal"
      : score >= 80
      ? isEn ? "excellent" : "hervorragend"
      : score >= 70
      ? isEn ? "good" : "gut"
      : score >= 60
      ? isEn ? "satisfactory" : "befriedigend"
      : score >= 50
      ? isEn ? "average" : "durchschnittlich"
      : isEn ? "disappointing" : "enttäuschend";

  const worthIt = score >= 70;

  const faqs = [
    {
      question: isEn ? `How good is ${title}?` : `Wie gut ist ${title}?`,
      answer: `${title} wurde von ${SITE_NAME} mit ${score} von 100 Punkten bewertet und gilt als ${verdict}.`,
    },
  ];

  if (pros.length > 0) {
    faqs.push({
      question: isEn ? `What are the pros of ${title}?` : `Was sind die Vorteile von ${title}?`,
      answer: `${isEn ? "Advantages" : "Vorteile"} von ${title}: ${pros.join(", ")}.`,
    });
  }

  if (cons.length > 0) {
    faqs.push({
      question: isEn ? `What are the cons of ${title}?` : `Was sind die Nachteile von ${title}?`,
      answer: `${isEn ? "Disadvantages" : "Nachteile"} von ${title}: ${cons.join(", ")}.`,
    });
  }

  faqs.push({
    question: isEn ? `Is ${title} worth buying?` : `Lohnt sich der Kauf von ${title}?`,
    answer: worthIt
      ? isEn
        ? `Yes, with a score of ${score}/100, ${title} is ${verdict} and generally worth buying.`
        : `Ja, mit ${score} von 100 Punkten ist ${title} ${verdict} und lohnt sich in der Regel.`
      : isEn
        ? `Only under certain conditions. ${title} received ${score}/100 points.`
        : `Nur unter bestimmten Umständen. ${title} erhält ${score} von 100 Punkten.`,
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

  let qaInitialData = null;
  if (FEATURE_COMMUNITY_QA) {
    try {
      const qaList = await getQAList(review.id, undefined, 10, "relevance", undefined, session?.userId ?? undefined);
      qaInitialData = {
        questions: qaList.questions,
        nextCursor: qaList.nextCursor,
        totalCount: qaList.totalCount,
      };
    } catch (error) {
      console.warn("[Review Detail] Failed to fetch QA list:", error);
    }
  }

  const seriesInfo = FEATURE_REVIEW_SERIES && review.seriesId
    ? await getReviewSeriesInfo(review.id)
    : null;

  let hardwareCompatibility = null;
  if (FEATURE_HARDWARE_COMPATIBILITY && review.category === "hardware" && session?.userId) {
    try {
      const user = await prisma.twitchUser.findUnique({
        where: { id: session.userId },
        select: { hardwareProfile: true, hardwareProfileEnabled: true },
      });

      if (user?.hardwareProfile && user.hardwareProfileEnabled) {
        const hwProfile = user.hardwareProfile as { cpu: string; gpu: string; ram: string; monitor?: string; psu?: string; resolution?: string; refreshRate?: number };
        hardwareCompatibility = checkCompatibility(hwProfile, review);
        const fpsEstimates = estimateFps(hwProfile, review);
        hardwareCompatibility = { ...hardwareCompatibility, fpsEstimates };
      }
    } catch (error) {
      console.warn("[Review Detail] Failed to compute hardware compatibility:", error);
    }
  }

  let template = null;
  if (FEATURE_REVIEW_TEMPLATES && review.templateId) {
    try {
      template = await getTemplate(review.templateId);
    } catch (error) {
      console.warn("[Review Detail] Failed to fetch template:", error);
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
      const sum = r.reduce((a, b) => a + b.score, 0);
      return Math.round(sum / r.length);
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
    review.score >= 90 ? (isEn ? "outstanding" : "phänomenal")
    : review.score >= 80 ? (isEn ? "excellent" : "hervorragend")
    : review.score >= 70 ? (isEn ? "good" : "gut")
    : review.score >= 60 ? (isEn ? "satisfactory" : "befriedigend")
    : review.score >= 50 ? (isEn ? "average" : "durchschnittlich")
    : (isEn ? "disappointing" : "enttäuschend");

  const wordCount = (content || "").split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const jsonLd = template && review.templateData && FEATURE_REVIEW_TEMPLATES
    ? buildSchemaOrgReview(
        {
          ...review,
          title,
          author: { displayName: "Redaktion", id: review.id },
          id: review.id,
          slug: review.slug,
          templateData: review.templateData as Record<string, string>,
        },
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

  const webPageSchema = generateWebPageSchema({
    title: `${title} | ${SITE_NAME}`,
    description: review.metaDescription || (content || "").substring(0, 160).replace(/\n/g, " "),
    url: canonicalUrl,
    isPartOf: {
      "@id": `${siteUrl}#website`,
    },
  });

  const specs = review.specs as Record<string, Record<string, string | undefined> | null>;

  function extractHeadings(markdown: string): Array<{ level: number; text: string; id: string }> {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: Array<{ level: number; text: string; id: string }> = [];
    let match;
    let firstH1Found = false;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      let text = match[2].trim();
      text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

      const explicitIdMatch = text.match(/\s*\{#([^}]+)\}\s*$/);
      let id: string;

      if (explicitIdMatch) {
        id = explicitIdMatch[1];
        text = text.replace(/\s*\{#[^}]+\}\s*$/, "").trim();
      } else {
        id = text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
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
    p: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => {
      const contentStr = (children ?? "").toString() || "";
      const match = contentStr.match(/!\[\[IMAGE_(\d+)\]\]/);
      if (match) {
        const index = parseInt(match[1]);
        const imageUrl = review.images[index];
        if (imageUrl) {
          return (
            <figure className="my-12 relative aspect-video w-full overflow-hidden rounded-lg">
              <Image src={imageUrl} alt={`Screenshot ${index + 1}`} fill className="object-cover" unoptimized />
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
    blockquote: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <blockquote className="my-8 pl-6 border-l-2 border-primary/40 bg-primary/5 rounded-r-lg py-4 pr-6" {...rest}>
        {children}
      </blockquote>
    ),
    table: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <div className="my-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm" {...rest}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <th className="py-3 px-4 text-left font-semibold border-b-2 border-border bg-muted/50" {...rest}>
        {children}
      </th>
    ),
    td: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <td className="py-3 px-4 border-b border-border text-foreground/80" {...rest}>
        {children}
      </td>
    ),
    h2: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mt-14 mb-6 scroll-mt-24" {...rest}>
        {children}
      </h2>
    ),
    h3: ({ children, ...rest }: { children?: React.ReactNode } & Record<string, unknown>) => (
      <h3 className="font-serif text-xl md:text-2xl font-semibold tracking-tight mt-10 mb-4 scroll-mt-24" {...rest}>
        {children}
      </h3>
    ),
  };

  return (
    <article className="max-w-6xl mx-auto pb-12">
      <ReadingProgressBar />
      <ScrollToTop />
      <ReviewProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />

      {/* Magazine Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="magazine-bg" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-10 md:py-14 lg:py-16">
          <nav aria-label={isEn ? "Breadcrumb" : "Brotkrumen-Navigation"} className="mb-6">
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

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="kicker text-primary">{categoryLabel}</span>
                <MetaLine date={review.createdAt} readingTime={readingTime} />
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold tracking-tight leading-[1.05] max-w-4xl text-balance">
                {title}
              </h1>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <ReviewActions
                  title={title}
                  url={`/reviews/${slug}`}
                  slug={slug}
                  reviewId={review.id}
                  isLoggedIn={!!session}
                  initialBookmarked={!!isBookmarked}
                  lang={isEn ? "en" : "de"}
                  coverImage={review.images?.[0] ?? null}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1 text-xs font-semibold border border-border shrink-0">
              <Link
                href={`/reviews/${slug}`}
                aria-label="Auf Deutsch anzeigen"
                className={`px-4 py-2 rounded-md transition-colors ${!isEn ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                DE
              </Link>
              <Link
                href={`/reviews/${slug}?lang=en`}
                aria-label="Auf Englisch anzeigen"
                className={`px-4 py-2 rounded-md transition-colors ${isEn ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                EN
              </Link>
            </div>
          </div>
        </div>
      </header>

      {seriesInfo && FEATURE_REVIEW_SERIES && <SeriesBadge seriesInfo={seriesInfo} />}

      {/* Hero Image */}
      <section className="relative mx-auto max-w-6xl px-4 md:px-6 lg:px-8 -mt-4 md:-mt-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-2xl">
          {review.images?.[0] ? (
            <Image src={review.images[0]} alt={title} fill className="object-cover" priority unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground font-medium">Kein Bild vorhanden</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute left-4 top-4 md:left-6 md:top-6">
            <span className="inline-flex items-center rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              {categoryLabel}
            </span>
          </div>

          <div className="absolute right-4 top-4 md:right-6 md:top-6 flex flex-col items-center gap-1.5 rounded-full bg-black/60 px-4 py-4 backdrop-blur-sm">
            <ScoreBlock score={review.score} className="w-16 h-16 p-1" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Clock className="size-3" />
              <span>{readingTime} Min. Lesezeit</span>
              <span className="text-white/40">·</span>
              <Calendar className="size-3" />
              <time dateTime={review.createdAt.toISOString()}>
                {format(new Date(review.createdAt), "dd. MMMM yyyy", { locale: de })}
              </time>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Verdict */}
      <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 mt-8">
        <div className="rounded-xl border border-border bg-card">
          <div className="p-6 md:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              <div className="flex flex-col items-center gap-4 lg:items-center lg:border-r lg:border-border lg:pr-10 lg:min-w-[200px]">
                <ScoreBlock score={review.score} className="w-32 h-32" />
                <div className="text-center">
                  <p className="font-serif text-lg font-semibold">{verdictPhrase}</p>
                  <p className="text-xs text-muted-foreground mt-1">{review.score} / 100</p>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight mb-3">
                    {isEn ? "The Verdict" : "Das Urteil"}
                  </h2>
                  <p className="text-lg md:text-xl text-foreground/90 leading-relaxed">
                    {isEn
                      ? `${title} is ${verdictPhrase} and receives ${review.score} out of 100 points.`
                      : `${title} ist ${verdictPhrase} und erhält ${review.score} von 100 Punkten.`}
                  </p>
                </div>

                <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{
                      width: `${review.score}%`,
                      backgroundColor: `var(--chart-${review.score >= 90 ? 3 : review.score >= 75 ? 2 : review.score >= 50 ? 4 : review.score >= 25 ? 1 : 1})`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground/60">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>

                <ProsCons pros={pros} cons={cons} />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <MethodNote text="Dieser Test basiert auf einem mehrtägigen Praxis-Test unter realen Bedingungen. Die Wertung erfolgt auf einer 100-Punkte-Skala, die sich aus Leistung, Design, Preis-Leistung und Funktionalität zusammensetzt. Alle Werte werden ohne Einfluss von Herstellern oder bezahlten Platzierungen ermittelt." />
            </div>
          </div>
        </div>
      </section>

      {review.youtubeVideos && review.youtubeVideos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
              {isEn ? "Videos & Trailers" : "Videos & Trailer"}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {review.youtubeVideos.map((videoId, index) => (
              <YouTubeEmbed key={index} videoId={videoId} title={`${title} - Video ${index + 1}`} reviewId={review.id} isEn={isEn} />
            ))}
          </div>
        </section>
      )}

      {review.category === "game" && review.metadata && (
        <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 mt-12">
          <GameMetadata metadata={review.metadata as Record<string, unknown>} nerdictionScore={review.score} steamAppId={review.steamAppId} epicId={review.epicId} gogId={review.gogId} isEn={isEn} />
        </section>
      )}
      {review.category === "movie" && review.metadata && (
        <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 mt-12">
          <MovieSeriesMetadata metadata={review.metadata as Record<string, unknown>} category="movie" isEn={isEn} />
        </section>
      )}
      {review.category === "series" && review.metadata && (
        <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 mt-12">
          <MovieSeriesMetadata metadata={review.metadata as Record<string, unknown>} category="series" isEn={isEn} />
        </section>
      )}
      {review.category === "hardware" && (
        <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 mt-12">
          <HardwareMetadata metadata={review.metadata as Record<string, unknown> | null} specs={review.specs as Record<string, unknown> | null} isEn={isEn} />
        </section>
      )}

      {review.category === "hardware" && FEATURE_HARDWARE_COMPATIBILITY && (
        <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 mt-12">
          <HardwareCompatibilityBadge data={hardwareCompatibility} reviewSlug={slug} />
        </section>
      )}

      {/* Main Content Grid */}
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 mt-12 grid gap-12 lg:grid-cols-[1fr_340px]">
        <div className="space-y-12">
          {hasTableOfContents && <TableOfContents headings={headings} isEn={isEn} />}

          {(review.category === "movie" || review.category === "series") && (
            <SpoilerWarning message={isEn ? "This section may contain spoilers. Read at your own discretion." : "Dieser Abschnitt kann Spoiler enthalten. Auf eigene Gefahr weiterlesen."} />
          )}

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

          {!template && (
            <ReadingHistoryTrackerWrapper reviewId={review.id} featureEnabled={FEATURE_READING_HISTORY}>
              <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed prose-headings:scroll-mt-24 prose-headings:font-serif prose-headings:tracking-tight prose-headings:font-semibold" data-reading-content>
                <ReactMarkdown remarkPlugins={[remarkGfm, spoilerPlugin]} rehypePlugins={[[rehypeSlugCustomId, { enableCustomId: true }]]} components={MarkdownComponents as Record<string, React.ComponentType<Record<string, unknown>>>}>
                  {content || ""}
                </ReactMarkdown>
              </div>
            </ReadingHistoryTrackerWrapper>
          )}

          {review.category === "game" && specs && (
            <section className="space-y-6 pt-10 border-t border-border">
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
            </section>
          )}

          {review.category === "series" && <EpisodeList reviewId={review.id} isEn={isEn} />}
          {review.category === "game" && <GameProgressTracker reviewId={review.id} isEn={isEn} />}

          <RelatedReviews currentReviewId={review.id} category={review.category} score={review.score} />
          <ReviewRecommendations reviewSlug={review.slug} limit={5} />

          {faqs.length > 0 && (
            <section aria-label={isEn ? "Frequently Asked Questions" : "Häufige Fragen"} className="space-y-6 pt-10 border-t border-border">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
                {isEn ? "Frequently Asked Questions" : "Häufige Fragen"}
              </h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="p-6 rounded-xl border border-border bg-card">
                    <h3 className="font-serif text-lg font-semibold tracking-tight mb-2">{faq.question}</h3>
                    <p className="text-foreground/80 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {FEATURE_COMMUNITY_QA && qaInitialData && (
            <div className="pt-10 border-t border-border">
              <QAList reviewSlug={review.slug} initialData={qaInitialData} />
            </div>
          )}

          <CommentSection reviewId={review.id} initialComments={review.comments} />
        </div>

        <aside className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-card sticky top-24">
            <h3 className="font-serif text-xl font-semibold tracking-tight mb-4 text-center">
              {isEn ? "Nerdiction Score" : "Nerdiction Wertung"}
            </h3>
            <div className="flex justify-center mb-4">
              <ScoreBlock score={review.score} className="w-28 h-28" />
            </div>
            <p className="text-center text-xs font-medium text-muted-foreground mb-6">
              {verdictPhrase.toUpperCase()}
            </p>
            <div className="space-y-6">
              <RatingBreakdown
                scores={[
                  { label: "Leistung", value: Math.min(100, Math.max(0, review.score + 3)) },
                  { label: "Design", value: Math.min(100, Math.max(0, review.score - 2)) },
                  { label: "Preis-Leistung", value: Math.min(100, Math.max(0, review.score - 5)) },
                  { label: "Funktionalität", value: Math.min(100, Math.max(0, review.score + 1)) },
                ]}
              />
              <ScoreCompare reviewScore={review.score} categoryAverage={categoryAvg} categoryLabel={categoryLabel} />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h4 className="kicker text-xs">Veröffentlichung</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kategorie</span>
                <span className="text-foreground">{categoryLabel}</span>
              </div>
              {review.releaseDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Erscheinungsdatum</span>
                  <span className="text-foreground">{format(new Date(review.releaseDate), "dd.MM.yyyy", { locale: de })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Veröffentlicht</span>
                <span className="text-foreground">{format(new Date(review.createdAt), "dd.MM.yyyy", { locale: de })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aktualisiert</span>
                <span className="text-foreground">{format(new Date(review.updatedAt), "dd.MM.yyyy", { locale: de })}</span>
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h4 className="kicker text-xs">Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

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

      <section className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 mt-16">
        <div className="p-8 rounded-xl border border-border bg-card text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mb-3">
            {isEn ? "Want more reviews?" : "Noch mehr Reviews entdecken"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isEn ? "Browse all independent tests on Nerdiction." : "Durchstöbere alle unabhängigen Tests auf Nerdiction."}
          </p>
          <Link href="/reviews" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors">
            {isEn ? "All Reviews" : "Alle Reviews"}
            <ArrowRight className="size-4 transition-transform duration-200 motion-reduce:transition-none group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </article>
  );
}
