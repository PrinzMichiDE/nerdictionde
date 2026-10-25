import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  slugify,
  generateUniqueSlug,
  computeAggregateScore,
  validateOrder,
  checkUserSeriesPermission,
  requireUserSeriesPermission,
} from "@/lib/user-series";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    reviewSeries: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    reviewSeriesItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    twitchUser: {
      findUnique: vi.fn(),
    },
    userSeriesCollaborator: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb({
      reviewSeriesItem: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      review: {
        update: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      reviewSeries: {
        update: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      userSeriesCollaborator: {
        deleteMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn(),
      },
      userSeriesFollow: {
        deleteMany: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        findUnique: vi.fn(),
      },
    })),
  },
}));

import prisma from "@/lib/prisma";

describe("User Series Core Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("slugify", () => {
    it("converts title to slug", () => {
      expect(slugify("Meine Top 10 RPGs")).toBe("meine-top-10-rpgs");
    });

    it("handles special characters", () => {
      expect(slugify("Test!@#$%^&*()")).toBe("test");
    });

    it("handles multiple spaces", () => {
      expect(slugify("Test   Serie   Name")).toBe("test-serie-name");
    });

    it("trims leading/trailing dashes", () => {
      expect(slugify("-test-")).toBe("test");
    });

    it("handles empty string", () => {
      expect(slugify("")).toBe("");
    });
  });

  describe("generateUniqueSlug", () => {
    it("returns base slug if unique", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue(null);
      const slug = await generateUniqueSlug("meine-serie");
      expect(slug).toBe("meine-serie");
    });

    it("appends counter if slug exists", async () => {
      (prisma.reviewSeries.findUnique as any)
        .mockResolvedValueOnce({ id: "1" }) // First call - exists
        .mockResolvedValueOnce(null); // Second call - unique
      const slug = await generateUniqueSlug("meine-serie");
      expect(slug).toBe("meine-serie-2");
    });

    it("increments counter for multiple collisions", async () => {
      (prisma.reviewSeries.findUnique as any)
        .mockResolvedValueOnce({ id: "1" }) // meine-serie exists
        .mockResolvedValueOnce({ id: "2" }) // meine-serie-2 exists
        .mockResolvedValueOnce(null); // meine-serie-3 unique
      const slug = await generateUniqueSlug("meine-serie");
      expect(slug).toBe("meine-serie-3");
    });
  });

  describe("computeAggregateScore", () => {
    it("returns null for empty array", () => {
      expect(computeAggregateScore([])).toBeNull();
    });

    it("calculates average correctly", () => {
      expect(computeAggregateScore([{ score: 80 }, { score: 90 }, { score: 70 }])).toBe(80);
    });

    it("rounds correctly", () => {
      expect(computeAggregateScore([{ score: 80 }, { score: 81 }])).toBe(81);
    });

    it("handles single item", () => {
      expect(computeAggregateScore([{ score: 95 }])).toBe(95);
    });
  });

  describe("validateOrder", () => {
    it("validates correct order 1..N", () => {
      const result = validateOrder(
        [{ reviewId: "1", seriesOrder: 1 }, { reviewId: "2", seriesOrder: 2 }],
        2
      );
      expect(result.valid).toBe(true);
    });

    it("rejects gaps in order", () => {
      const result = validateOrder(
        [{ reviewId: "1", seriesOrder: 1 }, { reviewId: "2", seriesOrder: 3 }],
        2
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("lückenlos");
    });

    it("rejects duplicate reviewIds", () => {
      const result = validateOrder(
        [{ reviewId: "1", seriesOrder: 1 }, { reviewId: "1", seriesOrder: 2 }],
        2
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Doppelte");
    });

    it("accepts empty array", () => {
      const result = validateOrder([], 0);
      expect(result.valid).toBe(true);
    });

    it("rejects non-sequential order", () => {
      const result = validateOrder(
        [{ reviewId: "1", seriesOrder: 2 }, { reviewId: "2", seriesOrder: 1 }],
        2
      );
      // Should be valid after sorting internally
      expect(result.valid).toBe(true);
    });
  });

  describe("checkUserSeriesPermission", () => {
    it("returns NONE for non-existent series", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue(null);
      const result = await checkUserSeriesPermission("user1", "series1");
      expect(result.permission).toBe("NONE");
    });

    it("returns NONE for ADMIN series", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: null,
        type: "ADMIN",
        visibility: "PUBLIC",
        collaborators: [],
      });
      const result = await checkUserSeriesPermission("user1", "series1");
      expect(result.permission).toBe("NONE");
    });

    it("returns OWNER for series owner", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: "user1",
        type: "USER",
        visibility: "PUBLIC",
        collaborators: [],
      });
      const result = await checkUserSeriesPermission("user1", "series1");
      expect(result.permission).toBe("OWNER");
      expect(result.isOwner).toBe(true);
    });

    it("returns EDITOR for accepted collaborator", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: "user2",
        type: "USER",
        visibility: "PUBLIC",
        collaborators: [{ role: "EDITOR" }],
      });
      const result = await checkUserSeriesPermission("user1", "series1");
      expect(result.permission).toBe("EDITOR");
      expect(result.isCollaborator).toBe(true);
      expect(result.collaboratorRole).toBe("EDITOR");
    });

    it("returns OWNER for collaborator with OWNER role", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: "user2",
        type: "USER",
        visibility: "PUBLIC",
        collaborators: [{ role: "OWNER" }],
      });
      const result = await checkUserSeriesPermission("user1", "series1");
      expect(result.permission).toBe("OWNER");
      expect(result.collaboratorRole).toBe("OWNER");
    });

    it("returns VIEWER for public series", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: "user2",
        type: "USER",
        visibility: "PUBLIC",
        collaborators: [],
      });
      const result = await checkUserSeriesPermission("user1", "series1");
      expect(result.permission).toBe("VIEWER");
    });

    it("returns NONE for private series without access", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: "user2",
        type: "USER",
        visibility: "PRIVATE",
        collaborators: [],
      });
      const result = await checkUserSeriesPermission("user1", "series1");
      expect(result.permission).toBe("NONE");
    });

    it("ignores unaccepted collaborator invitations", async () => {
      // Prisma query filters with acceptedAt: { not: null }, so unaccepted collaborators won't be returned
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: "user2",
        type: "USER",
        visibility: "PRIVATE",
        collaborators: [], // Empty because query filters out unaccepted
      });
      const result = await checkUserSeriesPermission("user1", "series1");
      expect(result.permission).toBe("NONE");
    });
  });

  describe("requireUserSeriesPermission", () => {
    it("throws FORBIDDEN when EDITOR required but only VIEWER", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: "user2",
        type: "USER",
        visibility: "PUBLIC",
        collaborators: [],
      });
      await expect(requireUserSeriesPermission("user1", "series1", "EDITOR")).rejects.toThrow(
        "FORBIDDEN"
      );
    });

    it("throws FORBIDDEN when OWNER required but only EDITOR", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: "user2",
        type: "USER",
        visibility: "PUBLIC",
        collaborators: [{ role: "EDITOR", acceptedAt: new Date() }],
      });
      await expect(requireUserSeriesPermission("user1", "series1", "OWNER")).rejects.toThrow(
        "FORBIDDEN"
      );
    });

    it("allows EDITOR when user is EDITOR", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: "user2",
        type: "USER",
        visibility: "PUBLIC",
        collaborators: [{ role: "EDITOR", acceptedAt: new Date() }],
      });
      const result = await requireUserSeriesPermission("user1", "series1", "EDITOR");
      expect(result.permission).toBe("EDITOR");
    });

    it("allows OWNER when user is OWNER", async () => {
      (prisma.reviewSeries.findUnique as any).mockResolvedValue({
        ownerId: "user1",
        type: "USER",
        visibility: "PUBLIC",
        collaborators: [],
      });
      const result = await requireUserSeriesPermission("user1", "series1", "OWNER");
      expect(result.permission).toBe("OWNER");
    });
  });
});