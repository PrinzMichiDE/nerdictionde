import { describe, it, expect, vi } from "vitest";
import {
  generateShareMetadata,
  generateReviewMetadata,
  generateCollectionMetadata,
  generateSeriesMetadata,
  generateProfileMetadata,
  truncateDescription,
  buildArticleTags,
} from "@/lib/share-meta";

vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn) => fn),
}));

describe("share-meta", () => {
  describe("truncateDescription", () => {
    it("truncates long descriptions", () => {
      const longText = "A".repeat(200);
      const result = truncateDescription(longText, 160);
      expect(result).toHaveLength(160);
      expect(result.endsWith("…")).toBe(true);
    });

    it("returns original for short descriptions", () => {
      expect(truncateDescription("Short text", 160)).toBe("Short text");
    });

    it("handles undefined", () => {
      expect(truncateDescription(undefined)).toContain("Nerdiction.de");
    });

    it("handles exact length", () => {
      const exact = "A".repeat(160);
      expect(truncateDescription(exact, 160)).toBe(exact);
    });
  });

  describe("buildArticleTags", () => {
    it("combines tags and section", () => {
      const tags = buildArticleTags(["Action", "RPG"], "Games");
      expect(tags).toContain("Action");
      expect(tags).toContain("RPG");
      expect(tags).toContain("Games");
    });

    it("limits to 6 tags", () => {
      const tags = buildArticleTags(["A", "B", "C", "D", "E", "F", "G"], "Section");
      expect(tags.length).toBe(6);
    });

    it("handles empty tags", () => {
      const tags = buildArticleTags([], "Games");
      expect(tags).toEqual(["Games"]);
    });
  });

  describe("generateShareMetadata", () => {
    const baseParams = {
      contentType: "REVIEW" as const,
      contentId: "review-1",
      title: "Test Game Review",
      description: "A great game review with lots of details",
      image: "https://nerdiction.de/images/test.jpg",
      url: "/reviews/test-game",
      author: "TestAuthor",
      authorUrl: "https://nerdiction.de/u/testauthor",
      authorTwitter: "testauthor",
      publishedAt: new Date("2024-01-15"),
      tags: ["Action", "RPG"],
      section: "Games",
    };

    it("generates base metadata with OG and Twitter tags", () => {
      const meta = generateShareMetadata(baseParams) as any;

      expect(meta.title).toBe("Test Game Review | Nerdiction.de");
      expect(meta.description).toBe("A great game review with lots of details");
      expect(meta.openGraph?.siteName).toBe("Nerdiction.de");
      expect(meta.openGraph?.locale).toBe("de_DE");
      expect(meta.openGraph?.images?.[0]?.url).toBe("https://nerdiction.de/images/test.jpg");
      expect(meta.twitter?.site).toBe("@nerdiction_de");
      expect(meta.twitter?.creator).toBe("@testauthor");
      expect(meta.twitter?.card).toBe("summary_large_image");
    });

    it("generates article-specific metadata for REVIEW", () => {
      const meta = generateShareMetadata(baseParams) as any;

      expect(meta.openGraph?.type).toBe("article");
      expect(meta.openGraph?.publishedTime).toBe("2024-01-15T00:00:00.000Z");
      expect(meta.openGraph?.section).toBe("Games");
      expect(meta.openGraph?.tags).toEqual(["Action", "RPG", "Games"]);
      expect(meta.other?.["article:author"]).toBe("https://nerdiction.de/u/testauthor");
      expect(meta.other?.["article:publisher"]).toBe("https://nerdiction.de");
      expect(meta.other?.["article:section"]).toBe("Games");
    });

    it("generates website metadata for COLLECTION", () => {
      const meta = generateShareMetadata({ ...baseParams, contentType: "COLLECTION" }) as any;

      expect(meta.openGraph?.type).toBe("website");
    });

    it("generates article metadata for SERIES", () => {
      const meta = generateShareMetadata({ ...baseParams, contentType: "SERIES" }) as any;

      expect(meta.openGraph?.type).toBe("article");
      expect(meta.openGraph?.section).toBe("Serie");
    });

    it("generates profile metadata for PROFILE", () => {
      const meta = generateShareMetadata({ ...baseParams, contentType: "PROFILE" }) as any;

      expect(meta.openGraph?.type).toBe("profile");
      expect(meta.twitter?.card).toBe("summary");
      expect(meta.openGraph?.profile?.firstName).toBe("TestAuthor");
    });

    it("uses fallback image when none provided", () => {
      const meta = generateShareMetadata({ ...baseParams, image: undefined }) as any;

      expect(meta.openGraph?.images?.[0]?.url).toBe("/og-default.png");
    });

    it("handles missing optional fields gracefully", () => {
      const minimalParams = {
        contentType: "REVIEW" as const,
        contentId: "review-1",
        title: "Minimal Review",
        url: "/reviews/minimal",
      };
      const meta = generateShareMetadata(minimalParams) as any;

      expect(meta.title).toBe("Minimal Review | Nerdiction.de");
      expect(meta.description).toContain("Nerdiction.de");
    });
  });

  describe("generateReviewMetadata", () => {
    const mockReview = {
      id: "review-1",
      slug: "test-game",
      title: "Test Game",
      title_en: "Test Game EN",
      content: "# Introduction\n\nThis is a **great** game with *awesome* gameplay.",
      category: "game",
      images: ["https://nerdiction.de/images/test-game.jpg"],
      score: 85,
      author: { username: "testauthor", displayName: "Test Author" },
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
      tags: [{ tag: { name: "Action" } }, { tag: { name: "RPG" } }],
      youtubeVideos: ["dQw4w9WgXcQ"],
    };

    it("generates German metadata by default", () => {
      const meta = generateReviewMetadata(mockReview, "de") as any;

      expect(meta.title).toBe("Test Game | Nerdiction.de");
      expect(meta.description).toContain("This is a great game with awesome gameplay");
      expect(meta.openGraph?.images?.[0]?.url).toBe("https://nerdiction.de/images/test-game.jpg");
      expect(meta.other?.["article:section"]).toBe("Games");
    });

    it("generates English metadata when requested", () => {
      const meta = generateReviewMetadata(mockReview, "en") as any;

      expect(meta.title).toBe("Test Game EN | Nerdiction.de");
    });

    it("falls back to German title when English not available", () => {
      const reviewNoEn = { ...mockReview, title_en: null };
      const meta = generateReviewMetadata(reviewNoEn, "en") as any;

      expect(meta.title).toBe("Test Game | Nerdiction.de");
    });

    it("strips markdown from description", () => {
      const meta = generateReviewMetadata(mockReview, "de") as any;

      expect(meta.description).not.toContain("#");
      expect(meta.description).not.toContain("**");
      expect(meta.description).not.toContain("*");
    });

    it("handles missing author", () => {
      const reviewNoAuthor = { ...mockReview, author: undefined };
      const meta = generateReviewMetadata(reviewNoAuthor, "de") as any;

      expect(meta.other?.["article:author"]).toBe("");
    });

    it("handles hardware category", () => {
      const hardwareReview = { ...mockReview, category: "hardware" };
      const meta = generateReviewMetadata(hardwareReview, "de") as any;

      expect(meta.other?.["article:section"]).toBe("Hardware");
    });
  });

  describe("generateCollectionMetadata", () => {
    const mockCollection = {
      id: "collection-1",
      slug: "best-games-2024",
      title: "Beste Spiele 2024",
      description: "Eine kuratierte Liste der besten Spiele des Jahres",
      owner: { username: "curator", displayName: "Game Curator" },
      items: [
        { review: { images: ["https://nerdiction.de/images/game1.jpg"] } },
        { review: { images: ["https://nerdiction.de/images/game2.jpg"] } },
      ],
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
    };

    it("generates collection metadata with first item image", () => {
      const meta = generateCollectionMetadata(mockCollection) as any;

      expect(meta.title).toBe("Beste Spiele 2024 | Nerdiction.de");
      expect(meta.description).toContain("kuratierte Liste");
      expect(meta.openGraph?.images?.[0]?.url).toBe("https://nerdiction.de/images/game1.jpg");
      expect(meta.openGraph?.type).toBe("website");
    });

    it("handles missing owner", () => {
      const collectionNoOwner = { ...mockCollection, owner: undefined };
      const meta = generateCollectionMetadata(collectionNoOwner) as any;

      expect(meta.description).toContain("kuratierte Liste");
    });

    it("handles empty items array", () => {
      const emptyCollection = { ...mockCollection, items: [] };
      const meta = generateCollectionMetadata(emptyCollection) as any;

      expect(meta.openGraph?.images?.[0]?.url).toBe("/og-default.png");
    });
  });

  describe("generateSeriesMetadata", () => {
    const mockSeries = {
      id: "series-1",
      slug: "final-fantasy-retro",
      title: "Final Fantasy Retrospektive",
      description: "Eine Reise durch alle Final Fantasy Teile",
      coverImage: "https://nerdiction.de/images/ff-series.jpg",
      partCount: 5,
      aggregateScore: 88,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
    };

    it("generates series metadata with cover image", () => {
      const meta = generateSeriesMetadata(mockSeries) as any;

      expect(meta.title).toBe("Final Fantasy Retrospektive | Nerdiction.de");
      expect(meta.description).toContain("Reise durch");
      expect(meta.openGraph?.images?.[0]?.url).toBe("https://nerdiction.de/images/ff-series.jpg");
      expect(meta.openGraph?.type).toBe("article");
      expect(meta.openGraph?.section).toBe("Serie");
    });

    it("handles missing cover image", () => {
      const seriesNoCover = { ...mockSeries, coverImage: null };
      const meta = generateSeriesMetadata(seriesNoCover) as any;

      expect(meta.openGraph?.images?.[0]?.url).toBe("/og-default.png");
    });

    it("handles missing description", () => {
      const seriesNoDesc = { ...mockSeries, description: null };
      const meta = generateSeriesMetadata(seriesNoDesc) as any;

      expect(meta.description).toContain("5 Teilen");
    });
  });

  describe("generateProfileMetadata", () => {
    const mockProfile = {
      id: "user-1",
      username: "testuser",
      displayName: "Test User",
      bio: "Gamer und Reviewer seit 2010",
      profileImageUrl: "https://nerdiction.de/avatars/testuser.jpg",
      followerCount: 123,
      followingCount: 45,
    };

    it("generates profile metadata", () => {
      const meta = generateProfileMetadata(mockProfile) as any;

      expect(meta.title).toBe("Test User | Nerdiction.de");
      expect(meta.description).toContain("Gamer und Reviewer");
      expect(meta.openGraph?.images?.[0]?.url).toBe("https://nerdiction.de/avatars/testuser.jpg");
      expect(meta.openGraph?.type).toBe("profile");
      expect(meta.openGraph?.profile?.firstName).toBe("Test User");
      expect(meta.openGraph?.profile?.username).toBe("Test User");
      expect(meta.twitter?.card).toBe("summary");
    });

    it("handles missing bio and avatar", () => {
      const minimalProfile = {
        ...mockProfile,
        bio: null,
        profileImageUrl: null,
      };
      const meta = generateProfileMetadata(minimalProfile) as any;

      expect(meta.description).toContain("123 Follower");
      expect(meta.openGraph?.images?.[0]?.url).toBe("/og-default.png");
    });
  });
});