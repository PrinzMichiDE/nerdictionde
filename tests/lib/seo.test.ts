import { describe, it, expect } from "vitest";
import {
  plainText,
  generateReviewSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateItemListSchema,
  generateArticleSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
} from "@/lib/seo";

describe("plainText", () => {
  it("entfernt Markdown und normalisiert Leerzeichen", () => {
    expect(plainText("# Hallo Welt")).toBe("Hallo Welt");
    expect(plainText("**fett** und *kursiv*")).toBe("fett und kursiv");
    expect(plainText("Link [Text](http://x.de)")).toBe("Link Text");
    expect(plainText("Bild ![Alt](http://x.de/img.png)")).toBe("Bild");
  });

  it("kuerzt auf maxLen mit Punkte", () => {
    const long = "a".repeat(500);
    const result = plainText(long, 10);
    expect(result).toBe("aaaaaaa...");
    expect(result.length).toBe(10);
  });

  it("liefert leeren String bei leerem Input", () => {
    expect(plainText("")).toBe("");
  });
});

describe("generateReviewSchema", () => {
  it("generiert ein valides Review-Schema", () => {
    const result = generateReviewSchema({
      slug: "test-review",
      title: "Testspiel",
      category: "game",
      score: 85,
      content: "# Testspiel\n\nEin großartiges Spiel.",
      images: ["https://example.com/img.png"],
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-02T00:00:00Z"),
    });

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("Review");
    expect(result.headline).toBe("Testspiel");
    expect(result.reviewRating.ratingValue).toBe(85);
    expect(result.itemReviewed["@type"]).toBe("VideoGame");
    expect(result.reviewBody).toContain("Testspiel");
    expect(result.reviewBody).toContain("großartiges Spiel");
  });

  it("mapt Kategorien auf Schema.org-Typen", () => {
    const game = generateReviewSchema({
      slug: "s", title: "T", category: "game", score: 0, content: "c",
    });
    expect(game.itemReviewed["@type"]).toBe("VideoGame");

    const movie = generateReviewSchema({
      slug: "s", title: "T", category: "movie", score: 0, content: "c",
    });
    expect(movie.itemReviewed["@type"]).toBe("Movie");

    const series = generateReviewSchema({
      slug: "s", title: "T", category: "series", score: 0, content: "c",
    });
    expect(series.itemReviewed["@type"]).toBe("TVSeries");

    const hardware = generateReviewSchema({
      slug: "s", title: "T", category: "hardware", score: 0, content: "c",
    });
    expect(hardware.itemReviewed["@type"]).toBe("Product");
  });
});

describe("generateFAQSchema", () => {
  it("generiert ein FAQPage-Schema", () => {
    const result = generateFAQSchema([
      { question: "F1?", answer: "A1" },
      { question: "F2?", answer: "A2" },
    ]);

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("FAQPage");
    expect(result.mainEntity).toHaveLength(2);
    expect(result.mainEntity[0]["@type"]).toBe("Question");
    expect(result.mainEntity[0].name).toBe("F1?");
    expect(result.mainEntity[0].acceptedAnswer.text).toBe("A1");
  });
});

describe("generateBreadcrumbSchema", () => {
  it("generiert ein BreadcrumbList-Schema", () => {
    const result = generateBreadcrumbSchema([
      { name: "Start", url: "/" },
      { name: "Reviews", url: "/reviews" },
    ]);

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("BreadcrumbList");
    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[0].name).toBe("Start");
    expect(result.itemListElement[1].position).toBe(2);
  });
});

describe("generateItemListSchema", () => {
  it("generiert ein ItemList-Schema", () => {
    const result = generateItemListSchema([
      { name: "Item 1", url: "/1", image: "/img1.png" },
      { name: "Item 2", url: "/2" },
    ]);

    expect(result["@type"]).toBe("ItemList");
    expect(result.itemListElement).toHaveLength(2);
    expect(result.itemListElement[0].image).toBe("/img1.png");
    expect(result.itemListElement[1].image).toBeUndefined();
  });
});

describe("generateArticleSchema", () => {
  it("generiert ein NewsArticle-Schema", () => {
    const result = generateArticleSchema({
      headline: "Neuheit",
      description: "Eine Neuigkeit",
      url: "https://example.com/news",
      datePublished: "2026-01-01T00:00:00Z",
      dateModified: "2026-01-02T00:00:00Z",
    });

    expect(result["@type"]).toBe("NewsArticle");
    expect(result.headline).toBe("Neuheit");
    expect(result.inLanguage).toBe("de-DE");
    expect(result.publisher.name).toBe("Nerdiction");
  });
});

describe("generateOrganizationSchema", () => {
  it("generiert ein Organization-Schema", () => {
    const result = generateOrganizationSchema();

    expect(result["@type"]).toBe("Organization");
    expect(result.name).toBe("Nerdiction");
    expect(result.logo["@type"]).toBe("ImageObject");
    expect(result.logo.width).toBe(512);
  });
});

describe("generateWebsiteSchema", () => {
  it("generiert ein WebSite-Schema mit Suchaktion", () => {
    const result = generateWebsiteSchema();

    expect(result["@type"]).toBe("WebSite");
    expect(result.name).toBe("Nerdiction");
    expect(result.potentialAction["@type"]).toBe("SearchAction");
    expect(result.potentialAction.target.urlTemplate).toContain("{search_term_string}");
  });
});
