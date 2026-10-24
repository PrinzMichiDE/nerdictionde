"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, User, List, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CollectionCardProps {
  slug: string;
  title: string;
  description: string | null;
  itemCount: number;
  updatedAt: string | Date;
  owner: {
    id: string;
    username: string;
    displayName: string;
    profileImageUrl: string | null;
  };
  className?: string;
}

export function CollectionCard({
  slug,
  title,
  description,
  itemCount,
  updatedAt,
  owner,
  className,
}: CollectionCardProps) {
  const updated = new Date(updatedAt);
  const updatedAgo = formatDistanceToNow(updated, { addSuffix: true, locale: de });

  return (
    <article className={cn("group relative p-4 rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/50", className)}>
      <Link href={`/listen/${slug}`} className="block">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <List className="h-3.5 w-3.5" />
            {itemCount} Review{itemCount !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            aktualisiert {updatedAgo}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          <Link
            href={`/u/${owner.username}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {owner.profileImageUrl ? (
              <Image
                src={owner.profileImageUrl}
                alt=""
                width={24}
                height={24}
                className="rounded-full"
                sizes="24px"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <span className="font-medium truncate max-w-[120px]">{owner.displayName}</span>
          </Link>
          <span className="flex-1" />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5 opacity-50" />
            Liste ansehen
          </span>
        </div>
      </Link>
    </article>
  );
}