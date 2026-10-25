import { describe, it, expect } from "vitest";
import {
  createUserSeriesSchema,
  updateUserSeriesSchema,
  reorderUserSeriesSchema,
  addUserSeriesItemSchema,
  userSeriesParamsSchema,
  userSeriesItemParamsSchema,
  followUserSeriesSchema,
  userSeriesFollowParamsSchema,
  inviteCollaboratorSchema,
  updateCollaboratorSchema,
  collaboratorParamsSchema,
  seriesListQuerySchema,
  userSeriesListQuerySchema,
} from "@/lib/user-series-schema";

describe("User Series Schemas", () => {
  describe("createUserSeriesSchema", () => {
    it("validates valid input", () => {
      const input = {
        title: "Meine Top 10 RPGs",
        description: "Die besten RPGs aller Zeiten",
        coverImage: "https://example.com/cover.jpg",
        visibility: "PUBLIC",
        reviewIds: ["clx1234567890abcdef123456", "clx1234567890abcdef123457"],
      };
      const result = createUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("requires title", () => {
      const input = {
        description: "Test",
      };
      const result = createUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("title");
      }
    });

    it("rejects title too long", () => {
      const input = {
        title: "a".repeat(201),
      };
      const result = createUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects description too long", () => {
      const input = {
        title: "Test",
        description: "a".repeat(5001),
      };
      const result = createUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid coverImage URL", () => {
      const input = {
        title: "Test",
        coverImage: "not-a-url",
      };
      const result = createUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("accepts empty coverImage string", () => {
      const input = {
        title: "Test",
        coverImage: "",
      };
      const result = createUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("defaults visibility to PUBLIC", () => {
      const input = { title: "Test" };
      const result = createUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibility).toBe("PUBLIC");
      }
    });

    it("rejects too many reviewIds", () => {
      const input = {
        title: "Test",
        reviewIds: Array(51).fill("clx1234567890abcdef123456"),
      };
      const result = createUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid reviewId format", () => {
      const input = {
        title: "Test",
        reviewIds: ["invalid-id"],
      };
      const result = createUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserSeriesSchema", () => {
    it("validates partial update", () => {
      const input = {
        title: "Neuer Titel",
        visibility: "PRIVATE",
      };
      const result = updateUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("accepts null description", () => {
      const input = {
        description: null,
      };
      const result = updateUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("accepts items array for reorder", () => {
      const input = {
        items: [
          { reviewId: "clx1234567890abcdef123456", seriesOrder: 1 },
          { reviewId: "clx1234567890abcdef123457", seriesOrder: 2 },
        ],
      };
      const result = updateUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("reorderUserSeriesSchema", () => {
    it("validates valid reorder input", () => {
      const input = {
        items: [
          { reviewId: "clx1234567890abcdef123456", seriesOrder: 2 },
          { reviewId: "clx1234567890abcdef123457", seriesOrder: 1 },
        ],
        version: 5,
      };
      const result = reorderUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("requires version", () => {
      const input = {
        items: [{ reviewId: "clx1234567890abcdef123456", seriesOrder: 1 }],
      };
      const result = reorderUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects non-positive version", () => {
      const input = {
        items: [{ reviewId: "clx1234567890abcdef123456", seriesOrder: 1 }],
        version: 0,
      };
      const result = reorderUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("addUserSeriesItemSchema", () => {
    it("validates valid reviewId", () => {
      const input = { reviewId: "clx1234567890abcdef123456" };
      const result = addUserSeriesItemSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects invalid reviewId", () => {
      const input = { reviewId: "invalid" };
      const result = addUserSeriesItemSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("userSeriesParamsSchema", () => {
    it("validates slug", () => {
      const input = { slug: "meine-top-10-rpgs" };
      const result = userSeriesParamsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects empty slug", () => {
      const input = { slug: "" };
      const result = userSeriesParamsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("userSeriesItemParamsSchema", () => {
    it("validates slug and reviewId", () => {
      const input = { slug: "meine-serie", reviewId: "clx1234567890abcdef123456" };
      const result = userSeriesItemParamsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects invalid reviewId", () => {
      const input = { slug: "test", reviewId: "invalid" };
      const result = userSeriesItemParamsSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("followUserSeriesSchema", () => {
    it("accepts empty body", () => {
      const input = {};
      const result = followUserSeriesSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("userSeriesFollowParamsSchema", () => {
    it("validates slug", () => {
      const input = { slug: "meine-serie" };
      const result = userSeriesFollowParamsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("inviteCollaboratorSchema", () => {
    it("validates valid input", () => {
      const input = { userId: "clx1234567890abcdef123456", role: "EDITOR" };
      const result = inviteCollaboratorSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("defaults role to EDITOR", () => {
      const input = { userId: "clx1234567890abcdef123456" };
      const result = inviteCollaboratorSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("EDITOR");
      }
    });

    it("rejects invalid userId", () => {
      const input = { userId: "invalid" };
      const result = inviteCollaboratorSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid role", () => {
      const input = { userId: "clx1234567890abcdef123456", role: "INVALID" };
      const result = inviteCollaboratorSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("updateCollaboratorSchema", () => {
    it("validates role change", () => {
      const input = { role: "OWNER" };
      const result = updateCollaboratorSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects invalid role", () => {
      const input = { role: "INVALID" };
      const result = updateCollaboratorSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("collaboratorParamsSchema", () => {
    it("validates slug and userId", () => {
      const input = { slug: "meine-serie", userId: "clx1234567890abcdef123456" };
      const result = collaboratorParamsSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("seriesListQuerySchema (Public API)", () => {
    it("validates with all optional params", () => {
      const input = {
        cursor: "abc123",
        limit: "10",
        q: "rpg",
        sort: "title",
        order: "asc",
        type: "USER",
        visibility: "PUBLIC",
        ownerId: "clx1234567890abcdef123456",
      };
      const result = seriesListQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.type).toBe("USER");
        expect(result.data.visibility).toBe("PUBLIC");
      }
    });

    it("defaults limit to 20", () => {
      const input = {};
      const result = seriesListQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it("defaults sort to createdAt", () => {
      const input = {};
      const result = seriesListQuerySchema.safeParse(input);
      if (result.success) {
        expect(result.data.sort).toBe("createdAt");
      }
    });

    it("defaults order to desc", () => {
      const input = {};
      const result = seriesListQuerySchema.safeParse(input);
      if (result.success) {
        expect(result.data.order).toBe("desc");
      }
    });

    it("rejects invalid sort", () => {
      const input = { sort: "invalid" };
      const result = seriesListQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid type", () => {
      const input = { type: "INVALID" };
      const result = seriesListQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects limit > 50", () => {
      const input = { limit: "100" };
      const result = seriesListQuerySchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("userSeriesListQuerySchema (User API)", () => {
    it("validates with visibility filter", () => {
      const input = { visibility: "PRIVATE", limit: "10" };
      const result = userSeriesListQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.visibility).toBe("PRIVATE");
        expect(result.data.limit).toBe(10);
      }
    });

    it("defaults limit to 20", () => {
      const input = {};
      const result = userSeriesListQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });
  });
});