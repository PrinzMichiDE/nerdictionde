import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { getNotifications } from "@/lib/notifications";
import { NotificationsPage } from "@/components/notifications/NotificationsPage";
import { NotificationClient } from "@/lib/notifications";

export const metadata: Metadata = {
  title: "Benachrichtigungen - Nerdiction",
  description: "Deine Benachrichtigungen auf einen Blick",
};

export default async function NotificationsPageWrapper() {
  const session = await getServerSession();
  if (!session) redirect("/login?redirect=/benachrichtigungen");

  const notifications = await getNotifications(session.userId, { limit: 20 });

  // Convert to client type (ISO strings for dates)
  const clientNotifications = {
    ...notifications,
    items: notifications.items.map((n) => ({
      ...n,
      readAt: n.readAt?.toISOString() || null,
      createdAt: n.createdAt.toISOString(),
    })),
  };

  return <NotificationsPage initialNotifications={clientNotifications} userId={session.userId} />;
}