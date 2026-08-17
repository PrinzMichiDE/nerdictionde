import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo";
import { ForumCommentSection } from "@/components/forum/ForumCommentSection";
import { ArrowLeft, MessageSquare, Eye, Clock, Gamepad2, Film, Tv } from "lucide-react";
import { cookies } from "next/headers";

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
  gaming: { label: "Gaming", icon: Gamepad2, color: "text-purple-500 dark:text-purple-400" },
  movies: { label: "Filme", icon: Film, color: "text-amber-500 dark:text-amber-400" },
  series: { label: "Serien", icon: Tv, color: "text-sky-500 dark:text-sky-400" },
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

  const config = categoryConfig[thread.category as keyof typeof categoryConfig] ?? categoryConfig.gaming;
  const Icon = config.icon;

  let isLoggedIn = false;
  let displayName: string | null = null;

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("twitch_session")?.value;
    if (sessionToken) {
      const { jwtVerify } = await import("jose");
      const JWT_SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || "your-secret-key-change-in-production-min-32-chars"
      );
      const payload = (await jwtVerify(sessionToken, JWT_SECRET)).payload as unknown as { username?: string };
      isLoggedIn = true;
      displayName = payload.username ?? null;
    }
  } catch {
    // not logged in
  }

  const formattedDate = thread.createdAt.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="max-w-3xl mx-auto space-y-8 pb-12">
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${config.color}`}>
            <Icon className="size-3.5" />
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            Erstellt von {thread.author}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>

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
          className="block border border-border rounded-md p-4 bg-card hover:border-muted-foreground/30 transition-all"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="kicker text-primary">Verknüpfte Review</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h3 className="font-serif text-base font-semibold tracking-tight">
                {thread.review.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Score: {thread.review.score}/100
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Thread Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed prose-headings:scroll-mt-24 prose-headings:font-serif prose-headings:tracking-tight prose-headings:font-semibold">
        {thread.content.split("\n").map((paragraph, i) => {
          if (paragraph.trim() === "") return <br key={i} />;
          return <p key={i}>{paragraph}</p>;
        })}
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
    </article>
  );
}
