import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";
import { ForumCommentSection } from "@/components/forum/ForumCommentSection";
import { ArrowLeft, MessageSquare, Eye, Clock, Gamepad2, Film, Tv } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { MetaLine } from "@/components/shared/MetaLine";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  try {
    const { slug } = await params;
    const thread = await prisma.forumThread.findUnique({ where: { slug } });
    if (!thread) return {};

    const url = `${getSiteUrl()}/forum/${slug}`;
    return {
      title: `${thread.title} - Nerdiction Forum`,
      description: thread.excerpt,
      alternates: { canonical: url },
      openGraph: {
        type: "article",
        title: thread.title,
        description: thread.excerpt,
        url,
        siteName: "Nerdiction",
        locale: "de_DE",
      },
    };
  } catch {
    return {};
  }
}

const categoryConfig = {
  gaming: { label: "Gaming", icon: Gamepad2, color: "var(--chart-1)" },
  movies: { label: "Filme", icon: Film, color: "var(--chart-3)" },
  series: { label: "Serien", icon: Tv, color: "var(--chart-5)" },
} as const;

function timeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "Gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  if (diffH < 24) return `vor ${diffH} Std.`;
  if (diffD < 30) return `vor ${diffD} Tagen`;
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });
}

function ThreadContent({ content }: { content: string }) {
  return (
    <div className="space-y-4 text-foreground/90 leading-relaxed">
      {content.split("\n").map((block, i) => {
        if (!block.trim()) return <br key={i} />;

        // Code block
        if (block.startsWith("```")) {
          const codeLines = content
            .split("\n")
            .filter((l) => l.trim() !== "")
            .slice(i + 1);
          const endIdx = codeLines.findIndex((l) => l.trim().startsWith("```"));
          const codeContent =
            endIdx >= 0 ? codeLines.slice(0, endIdx).join("\n") : codeLines.join("\n");

          return (
            <pre
              key={i}
              className="rounded-sm bg-muted/80 p-4 overflow-x-auto text-sm border border-border"
            >
              <code className="text-foreground/85">{codeContent}</code>
            </pre>
          );
        }

        // Heading
        if (block.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="font-serif text-xl font-semibold tracking-tight mt-8 mb-3 scroll-mt-24"
            >
              {block.slice(4)}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2
              key={i}
              className="font-serif text-2xl md:text-3xl font-semibold tracking-tight mt-10 mb-4 scroll-mt-24"
            >
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("# ")) {
          return (
            <h1
              key={i}
              className="font-serif text-3xl font-semibold tracking-tight mt-10 mb-6"
            >
              {block.slice(2)}
            </h1>
          );
        }

        // Blockquote
        if (block.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="pl-4 border-l-4 border-primary/30 bg-primary/5 rounded-r-md py-3 pr-4 text-foreground/80"
            >
              {block.slice(2)}
            </blockquote>
          );
        }

        // Unordered list
        if (block.startsWith("- ")) {
          const items = content
            .split("\n")
            .slice(i)
            .map((l) => l.replace(/^- \*?/, ""))
            .filter((l) => l.trim().startsWith("- ") || l.trim() === "")
            .map((l) => (l.trim() ? l.replace(/^- \*?/, "").trim() : ""))
            .filter((l) => l !== "");
          return (
            <ul key={i} className="list-disc pl-6 space-y-1.5">
              {items.map((item, j) => (
                <li key={j} className="text-sm leading-relaxed">{item}</li>
              ))}
            </ul>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(block)) {
          const items = content
            .split("\n")
            .slice(i)
            .filter((l) => /^\d+\.\s/.test(l))
            .map((l) => l.replace(/^\d+\.\s/, ""));
          return (
            <ol key={i} className="list-decimal pl-6 space-y-1.5">
              {items.map((item, j) => (
                <li key={j} className="text-sm leading-relaxed">{item}</li>
              ))}
            </ol>
          );
        }

        // Regular paragraph with inline formatting
        let text = block;

        // Bold
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        // Links
        text = text.replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" class="text-primary hover:underline transition-colors" target="_blank" rel="noopener">$1</a>'
        );

        return (
          <p key={i} className="text-base leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: text }} />
          </p>
        );
      })}
    </div>
  );
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let thread;
  try {
    thread = await prisma.forumThread.findUnique({
      where: { slug },
      include: {
        review: {
          select: {
            id: true,
            title: true,
            slug: true,
            score: true,
            category: true,
            images: true,
          },
        },
        comments: {
          where: { status: "approved" },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            text: true,
            author: true,
            userId: true,
            isAiGenerated: true,
            score: true,
            createdAt: true,
          },
        },
      },
    });
  } catch {
    notFound();
  }

  if (!thread) notFound();

  try {
    await prisma.forumThread.update({
      where: { id: thread.id },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    // ignore view count error
  }

  const config =
    categoryConfig[thread.category as keyof typeof categoryConfig] ??
    categoryConfig.gaming;

  let isLoggedIn = false;
  let displayName: string | null = null;

  const session = await getServerSession();
  if (session) {
    isLoggedIn = true;
    displayName = session.username;
  }

  // Fetch similar threads (same category, different thread)
  let similarThreads: Array<{ id: string; title: string; slug: string; excerpt: string }> =
    [];
  try {
    similarThreads = await prisma.forumThread.findMany({
      where: {
        category: thread.category,
        NOT: { id: thread.id },
      },
      orderBy: { score: "desc" },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
      },
    });
  } catch {
    // similar threads are non-critical
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="-mb-2">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Startseite
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/forum" className="hover:text-primary transition-colors">
                  Forum
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground/80 line-clamp-1">{thread.title}</li>
            </ol>
          </nav>

          <Link
            href="/forum"
            className="group -mt-1 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Zurück zum Forum
          </Link>

          {/* Thread Header */}
          <header className="border-b border-border pb-6 space-y-4">
            <MetaLine
              category={config.label}
              date={thread.createdAt}
              author={thread.author}
            />

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight">
              {thread.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="size-4" />
                {thread.commentCount} Antworten
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-4" />
                {thread.viewCount + 1} Aufrufe
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {timeAgo(thread.lastActivityAt)}
              </span>
            </div>
          </header>

          {/* Linked Review */}
          {thread.review && (
            <Link
              href={`/reviews/${thread.review.slug}`}
              className="group block border border-border rounded-sm p-4 bg-card hover:border-muted-foreground/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="kicker">Verknüpfte Review</span>
              </div>
              <div className="flex items-center gap-3">
                {thread.review.images?.[0] && (
                  <div className="relative w-16 h-10 rounded-sm overflow-hidden bg-muted shrink-0">
                  <Image
                    src={thread.review.images[0]}
                    alt={thread.review.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-sm font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {thread.review.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Score: {thread.review.score}/100
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Thread Content */}
          <div className="py-8 border-b border-border">
            <ThreadContent content={thread.content} />
          </div>

          {/* Comments */}
          <ForumCommentSection
            threadId={thread.id}
            initialComments={thread.comments.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
            }))}
            isLoggedIn={isLoggedIn}
            displayName={displayName}
          />
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-6">
          {/* Thread Stats */}
          <div className="p-4 rounded-sm border border-border bg-card space-y-3">
            <h4 className="kicker text-xs">Thread-Statistik</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Autor</span>
                <span className="text-foreground font-medium">{thread.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Erstellt</span>
                <span className="text-foreground">
                  {thread.createdAt.toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Antworten</span>
                <span className="text-foreground font-medium">{thread.commentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aufrufe</span>
                <span className="text-foreground font-medium">{thread.viewCount + 1}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Letzte Aktivität</span>
                <span className="text-foreground">{timeAgo(thread.lastActivityAt)}</span>
              </div>
            </div>
          </div>

          {/* Similar Threads */}
          {similarThreads.length > 0 && (
            <div className="p-4 rounded-sm border border-border bg-card space-y-3">
              <h4 className="kicker text-xs">Ähnliche Threads</h4>
              <div className="space-y-2">
                {similarThreads.map((st) => (
                  <Link
                    key={st.id}
                    href={`/forum/${st.slug}`}
                    className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-1.5 -m-1.5"
                  >
                    <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {st.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {st.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
