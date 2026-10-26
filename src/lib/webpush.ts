import webpush from "web-push";
import prisma from "@/lib/prisma";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@nerdiction.de";

let configured = false;

function ensureConfig() {
  if (configured) return;
  if (PUBLIC_KEY && PRIVATE_KEY) {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  }
}

export function isPushConfigured() {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

export function getVapidPublicKey() {
  return PUBLIC_KEY ?? null;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  ensureConfig();
  if (!configured) return false;

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: unknown) {
    // 404/410 means the subscription is no longer valid
    const status = (err as { statusCode?: number })?.statusCode;
    if (status === 404 || status === 410) return false;
    return false;
  }
}

// Notify all subscribers that opted into a notification type via Push channel.
// Uses the new NotificationPreference model (type × channel × frequency).
export async function notifySubscribers(
  type: import('@prisma/client').NotificationType,
  payload: PushPayload
): Promise<number> {
  ensureConfig();
  if (!configured) return 0;

  // Find users who have this notification type enabled for PUSH channel with IMMEDIATE frequency
  const prefs = await prisma.notificationPreference.findMany({
    where: {
      type,
      channel: 'PUSH',
      frequency: 'IMMEDIATE',
      enabled: true,
    },
    select: { userId: true },
  });

  if (prefs.length === 0) return 0;

  const userIds = prefs.map((p) => p.userId);

  const subs = await prisma.pushSubscription.findMany({
    where: {
      userId: { in: userIds },
    },
    select: { endpoint: true, p256dh: true, auth: true },
  });

  let sent = 0;
  for (const sub of subs) {
    const ok = await sendPush(sub, payload);
    if (ok) sent++;
  }
  return sent;
}
