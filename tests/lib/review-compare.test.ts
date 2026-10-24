import { describe, it, expect } from "vitest";
import {
  parseCompareIds,
  validateSlug,
  getSpecsUnion,
  formatPriceHistoryForDisplay,
  extractYouTubeId,
  getYouTubeVideos,
  computeScoreCompareData,
} from "@/lib/review-compare";

describe("parseCompareIds", () => {
  it("parst kommagetrennte IDs aus ids-Parameter", () => {
    expect(parseCompareIds("slug1,slug2,slug3", null, null)).toEqual(["slug1", "slug2", "slug3"]);
  });

  it("entfernt Duplikate", () => {
    expect(parseCompareIds("slug1,slug1,slug2", null, null)).toEqual(["slug1", "slug2"]);
  });

  it("begrenzt auf maximal 3", () => {
    expect(parseCompareIds("slug1,slug2,slug3,slug4,slug5", null, null)).toEqual(["slug1", "slug2", "slug3"]);
  });

  it("fallback auf a/b Parameter", () => {
    expect(parseCompareIds(null, "slug-a", "slug-b")).toEqual(["slug-a", "slug-b"]);
  });

  it("ids-Parameter hat Vorrang vor a/b", () => {
    expect(parseCompareIds("ids-slug", "a-slug", "b-slug")).toEqual(["ids-slug"]);
  });

  it("ignoriert ungültige Slugs", () => {
    expect(parseCompareIds("valid,INVALID,also-valid", null, null)).toEqual(["valid", "also-valid"]);
  });

  it("leere Strings werden ignoriert", () => {
    expect(parseCompareIds("slug1,,slug2", null, null)).toEqual(["slug1", "slug2"]);
  });

  it("nur a Parameter", () => {
    expect(parseCompareIds(null, "only-a", null)).toEqual(["only-a"]);
  });
});

describe("validateSlug", () => {
  it("gültige Slugs", () => {
    expect(validateSlug("valid-slug")).toBe(true);
    expect(validateSlug("slug123")).toBe(true);
    expect(validateSlug("a")).toBe(true);
  });

  it("ungültige Slugs", () => {
    expect(validateSlug("Invalid")).toBe(false);
    expect(validateSlug("slug_name")).toBe(false);
    expect(validateSlug("slug.name")).toBe(false);
    expect(validateSlug("")).toBe(false);
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

  it("vereinigt Keys aus specs", () => {
    const review = { ...baseReview, specs: { cpu: "Intel i5", ram: "16 GB" } };
    const result = getSpecsUnion([review]);
    expect(result[0].map((r) => r.label)).toContain("Prozessor (CPU)");
    expect(result[0].map((r) => r.label)).toContain("Arbeitsspeicher (RAM)");
  });

  it("vereinigt Keys aus metadata (developer, publisher, etc.)", () => {
    const review = {
      ...baseReview,
      metadata: { developer: "Dev Studio", publisher: "Pub Co", genres: ["Action", "RPG"] },
    };
    const result = getSpecsUnion([review]);
    const labels = result[0].map((r) => r.label);
    expect(labels).toContain("Entwickler");
    expect(labels).toContain("Publisher");
    expect(labels).toContain("Genres");
  });

  it("Union über mehrere Reviews", () => {
    const r1 = { ...baseReview, id: "1", specs: { cpu: "Intel i5" } };
    const r2 = { ...baseReview, id: "2", specs: { gpu: "RTX 3080" } };
    const result = getSpecsUnion([r1, r2]);
    expect(result[0].map((r) => r.label)).toContain("Prozessor (CPU)");
    expect(result[0].map((r) => r.label)).toContain("Grafikkarte (GPU)");
    expect(result[1].map((r) => r.label)).toContain("Prozessor (CPU)");
    expect(result[1].map((r) => r.label)).toContain("Grafikkarte (GPU)");
  });

  it("fehlende Werte zeigen '–'", () => {
    const r1 = { ...baseReview, id: "1", specs: { cpu: "Intel i5" } };
    const r2 = { ...baseReview, id: "2", specs: { gpu: "RTX 3080" } };
    const result = getSpecsUnion([r1, r2]);
    const cpuRow1 = result[0].find((r) => r.label === "Prozessor (CPU)");
    const gpuRow1 = result[0].find((r) => r.label === "Grafikkarte (GPU)");
    const cpuRow2 = result[1].find((r) => r.label === "Prozessor (CPU)");
    const gpuRow2 = result[1].find((r) => r.label === "Grafikkarte (GPU)");
    expect(cpuRow1?.value).toBe("Intel i5");
    expect(gpuRow1?.value).toBe("–");
    expect(cpuRow2?.value).toBe("–");
    expect(gpuRow2?.value).toBe("RTX 3080");
  });
});

describe("formatPriceHistoryForDisplay", () => {
  it("sortiert nach Datum absteigend und limitiert auf 5", () => {
    const history = [
      { id: "1", price: 50, currency: "EUR", source: "Steam", url: null, recordedAt: new Date("2024-01-01T00:00:00Z") },
      { id: "2", price: 40, currency: "EUR", source: "Steam", url: null, recordedAt: new Date("2024-01-03T00:00:00Z") },
      { id: "3", price: 45, currency: "EUR", source: "Steam", url: null, recordedAt: new Date("2024-01-02T00:00:00Z") },
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

describe("extractYouTubeId", () => {
  it("extrahiert ID aus youtube.com/watch?v=", () => {
    expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extrahiert ID aus youtu.be/", () => {
    expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extrahiert ID aus youtube.com/embed/", () => {
    expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("akzeptiert reine Video-ID", () => {
    expect(extractYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("gibt null für ungültige URLs", () => {
    expect(extractYouTubeId("https://example.com/video")).toBeNull();
    expect(extractYouTubeId("")).toBeNull();
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

  it("leeres Array", () => {
    const result = computeScoreCompareData([]);
    expect(result.scores).toEqual([]);
    expect(result.average).toBeNull();
    expect(result.diffs).toEqual([]);
  });
});