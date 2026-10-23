import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlugCustomId from "rehype-slug-custom-id";
import { ArrowLeft, Tag } from "lucide-react";
import { getSiteUrl, generateArticleSchema } from "@/lib/seo";
import { MetaLine } from "@/components/shared/MetaLine";

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

  const article = await prisma.newsArticle.findUnique({ where: { slug } });
  if (!article) return {};

  const title = isEn && article.title_en ? article.title_en : article.title;
  const excerpt = isEn && article.excerpt_en ? article.excerpt_en : article.excerpt;
  const url = `${getSiteUrl()}/news/${slug}`;

  return {
    title,
    description: excerpt || undefined,
    alternates: {
      canonical: url,
      languages: {
        "de-DE": url,
        en: `${url}?lang=en`,
        "x-default": url,
      },
    },
    keywords: article.tags,
    openGraph: {
      type: "article",
      title,
      description: excerpt || undefined,
      url,
      siteName: "Nerdiction",
      locale: "de_DE",
      publishedTime: article.publishedAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: excerpt || undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function NewsDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const isEn = lang === "en";

  const article = await prisma.newsArticle.findUnique({ where: { slug } });
  if (!article) notFound();

  const title = isEn && article.title_en ? article.title_en : article.title;
  const content = isEn && article.content_en ? article.content_en : article.content;
  const excerpt = isEn && article.excerpt_en ? article.excerpt_en : article.excerpt;

  const articleSchema = generateArticleSchema({
    headline: title,
    description: excerpt || title,
    url: `${getSiteUrl()}/news/${slug}`,
    datePublished: article.publishedAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <Link
        href="/news"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück zur Übersicht
      </Link>

      <header className="space-y-4">
        <MetaLine
          category={article.category}
          date={article.publishedAt}
          readingTime={Math.max(1, Math.ceil((article.content || "").split(/\s+/).length / 200))}
        />

        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight">
          {title}
        </h1>

        {excerpt && (
          <p className="text-muted-foreground text-lg leading-relaxed">{excerpt}</p>
        )}

        <div className="flex items-center gap-2">
          <Link
            href={`/news/${slug}`}
            className="text-xs font-medium px-2.5 py-1 rounded-md border"
            data-active={!isEn}
          >
            DE
          </Link>
          <Link
            href={`/news/${slug}?lang=en`}
            className="text-xs font-medium px-2.5 py-1 rounded-md border"
            data-active={isEn}
          >
            EN
          </Link>
        </div>
      </header>

      <article className="prose prose-neutral dark:prose-invert max-w-none news-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[[rehypeSlugCustomId, { enableCustomId: true }]]}
        >
          {content}
        </ReactMarkdown>
      </article>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {article.tags.map((tag) => (
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
