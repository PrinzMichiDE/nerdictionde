import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { FEATURE_SHARE_TRACKING, FEATURE_SOCIAL_SHARING } from "@/lib/feature-flags";

const shareTrackSchema = z.object({
  contentType: z.enum(["REVIEW", "COLLECTION", "SERIES", "PROFILE"]),
  contentId: z.string().min(1),
  platform: z.enum(["TWITTER", "BLUESKY", "MASTODON", "REDDIT", "DISCORD", "COPY_LINK"]),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

async function incrementShareCount(
  contentType: string,
  contentId: string,
  platform: string
): Promise<void> {
  const platformKey = platform.toLowerCase();
  const modelMap: Record<string, { model: any; idField: string }> = {
    REVIEW: { model: prisma.review, idField: "id" },
    COLLECTION: { model: prisma.reviewCollection, idField: "id" },
    SERIES: { model: prisma.reviewSeries, idField: "id" },
    PROFILE: { model: prisma.twitchUser, idField: "id" },
  };

  const config = modelMap[contentType];
  if (!config) return;

  try {
    await config.model.update({
      where: { [config.idField]: contentId },
      data: {
        shareCounts: {
          set: {
            [platformKey]: { increment: 1 } as any,
          },
        },
      },
    });
  } catch (error) {
    // If JSON field doesn't support increment, try raw query
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "${contentType.toLowerCase() === "review" ? "Review" : contentType.toLowerCase() === "collection" ? "ReviewCollection" : contentType.toLowerCase() === "series" ? "ReviewSeries" : "TwitchUser"}" SET "share_counts" = jsonb_set(COALESCE("share_counts", '{}'), '{${platformKey}}', COALESCE(("share_counts"->>'${platformKey}')::int, 0) + 1) WHERE "id" = $1`,
        contentId
      );
    } catch (e) {
      console.error("Failed to increment share count:", e);
    }
  }
}

const batchQueue: Array<{
  contentType: string;
  contentId: string;
  platform: string;
  userId?: string;
}> = [];
let batchTimeout: NodeJS.Timeout | null = null;

function scheduleBatchInsert(): void {
  if (batchTimeout) return;
  batchTimeout = setTimeout(async () => {
    batchTimeout = null;
    if (batchQueue.length === 0) return;

    const events = [...batchQueue];
    batchQueue.length = 0;

    try {
      await prisma.shareEvent.createMany({
        data: events.map((e) => ({
          contentType: e.contentType as any,
          contentId: e.contentId,
          platform: e.platform as any,
          userId: e.userId,
        })),
        skipDuplicates: false,
      });

      // Increment counters for each event
      await Promise.all(
        events.map((e) => incrementShareCount(e.contentType, e.contentId, e.platform))
      );
    } catch (error) {
      console.error("Batch insert failed:", error);
      // Re-queue failed events
      batchQueue.unshift(...events);
    }
  }, 30000); // 30 seconds
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!FEATURE_SOCIAL_SHARING || !FEATURE_SHARE_TRACKING) {
    return NextResponse.json({ success: true }, { status: 202 });
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let body: z.infer<typeof shareTrackSchema>;
  try {
    body = shareTrackSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const userId = request.headers.get("x-user-id") || undefined;

  // Fire-and-forget: queue for batch insert
  batchQueue.push({
    contentType: body.contentType,
    contentId: body.contentId,
    platform: body.platform,
    userId,
  });
  scheduleBatchInsert();

  return NextResponse.json({ success: true }, { status: 202 });
}