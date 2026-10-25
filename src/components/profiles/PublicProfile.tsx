"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Bookmark, Users, UserPlus, Gamepad2, Monitor, Film, Tv, List, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FollowButton } from "./FollowButton";
import { ProfileRatingsList } from "./ProfileRatingsList";
import { ProfileBookmarksList } from "./ProfileBookmarksList";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FEATURE_USER_SERIES } from "@/lib/feature-flags";
import type { PublicSeries } from "@/lib/review-series-schema";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GAMES: Gamepad2,
  HARDWARE: Monitor,
  MOVIES: Film,
  SERIES: Tv,
};

const CATEGORY_LABELS: Record<string, string> = {
  GAMES: 'Games',
  HARDWARE: 'Hardware',
  MOVIES: 'Movies',
  SERIES: 'Series',
};

const CATEGORY_HREFS: Record<string, string> = {
  GAMES: '/suche?category=GAMES',
  HARDWARE: '/suche?category=HARDWARE',
  MOVIES: '/suche?category=MOVIES',
  SERIES: '/suche?category=SERIES',
};

interface PublicProfileProps {
  profile: {
    user: {
      id: string;
      username: string;
      displayName: string;
      profileImageUrl: string | null;
      createdAt: Date;
      userProfile: {
        bio: string | null;
        isPublic: boolean;
        showRatings: boolean;
        showBookmarks: boolean;
        followerCount: number;
        followingCount: number;
      } | null;
    };
  };
  username: string;
  subscribedCategories?: string[];
}

// Helper function for score badge className
function getScoreBadgeClassName(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  if (score >= 60) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
}

// User Series Tab Component
function UserSeriesTab({ userId }: { userId: string }) {
  const [createdSeries, setCreatedSeries] = useState<PublicSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoading(true);
        const createdRes = await fetch(`/api/serien?ownerId=${userId}&type=USER&visibility=PUBLIC&limit=20`);

        if (!createdRes.ok) {
          throw new Error("Fehler beim Laden der Serien");
        }

        const createdData = await createdRes.json();
        setCreatedSeries(createdData.series || []);
      } catch {
        setError("Serien konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center border border-border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (createdSeries.length === 0) {
    return (
      <div className="py-12 text-center border border-border rounded-lg bg-muted/50">
        <List className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Dieser Nutzer hat noch keine öffentlichen Serien erstellt.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {createdSeries.map((series: any) => (
        <Link key={series.id} href={`/serien/${series.slug}`} className="group">
          <article className="group relative flex flex-col h-full bg-card border rounded-xl overflow-hidden transition-shadow hover:shadow-lg">
            {series.coverImage && (
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={series.coverImage}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  {series.visibility === "PRIVATE" && (
                    <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      Privat
                    </Badge>
                  )}
                  {series.type === "USER" && (
                    <Badge variant="outline" className="gap-1 px-2 py-0.5 text-xs">
                      <List className="h-3 w-3" aria-hidden="true" />
                      Nutzer
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col p-4">
              <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {series.title}
              </h3>

              {series.description && (
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                  {series.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {series.partCount} Teil{series.partCount !== 1 ? "e" : ""}
                </span>

                {series.aggregateScore !== null && (
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                    getScoreBadgeClassName(series.aggregateScore)
                  )}>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Ø {series.aggregateScore}
                </span>
              )}
              </div>

              <span className="mt-auto inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors w-full">
                Zur Serie
              </span>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

export function PublicProfile({ profile, username, subscribedCategories }: PublicProfileProps) {
  const { user } = profile;
  const userProfile = user.userProfile;

  const isOwnProfile = typeof window !== "undefined" && false;

  const memberSince = user.createdAt.toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });

  const activeTab = userProfile?.showRatings ? "ratings" : userProfile?.showBookmarks ? "bookmarks" : "ratings";

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Profile Header */}
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="w-24 h-24 md:w-28 md:h-28 shrink-0">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.displayName} />
              <AvatarFallback className="text-3xl md:text-4xl">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
                    {user.displayName}
                  </h1>
                  <p className="text-muted-foreground">@{user.username}</p>
                </div>
                {!isOwnProfile && (
                  <FollowButton
                    followingId={user.id}
                    username={user.username}
                    displayName={user.displayName}
                    initialFollowing={false}
                    initialFollowerCount={userProfile?.followerCount ?? 0}
                  />
                )}
              </div>

              {userProfile?.bio && (
                <p className="text-base text-foreground/90 whitespace-pre-wrap">{userProfile.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  Mitglied seit {memberSince}
                </span>
                {userProfile && (
                  <>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {userProfile.followerCount} Follower
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4" />
                      {userProfile.followingCount} Folge ich
                    </span>
                  </>
                )}
              </div>

              {/* Subscribed Categories */}
              {subscribedCategories && subscribedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2" aria-label="Interessen">
                  {subscribedCategories.map(cat => {
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <Link
                        key={cat}
                        href={CATEGORY_HREFS[cat]}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Badge variant="outline" className="gap-1.5 px-2 py-1 h-auto">
                          <Icon className="h-3 w-3" aria-hidden="true" />
                          <span>{CATEGORY_LABELS[cat]}</span>
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Bewertungen"
            value={userProfile?.showRatings ? "..." : "Privat"}
            icon={<Star className="h-5 w-5 text-yellow-500" />}
            href={`/u/${username}?tab=ratings`}
            showLink={userProfile?.showRatings}
          />
          <StatCard
            label="Gespeichert"
            value={userProfile?.showBookmarks ? "..." : "Privat"}
            icon={<Bookmark className="h-5 w-5 text-primary" />}
            href={`/u/${username}?tab=bookmarks`}
            showLink={userProfile?.showBookmarks}
          />
          <StatCard
            label="Ø Bewertung"
            value="—"
            icon={<Star className="h-5 w-5 text-amber-500" />}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ratings" disabled={!userProfile?.showRatings}>
              <Star className="h-4 w-4 mr-2" />
              Bewertungen
            </TabsTrigger>
            <TabsTrigger value="bookmarks" disabled={!userProfile?.showBookmarks}>
              <Bookmark className="h-4 w-4 mr-2" />
              Gespeichert
            </TabsTrigger>
            {FEATURE_USER_SERIES && (
              <TabsTrigger value="series">
                <List className="h-4 w-4 mr-2" />
                Serien
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="ratings" className="mt-4">
            {userProfile?.showRatings ? (
              <ProfileRatingsList userId={user.id} username={username} />
            ) : (
              <PrivateContent message="Dieser Nutzer zeigt seine Bewertungen nicht öffentlich." />
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-4">
            {userProfile?.showBookmarks ? (
              <ProfileBookmarksList userId={user.id} username={username} />
            ) : (
              <PrivateContent message="Dieser Nutzer zeigt seine gespeicherten Reviews nicht öffentlich." />
            )}
          </TabsContent>

          {FEATURE_USER_SERIES && (
            <TabsContent value="series" className="mt-4">
              <UserSeriesTab userId={user.id} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
  showLink = true,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  href?: string;
  showLink?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      {showLink && href ? (
        <Link href={href} className="text-2xl font-bold text-primary hover:underline">
          {value}
        </Link>
      ) : (
        <span className="text-2xl font-bold text-muted-foreground">{value}</span>
      )}
    </div>
  );
}

function PrivateContent({ message }: { message: string }) {
  return (
    <div className="py-12 text-center border border-border rounded-lg bg-muted/50">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}