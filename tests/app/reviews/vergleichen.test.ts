import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseCompareIds, getSpecsUnion, formatPriceHistoryForDisplay, getYouTubeVideos, computeScoreCompareData } from "@/lib/review-compare";

describe("Review Compare Utilities", () => {
  describe("parseCompareIds", () => {
    it("parst IDs korrekt aus ids-Parameter", () => {
      const result = parseCompareIds("slug1,slug2,slug3", null, null);
      expect(result).toEqual(["slug1", "slug2", "slug3"]);
    });

    it("behandelt a/b Parameter als Fallback", () => {
      const result = parseCompareIds(null, "slug-a", "slug-b");
      expect(result).toEqual(["slug-a", "slug-b"]);
    });

    it("ignoriert ungültige Slugs", () => {
      const result = parseCompareIds("valid,INVALID,also-valid", null, null);
      expect(result).toEqual(["valid", "also-valid"]);
    });

    it("begrenzt auf maximal 3 Reviews", () => {
      const result = parseCompareIds("slug1,slug2,slug3,slug4,slug5", null, null);
      expect(result).toEqual(["slug1", "slug2", "slug3"]);
    });

    it("entfernt Duplikate", () => {
      const result = parseCompareIds("slug1,slug1,slug2", null, null);
      expect(result).toEqual(["slug1", "slug2"]);
    });

    it("ids-Parameter hat Vorrang vor a/b", () => {
      const result = parseCompareIds("ids-slug", "a-slug", "b-slug");
      expect(result).toEqual(["ids-slug"]);
    });
  });

  describe("getSpecsUnion", () => {
    const baseReview = {
      id: "1",
      title: "Test",
      slug: "test",
      category: "game",
      score: 80,
      pros: [],
      cons: [],
      images: [],
      releaseDate: null,
      specs: null,
      metadata: null,
      priceHistory: [],
      deals: [],
      youtubeVideos: [],
    };

    it("gibt leeres Array für Reviews ohne Specs zurück", () => {
      const result = getSpecsUnion([baseReview]);
      expect(result[0]).toEqual([]);
    });

    it("vereinigt Keys aus specs und metadata", () => {
      const review = { ...baseReview, specs: { cpu: "Intel i5" }, metadata: { developer: "Dev Studio", genres: ["Action"] } };
      const result = getSpecsUnion([review]);
      const labels = result[0].map((r) => r.label);
      expect(labels).toContain("Prozessor (CPU)");
      expect(labels).toContain("Entwickler");
      expect(labels).toContain("Genres");
    });

    it("Union über mehrere Reviews", () => {
      const r1 = { ...baseReview, id: "1", specs: { cpu: "Intel i5" } };
      const r2 = { ...baseReview, id: "2", specs: { gpu: "RTX 3080" } };
      const result = getSpecsUnion([r1, r2]);
      const labels1 = result[0].map((r) => r.label);
      const labels2 = result[1].map((r) => r.label);
      expect(labels1).toContain("Prozessor (CPU)");
      expect(labels1).toContain("Grafikkarte (GPU)");
      expect(labels2).toContain("Prozessor (CPU)");
      expect(labels2).toContain("Grafikkarte (GPU)");
    });
  });

  describe("formatPriceHistoryForDisplay", () => {
    it("sortiert nach Datum absteigend und limitiert auf 5", () => {
      const history = [
        { id: "1", price: 50, currency: "EUR", source: "Steam", url: null, recordedAt: new Date("2024-01-01") },
        { id: "2", price: 40, currency: "EUR", source: "Steam", url: null, recordedAt: new Date("2024-01-03") },
        { id: "3", price: 45, currency: "EUR", source: "Steam", url: null, recordedAt: new Date("2024-01-02") },
      ];
      const result = formatPriceHistoryForDisplay(history);
      expect(result.length).toBe(3);
      expect(result[0].price).toBe(40);
      expect(result[1].price).toBe(45);
      expect(result[2].price).toBe(50);
    });

    it("leeres Array gibt leeres Array zurück", () => {
      expect(formatPriceHistoryForDisplay([])).toEqual([]);
    });
  });

  describe("getYouTubeVideos", () => {
    it("wandelt URLs in YouTubeVideo Objects um", () => {
      const videos = ["https://www.youtube.com/watch?v=abc123def45", "https://youtu.be/def456ghi78"];
      const result = getYouTubeVideos(videos);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("abc123def45");
      expect(result[0].url).toContain("abc123def45");
      expect(result[0].thumbnailUrl).toContain("abc123def45");
    });

    it("filtert ungültige Einträge heraus", () => {
      const videos = ["https://www.youtube.com/watch?v=validideoid", "invalid", "not-a-youtube-id"];
      const result = getYouTubeVideos(videos);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("validideoid");
    });
  });

  describe("computeScoreCompareData", () => {
    const baseReview = {
      id: "1",
      title: "Review 1",
      slug: "r1",
      category: "game",
      score: 80,
      pros: [],
      cons: [],
      images: [],
      releaseDate: null,
      specs: null,
      metadata: null,
      priceHistory: [],
      deals: [],
      youtubeVideos: [],
    };

    it("berechnet Scores, Labels, Average und Diffs für 2 Reviews", () => {
      const r1 = { ...baseReview, id: "1", title: "Game A", score: 85 };
      const r2 = { ...baseReview, id: "2", title: "Game B", score: 75 };
      const result = computeScoreCompareData([r1, r2]);
      expect(result.scores).toEqual([85, 75]);
      expect(result.labels).toEqual(["Game A", "Game B"]);
      expect(result.average).toBe(80);
      expect(result.diffs).toEqual([5, -5]);
    });

    it("berechnet für 3 Reviews", () => {
      const r1 = { ...baseReview, id: "1", title: "A", score: 90 };
      const r2 = { ...baseReview, id: "2", title: "B", score: 80 };
      const r3 = { ...baseReview, id: "3", title: "C", score: 70 };
      const result = computeScoreCompareData([r1, r2, r3]);
      expect(result.scores).toEqual([90, 80, 70]);
      expect(result.average).toBe(80);
      expect(result.diffs).toEqual([10, 0, -10]);
    });

    it("ein Review", () => {
      const r1 = { ...baseReview, id: "1", title: "Solo", score: 88 };
      const result = computeScoreCompareData([r1]);
      expect(result.scores).toEqual([88]);
      expect(result.average).toBe(88);
      expect(result.diffs).toEqual([0]);
    });
  });
});