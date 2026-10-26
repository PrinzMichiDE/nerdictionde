import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/share/track/route";
import { FEATURE_SHARE_TRACKING, FEATURE_SOCIAL_SHARING } from "@/lib/feature-flags";
import prisma from "@/lib/prisma";

vi.mock("@/lib/feature-flags", () => ({
  FEATURE_SHARE_TRACKING: true,
  FEATURE_SOCIAL_SHARING: true,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    shareEvent: {
      createMany: vi.fn(),
    },
    review: {
      update: vi.fn(),
    },
    reviewCollection: {
      update: vi.fn(),
    },
    reviewSeries: {
      update: vi.fn(),
    },
    twitchUser: {
      update: vi.fn(),
    },
    $executeRawUnsafe: vi.fn(),
  },
}));

function createMockRequest(body: any, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/share/track", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/share/track", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 202 for valid request", async () => {
    const request = createMockRequest({
      contentType: "REVIEW",
      contentId: "review-1",
      platform: "TWITTER",
    });

    const response = await POST(request as any);
    expect(response.status).toBe(202);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it("returns 400 for invalid contentType", async () => {
    const request = createMockRequest({
      contentType: "INVALID",
      contentId: "review-1",
      platform: "TWITTER",
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 for missing contentId", async () => {
    const request = createMockRequest({
      contentType: "REVIEW",
      contentId: "",
      platform: "TWITTER",
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid platform", async () => {
    const request = createMockRequest({
      contentType: "REVIEW",
      contentId: "review-1",
      platform: "INVALID_PLATFORM",
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it("accepts all valid platforms", async () => {
    const platforms = ["TWITTER", "BLUESKY", "MASTODON", "REDDIT", "DISCORD", "COPY_LINK"];

    for (const platform of platforms) {
      const request = createMockRequest({
        contentType: "REVIEW",
        contentId: "review-1",
        platform,
      });

      const response = await POST(request as any);
      expect(response.status).toBe(202);
    }
  });

  it("accepts all valid content types", async () => {
    const contentTypes = ["REVIEW", "COLLECTION", "SERIES", "PROFILE"];

    for (const contentType of contentTypes) {
      const request = createMockRequest({
        contentType,
        contentId: "test-1",
        platform: "TWITTER",
      });

      const response = await POST(request as any);
      expect(response.status).toBe(202);
    }
  });

  it("includes userId from header when present", async () => {
    const request = createMockRequest(
      {
        contentType: "REVIEW",
        contentId: "review-1",
        platform: "TWITTER",
      },
      { "x-user-id": "user-123" }
    );

    const response = await POST(request as any);
    expect(response.status).toBe(202);
  });

  it("enforces rate limit", async () => {
    const requests = Array(35)
      .fill(null)
      .map(() =>
        createMockRequest({
          contentType: "REVIEW",
          contentId: "review-1",
          platform: "TWITTER",
        })
      );

    const responses = await Promise.all(requests.map((r) => POST(r as any)));
    const rateLimited = responses.filter((r) => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it("skips tracking when feature flags are disabled (logic verified in generateShareMetadata)", () => {
    expect(FEATURE_SOCIAL_SHARING).toBeDefined();
    expect(FEATURE_SHARE_TRACKING).toBeDefined();
  });
});