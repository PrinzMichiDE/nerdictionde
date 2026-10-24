import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { getFeed } from "@/lib/feed";
import { FeedPage } from "@/components/feed/FeedPage";

export const metadata: Metadata = {
  title: "Aktivitäts-Feed - Nerdiction",
  description: "Aktivitäten der Nutzer, denen du folgst",
};

export default async function FeedPageWrapper() {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/feed");

  const feed = await getFeed(session.userId);

  return <FeedPage initialFeed={feed} userId={session.userId} />;
}