import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlugCustomId from "rehype-slug-custom-id";
import { ArrowLeft, Tag, Clock, BookOpen } from "lucide-react";
import { getSiteUrl, generateArticleSchema } from "@/lib/seo";
import { MetaLine } from "@/components/shared/MetaLine";
import { generateReviewMetadata } from "@/lib/share-meta";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { GUIDE_CATEGORY_LABELS } from "@/lib/guide-sources";

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

  const guide = await prisma.guide.findUnique({ where: { slug } });
  if (!guide) return {};

  const title = isEn && guide.title_en ? guide.title_en : guide.title;

  return generateReviewMetadata(
    {
      id: guide.id,
      slug: guide.slug,
      title: guide.title,
      title_en: guide.title_en,
      content: guide.content,
      category: "guide",
      images: guide.featuredImage ? [guide.featuredImage] : [],
      score: 0,
      author: undefined,
      createdAt: guide.publishedAt,
      updatedAt: guide.updatedAt,
      tags: guide.tags?.map((t) => ({ tag: { name: t } })) || [],
      youtubeVideos: [],
    },
    isEn ? "en" : "de"
  );
}

export default async function GuideDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const isEn = lang === "en";

  const guide = await prisma.guide.findUnique({ where: { slug } });
  if (!guide || guide.status !== "published") notFound();

  const title = isEn && guide.title_en ? guide.title_en : guide.title;
  const content = isEn && guide.content_en ? guide.content_en : guide.content;
  const excerpt = isEn && guide.excerpt_en ? guide.excerpt_en : guide.excerpt;

  const articleSchema = generateArticleSchema({
    headline: title,
    description: excerpt || title,
    url: `${getSiteUrl()}/community/guides/${slug}`,
    datePublished: guide.publishedAt.toISOString(),
    dateModified: guide.updatedAt.toISOString(),
  });

  const categoryLabel = GUIDE_CATEGORY_LABELS[guide.category as keyof typeof GUIDE_CATEGORY_LABELS] || guide.category;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Link
        href={guide.type === "wiki" ? "/community/wiki" : "/community/guides"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> 
        {guide.type === "wiki" ? "Zurück zum Wiki" : "Zurück zu Guides"}
      </Link>

      <header className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium">
            <BookOpen className="h-3.5 w-3.5" />
            {categoryLabel}
          </span>
          {guide.readingTime && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {guide.readingTime} Min. Lesezeit
            </span>
          )}
          {guide.difficulty && (
            <span className="capitalize">
              {guide.difficulty === "beginner" ? "Anfänger" : guide.difficulty === "intermediate" ? "Fortgeschritten" : "Experte"}
            </span>
          )}
        </div>

        <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
          {title}
        </h1>

        {excerpt && (
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">{excerpt}</p>
        )}

        <div className="flex items-center gap-2">
          <Link
            href={`/community/guides/${slug}`}
            className="text-xs font-medium px-2.5 py-1 rounded-md border"
            data-active={!isEn}
          >
            DE
          </Link>
          <Link
            href={`/community/guides/${slug}?lang=en`}
            className="text-xs font-medium px-2.5 py-1 rounded-md border"
            data-active={isEn}
          >
            EN
          </Link>
        </div>
      </header>

      {/* Teilen */}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
        <ShareButtons
          contentType="review"
          contentId={guide.id}
          title={title}
          description={excerpt || undefined}
          url={`/community/guides/${slug}`}
          variant="inline"
        />
      </div>

      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[[rehypeSlugCustomId, { enableCustomId: true }]]}
        >
          {content}
        </ReactMarkdown>
      </article>

      {guide.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {guide.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
