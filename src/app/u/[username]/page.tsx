import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUserProfile } from "@/lib/user-profiles";
import { getSubscribedCategories } from "@/lib/category-subscriptions";
import { PublicProfile } from "@/components/profiles/PublicProfile";
import { getSiteUrl } from "@/lib/seo";
import { FEATURE_CATEGORY_SUBSCRIPTIONS } from "@/lib/feature-flags";
import { generateProfileMetadata } from "@/lib/share-meta";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) {
    return {
      title: "Profil nicht gefunden - Nerdiction",
      description: "Das angeforderte Nutzerprofil existiert nicht oder ist privat.",
    };
  }

  const displayName = profile.user.displayName;
  const bio = profile.user.userProfile?.bio || "";
  const avatar = profile.user.profileImageUrl || undefined;

  return generateProfileMetadata({
    id: profile.user.id,
    username: profile.user.username,
    displayName: profile.user.displayName,
    bio: profile.user.userProfile?.bio || undefined,
    profileImageUrl: avatar,
    followerCount: profile.user.userProfile?.followerCount ?? 0,
    followingCount: profile.user.userProfile?.followingCount ?? 0,
  });
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getUserProfile(username);

  if (!profile) {
    notFound();
  }

  // Fetch subscribed categories if feature is enabled
  let subscribedCategories: string[] = [];
  if (FEATURE_CATEGORY_SUBSCRIPTIONS && profile.user.userProfile?.isPublic) {
    subscribedCategories = await getSubscribedCategories(profile.user.id);
  }

  return <PublicProfile profile={profile} username={username} subscribedCategories={subscribedCategories} />;
}