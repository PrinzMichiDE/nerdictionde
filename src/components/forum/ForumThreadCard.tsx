import Link from "next/link";
import { MessageSquare, Eye, Clock, Gamepad2, Film, Tv } from "lucide-react";

const categoryConfig = {
  gaming: { label: "Gaming", icon: Gamepad2, color: "text-purple-500 dark:text-purple-400" },
  movies: { label: "Filme", icon: Film, color: "text-amber-500 dark:text-amber-400" },
  series: { label: "Serien", icon: Tv, color: "text-sky-500 dark:text-sky-400" },
} as const;

interface ForumThreadCardProps {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  author: string;
  commentCount: number;
  viewCount: number;
  lastActivityAt: string | Date;
}

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

export function ForumThreadCard({
  title,
  slug,
  category,
  excerpt,
  author,
  commentCount,
  viewCount,
  lastActivityAt,
}: ForumThreadCardProps) {
  const config = categoryConfig[category as keyof typeof categoryConfig] ?? categoryConfig.gaming;
  const Icon = config.icon;

  return (
    <Link
      href={`/forum/${slug}`}
      className="group block border border-border rounded-md p-5 bg-card hover:border-muted-foreground/30 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider ${config.color}`}>
              <Icon className="size-3.5" />
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">von {author}</span>
          </div>

          <h3 className="font-serif text-lg font-semibold tracking-tight group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {excerpt}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              {commentCount} {commentCount === 1 ? "Antwort" : "Antworten"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" />
              {viewCount}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {timeAgo(lastActivityAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
