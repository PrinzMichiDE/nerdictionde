import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { getUserProfileById } from "@/lib/user-profiles";
import { ProfileSettings } from "@/components/profiles/ProfileSettings";

export const metadata: Metadata = {
  title: "Profil-Einstellungen - Nerdiction",
  description: "Verwalte dein öffentliches Profil und deine Sichtbarkeit",
};

export default async function ProfileSettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/einstellungen/profil");

  const profile = await getUserProfileById(session.userId);
  if (!profile) redirect("/einstellungen");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ProfileSettings
        initialData={{
          bio: profile.userProfile?.bio || null,
          isPublic: profile.userProfile?.isPublic ?? true,
          showRatings: profile.userProfile?.showRatings ?? true,
          showBookmarks: profile.userProfile?.showBookmarks ?? true,
        }}
      />
    </div>
  );
}