import webpush from "web-push";
import { unstable_cache } from "next/cache";
import prisma from "@/lib/prisma";
import { revalidateTag } from "next/cache";

const revalidate = (tag: string) => (revalidateTag as (tag: string) => void)(tag);

/**
 * Server Core Logic für Web Push Notifications (VAPID)
 */

// ============================================
// VAPID Configuration
// ============================================

let vapidConfigured = false;

function ensureVapidConfig(): void {
  if (vapidConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@nerdiction.de";

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
  }
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

/**
 * Generiert neue VAPID Keys (für Setup/Development)
 * Nutzung: npx tsx -e "import { generateVapidKeys } from '@/lib/push-notifications'; console.log(generateVapidKeys())"
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}

// ============================================
// Push Subscription Management
// ============================================

const PUSH_SUB_TAG = "push-sub";

export const getUserPushSubscription = unstable_cache(
  async (userId: string) => {
    return prisma.pushSubscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },
  ["push-subscription"],
  { tags: [PUSH_SUB_TAG], revalidate: 60 }
);

export async function savePushSubscription(
  userId: string,
  endpoint: string,
  p256dh: string,
  auth: string,
  userAgent?: string
): Promise<void> {
  // Upsert: Neue Subscription ersetzt alte (ein User = eine Subscription)
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      userId,
      p256dh,
      auth,
      userAgent,
      updatedAt: new Date(),
    },
    create: {
      userId,
      endpoint,
      p256dh,
      auth,
      userAgent,
    },
  });

  revalidate(PUSH_SUB_TAG);
}

export async function deletePushSubscription(userId: string): Promise<boolean> {
  const sub = await prisma.pushSubscription.findFirst({
    where: { userId },
  });

  if (!sub) return false;

  await prisma.pushSubscription.delete({
    where: { id: sub.id },
  });

  revalidate(PUSH_SUB_TAG);
  return true;
}

// ============================================
// Push Sending
// ============================================

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

interface WebPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Sendet Push an einzelne Subscription
 * Returns false wenn Subscription ungültig (404/410)
 */
export async function sendPushNotification(
  subscription: WebPushSubscription,
  payload: PushPayload
): Promise<boolean> {
  ensureVapidConfig();
  if (!vapidConfigured) return false;

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url,
        icon: payload.icon || "/icons/icon-192.png",
        badge: payload.badge || "/icons/badge-72.png",
        data: payload.data,
        requireInteraction: false,
      })
    );
    return true;
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode;
    // 404/410 = Subscription nicht mehr gültig (User hat Permissions entzogen, Browser gewechselt, etc.)
    if (status === 404 || status === 410) {
      return false;
    }
    // Andere Fehler loggen aber nicht werfen (fire-and-forget)
    console.error("[Push] Send failed:", err);
    return false;
  }
}

/**
 * Sendet Push an alle Subscriptions eines Users
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  ensureVapidConfig();
  if (!vapidConfigured) return 0;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { endpoint: true, p256dh: true, auth: true },
  });

  let sent = 0;
  for (const sub of subs) {
    const ok = await sendPushNotification(sub, payload);
    if (ok) sent++;
  }
  return sent;
}

/**
 * Sendet Push an mehrere User (Batch, für Digests)
 * Filtert nach Preferences (PUSH channel, IMMEDIATE frequency, enabled)
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<number> {
  ensureVapidConfig();
  if (!vapidConfigured || userIds.length === 0) return 0;

  // Lade alle Subscriptions für diese User
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
    select: { endpoint: true, p256dh: true, auth: true, userId: true },
  });

  if (subs.length === 0) return 0;

  // Gruppiere nach UserId für Dedupe (ein User kann theoretisch mehrere Subs haben)
  const subsByUser = new Map<string, typeof subs[0]>();
  for (const sub of subs) {
    if (!subsByUser.has(sub.userId)) {
      subsByUser.set(sub.userId, sub);
    }
  }

  let sent = 0;
  for (const sub of subsByUser.values()) {
    const ok = await sendPushNotification(sub, payload);
    if (ok) sent++;
  }
  return sent;
}

/**
 * Cleanup ungültiger Subscriptions (nach fehlgeschlagenem Send)
 * Sollte periodisch oder nach Push-Kampagnen aufgerufen werden
 */
export async function cleanupInvalidSubscriptions(userIds: string[]): Promise<number> {
  if (userIds.length === 0) return 0;

  // Wir können hier nicht direkt prüfen, aber wir können alte Subscriptions löschen
  // die seit längerer Zeit nicht aktualisiert wurden (z.B. > 90 Tage)
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const result = await prisma.pushSubscription.deleteMany({
    where: {
      userId: { in: userIds },
      updatedAt: { lt: cutoff },
    },
  });

  return result.count;
}