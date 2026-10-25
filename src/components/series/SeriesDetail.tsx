"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PublicSeriesWithParts, PublicSeriesPart } from "@/lib/review-series-schema";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { UserPlus, UserCheck, Loader2, Lock, User, Edit2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface SeriesDetailProps {
  series: PublicSeriesWithParts & {
    ownerId?: string | null;
    ownerUsername?: string | null;
    ownerDisplayName?: string | null;
    type?: "ADMIN" | "USER";
    visibility?: "PUBLIC" | "PRIVATE";
    isFollowing?: boolean;
    isOwner?: boolean;
    isCollaborator?: boolean;
    collaboratorRole?: "OWNER" | "EDITOR" | null;
  };
}

export function SeriesDetail({ series }: SeriesDetailProps) {
  const [activeTab, setActiveTab] = useState<"all" | "reviews">("all");
  const isUserSeries = series.type === "USER";

  const filteredParts = series.parts.filter((part) => {
    if (activeTab === "all") return true;
    return true;
  });

  // Follow button state for user series
  const [following, setFollowing] = useState(series.isFollowing ?? false);
  const [followerCount, setFollowerCount] = useState(series.followersCount ?? 0);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollowClick = async () => {
    if (followLoading || !isUserSeries) return;
    setFollowLoading(true);

    try {
      const response = await fetch(`/api/user/serien/${series.slug}/follow`, {
        method: following ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = `/login?redirect=/serien/${series.slug}`;
          return;
        }
        throw new Error(data.error || "Fehler beim Folgen");
      }

      setFollowing(!following);
      setFollowerCount(data.followersCount ?? (following ? followerCount - 1 : followerCount + 1));
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <article className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <header className="mb-8">
        {series.coverImage && (
          <div className="relative aspect-video w-full max-w-4xl mx-auto mb-6 rounded-xl overflow-hidden">
            <img
              src={series.coverImage}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="max-w-4xl mx-auto text-center mb-6">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {isUserSeries && series.ownerUsername && (
              <Link
                href={`/u/${series.ownerUsername}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="font-medium text-foreground">Von @{series.ownerUsername}</span>
              </Link>
            )}

            {series.visibility === "PRIVATE" && (
              <Badge variant="secondary" className="gap-1">
                <Lock className="w-3 h-3" aria-hidden="true" />
                Privat
              </Badge>
            )}

            {series.type === "ADMIN" && (
              <Badge variant="outline" className="gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Redaktion
              </Badge>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {series.title}
          </h1>

          {series.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              {series.description}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              {series.partCount} Teil{series.partCount !== 1 ? "e" : ""}
            </span>

            {series.aggregateScore !== null && (
              <span className={cn(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium text-sm",
                series.aggregateScore >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                series.aggregateScore >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              )}>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                Ø {series.aggregateScore}
              </span>
            )}

            {isUserSeries && followerCount > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary">
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                {followerCount} Follower
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Link
              href="/serien"
              className={cn(
                "inline-flex items-center gap-1 px-4 py-2 text-sm font-medium",
                "border rounded-lg hover:bg-accent transition-colors"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zur Übersicht
            </Link>

            {isUserSeries && (series.isOwner || series.isCollaborator) && (
              <Link
                href={`/serien/${series.slug}/bearbeiten`}
                className={cn(
                  "inline-flex items-center gap-1 px-4 py-2 text-sm font-medium",
                  "bg-primary text-primary-foreground rounded-lg",
                  "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "transition-colors"
                )}
              >
                <Edit2 className="w-4 h-4" aria-hidden="true" />
                Bearbeiten
              </Link>
            )}

            <ShareButtons
              contentType="series"
              contentId={series.id}
              title={series.title}
              description={series.description || undefined}
              url={`/serien/${series.slug}`}
              image={series.coverImage || undefined}
              variant="inline"
            />

            {isUserSeries && !series.isOwner && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleFollowClick}
                      disabled={followLoading}
                      variant={following ? "default" : "outline"}
                      size="sm"
                      className="gap-2 min-w-[120px] justify-center"
                    >
                      {followLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : following ? (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Folge ich
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          Folgen
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="center">
                    {following ? `Entfolge @${series.ownerUsername}` : `Folge @${series.ownerUsername}`}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </header>

      {/* Parts Navigation */}
      <nav aria-label="Serien-Teile" className="max-w-4xl mx-auto mb-8">
        <div role="tablist" className="border-b mb-6">
          <button
            role="tab"
            aria-selected={activeTab === "all"}
            aria-controls="panel-all"
            id="tab-all"
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-4 py-3 font-medium text-sm border-b-2 -mb-px transition-colors",
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Alle Teile ({series.partCount})
          </button>
          {/* Future: DLC-only, Review-only tabs */}
        </div>

        <div role="tabpanel" id="panel-all" aria-labelledby="tab-all">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredParts.map((part, index) => (
              <SeriesPartCard key={part.id} part={part} index={index + 1} total={series.partCount} />
            ))}
          </div>
        </div>
      </nav>

      {/* SEO: ItemList structured data is in metadata */}
    </article>
  );
}

interface SeriesPartCardProps {
  part: PublicSeriesPart;
  index: number;
  total: number;
}

function SeriesPartCard({ part, index, total }: SeriesPartCardProps) {
  return (
    <Link
      href={`/reviews/${part.slug}`}
      className={cn(
        "group flex flex-col h-full bg-card border rounded-xl overflow-hidden",
        "transition-shadow hover:shadow-lg"
      )}
    >
      {part.coverImage && (
        <div className="relative aspect-video overflow-hidden">
          <img
            src={part.coverImage}
            alt=""
            className={cn(
              "w-full h-full object-cover",
              "transition-transform duration-300 group-hover:scale-105"
            )}
            loading="lazy"
          />
          <div className="absolute top-2 left-2">
            <span className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
              "bg-primary/90 text-primary-foreground backdrop-blur-sm"
            )}>
              {index}
            </span>
          </div>
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        <h3 className={cn(
          "font-semibold text-lg mb-2 line-clamp-1",
          "group-hover:text-primary transition-colors"
        )}>
          {part.title}
        </h3>

        {part.category && (
          <span className={cn(
            "inline-block px-2 py-0.5 text-xs font-medium rounded mb-2",
            "bg-secondary text-secondary-foreground"
          )}>
            {part.category.charAt(0).toUpperCase() + part.category.slice(1)}
          </span>
        )}

        {part.releaseDate && (
          <time className="text-sm text-muted-foreground mb-2">
            {new Date(part.releaseDate).toLocaleDateString("de-DE", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}

        <div className="flex items-center gap-3 mb-3">
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium text-sm",
            part.score >= 80 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
            part.score >= 60 ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          )}>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {part.score}
          </span>

          <span className="text-sm text-muted-foreground">
            Teil {index} von {total}
          </span>
        </div>

        {part.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
            {part.excerpt}
          </p>
        )}

        <span className={cn(
          "mt-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium",
          "bg-primary text-primary-foreground rounded-lg",
          "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "transition-colors w-full"
        )}>
          Review lesen
        </span>
      </div>
    </Link>
  );
}