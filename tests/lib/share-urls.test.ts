import { describe, it, expect } from "vitest";
import {
  buildShareUrls,
  getPlatformDisplayName,
  getPlatformIcon,
  getDefaultShareText,
  truncateText,
  buildHashtags,
} from "@/lib/share-urls";

describe("share-urls", () => {
  const baseParams = {
    contentType: "REVIEW" as const,
    contentId: "review-1",
    title: "Test Game Review",
    description: "A great game review",
    url: "https://nerdiction.de/reviews/test-game",
    image: "https://nerdiction.de/images/test-game.jpg",
    author: "TestAuthor",
    tags: ["Action", "RPG"],
  };

  describe("buildShareUrls", () => {
    it("generates valid URLs for all 6 platforms", () => {
      const urls = buildShareUrls(baseParams);

      expect(urls.twitter).toContain("twitter.com/intent/tweet");
      expect(urls.twitter).toContain("Test%20Game%20Review");
      expect(urls.twitter).toContain("url=https%3A%2F%2Fnerdiction.de%2Freviews%2Ftest-game");

      expect(urls.bluesky).toContain("bsky.app/intent/compose");
      expect(urls.bluesky).toContain("Test%20Game%20Review");

      expect(urls.mastodon).toContain("mastodon.social/share");
      expect(urls.mastodon).toContain("Test%20Game%20Review");

      expect(urls.reddit).toContain("reddit.com/submit");
      expect(urls.reddit).toContain("url=");
      expect(urls.reddit).toContain("title=");

      expect(urls.discord).toContain("discord.com/share");
      expect(urls.discord).toContain("url=");

      expect(urls.copyLink).toBe(baseParams.url);
    });

    it("includes hashtags for Twitter, Bluesky, Mastodon", () => {
      const urls = buildShareUrls(baseParams);

      expect(urls.twitter).toContain("%23Nerdiction");
      expect(urls.twitter).toContain("%23Gaming");
      expect(urls.twitter).toContain("%23Review");
      expect(urls.twitter).toContain("%23Action");
      expect(urls.twitter).toContain("%23RPG");

      expect(urls.bluesky).toContain("%23Nerdiction");
      expect(urls.mastodon).toContain("%23Nerdiction");
    });

    it("handles different content types", () => {
      const collectionParams = { ...baseParams, contentType: "COLLECTION" as const };
      const urls = buildShareUrls(collectionParams);
      expect(urls.copyLink).toBe(collectionParams.url);
    });

    it("handles missing optional fields", () => {
      const minimalParams = {
        contentType: "REVIEW" as const,
        contentId: "review-1",
        title: "Minimal Review",
        url: "https://nerdiction.de/reviews/minimal",
      };
      const urls = buildShareUrls(minimalParams);

      expect(urls.twitter).toContain("Minimal%20Review");
      expect(urls.copyLink).toBe(minimalParams.url);
    });

    it("handles special characters in title", () => {
      const specialParams = {
        ...baseParams,
        title: "Test & Game's Review: 100% Awesome!",
      };
      const urls = buildShareUrls(specialParams);

      expect(urls.twitter).toContain("Test%20%26%20Game's%20Review%3A%20100%25%20Awesome!");
    });
  });

  describe("getPlatformDisplayName", () => {
    it("returns correct display names", () => {
      expect(getPlatformDisplayName("TWITTER")).toBe("Twitter/X");
      expect(getPlatformDisplayName("BLUESKY")).toBe("Bluesky");
      expect(getPlatformDisplayName("MASTODON")).toBe("Mastodon");
      expect(getPlatformDisplayName("REDDIT")).toBe("Reddit");
      expect(getPlatformDisplayName("DISCORD")).toBe("Discord");
      expect(getPlatformDisplayName("COPY_LINK")).toBe("Link kopieren");
    });
  });

  describe("getPlatformIcon", () => {
    it("returns correct icon names", () => {
      expect(getPlatformIcon("TWITTER")).toBe("Twitter");
      expect(getPlatformIcon("BLUESKY")).toBe("MessageSquare");
      expect(getPlatformIcon("MASTODON")).toBe("Globe");
      expect(getPlatformIcon("REDDIT")).toBe("Reddit");
      expect(getPlatformIcon("DISCORD")).toBe("MessageCircle");
      expect(getPlatformIcon("COPY_LINK")).toBe("Link2");
    });
  });

  describe("getDefaultShareText", () => {
    it("returns content-type specific text", () => {
      expect(getDefaultShareText("REVIEW", "Test Review")).toContain("Review");
      expect(getDefaultShareText("COLLECTION", "Test Collection")).toContain("Liste");
      expect(getDefaultShareText("SERIES", "Test Series")).toContain("Serie");
      expect(getDefaultShareText("PROFILE", "TestUser")).toContain("Folge");
    });
  });

  describe("truncateText", () => {
    it("returns original text if under limit", () => {
      expect(truncateText("short", 10)).toBe("short");
    });

    it("truncates and adds suffix when over limit", () => {
      expect(truncateText("this is a very long text", 10)).toBe("this is a…");
    });

    it("uses custom suffix", () => {
      expect(truncateText("long text", 5, "...")).toBe("lo...");
    });

    it("handles exact length", () => {
      expect(truncateText("exact", 5)).toBe("exact");
    });
  });

  describe("buildHashtags", () => {
    it("includes base tags and custom tags", () => {
      const tags = buildHashtags(["Action", "RPG"]);
      expect(tags).toContain("#Nerdiction");
      expect(tags).toContain("#Gaming");
      expect(tags).toContain("#Review");
      expect(tags).toContain("#Action");
      expect(tags).toContain("#RPG");
    });

    it("limits to 5 tags total", () => {
      const tags = buildHashtags(["A", "B", "C", "D", "E", "F"]);
      const count = (tags.match(/#/g) || []).length;
      expect(count).toBe(5);
    });

    it("removes spaces from tags", () => {
      const tags = buildHashtags(["Open World"]);
      expect(tags).toContain("#OpenWorld");
    });

    it("handles empty tags array", () => {
      const tags = buildHashtags([]);
      expect(tags).toContain("#Nerdiction");
      expect(tags).toContain("#Gaming");
      expect(tags).toContain("#Review");
    });
  });

  describe("Twitter length limit", () => {
    it("truncates to 280 chars for Twitter", () => {
      const longTitle = "A".repeat(300);
      const params = { ...baseParams, title: longTitle };
      const urls = buildShareUrls(params);

      const twitterUrl = new URL(urls.twitter);
      const textParam = twitterUrl.searchParams.get("text") || "";
      expect(textParam.length).toBeLessThanOrEqual(280);
    });
  });

  describe("Mastodon length limit", () => {
    it("truncates to 500 chars for Mastodon", () => {
      const longTitle = "A".repeat(600);
      const params = { ...baseParams, title: longTitle };
      const urls = buildShareUrls(params);

      const mastodonUrl = new URL(urls.mastodon);
      const textParam = mastodonUrl.searchParams.get("text") || "";
      expect(textParam.length).toBeLessThanOrEqual(500);
    });
  });

  describe("Bluesky length limit", () => {
    it("truncates to 300 chars for Bluesky", () => {
      const longTitle = "A".repeat(400);
      const params = { ...baseParams, title: longTitle };
      const urls = buildShareUrls(params);

      const blueskyUrl = new URL(urls.bluesky);
      const textParam = blueskyUrl.searchParams.get("text") || "";
      expect(textParam.length).toBeLessThanOrEqual(300);
    });
  });
});