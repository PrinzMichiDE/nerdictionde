"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Bookmark, Users, UserPlus, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FollowButton } from "./FollowButton";
import { ProfileRatingsList } from "./ProfileRatingsList";
import { ProfileBookmarksList } from "./ProfileBookmarksList";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryColor } from "@/lib/utils";

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
}

export function PublicProfile({ profile, username }: PublicProfileProps) {
  const { user } = profile;
  const userProfile = user.userProfile;

  const isOwnProfile = typeof window !== "undefined" && false; // Will be set by parent via props if needed

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ratings" disabled={!userProfile?.showRatings}>
              <Star className="h-4 w-4 mr-2" />
              Bewertungen
            </TabsTrigger>
            <TabsTrigger value="bookmarks" disabled={!userProfile?.showBookmarks}>
              <Bookmark className="h-4 w-4 mr-2" />
              Gespeichert
            </TabsTrigger>
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