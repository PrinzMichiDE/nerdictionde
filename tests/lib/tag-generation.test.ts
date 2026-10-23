import { describe, it, expect } from "vitest";
import { slugFromName, tagsFromMetadata } from "@/lib/tag-generation";

describe("slugFromName", () => {
  it("wandelt einen Titel in einen URL-slug um", () => {
    expect(slugFromName("Hello World")).toBe("hello-world");
    expect(slugFromName("GTX 4090")).toBe("gtx-4090");
    expect(slugFromName("  Leading/Trailing  ")).toBe("leading-trailing");
    expect(slugFromName("Multiple---Dashes")).toBe("multiple-dashes");
  });

  it("entfernt Diakritika", () => {
    expect(slugFromName("Café au Lait")).toBe("cafe-au-lait");
    expect(slugFromName("München")).toBe("munchen");
  });

  it("liefert einen leeren Slug für reine Sonderzeichen", () => {
    expect(slugFromName("")).toBe("");
    expect(slugFromName("___")).toBe("");
  });
});

describe("tagsFromMetadata", () => {
  it("liefert leeres Array ohne Metadaten und ohne Score-Tag", () => {
    expect(tagsFromMetadata({ reviewTitle: "Test", category: "game", score: 50 })).toEqual([]);
  });

  it("nimmt bis zu 4 Genres und scorebasierte Tags", () => {
    const result = tagsFromMetadata({
      reviewTitle: "Test",
      category: "game",
      score: 95,
      metadata: { genres: ["Action", "RPG", "Open World", "Sci-Fi", "Adventure"] },
    });
    expect(result).toContain("Must-Have");
    expect(result).toContain("Action");
    expect(result).toContain("RPG");
    expect(result).toContain("Open World");
    expect(result).toContain("Sci-Fi");
    expect(result.length).toBeLessThanOrEqual(8);
  });

  it("fuegt erste Plattform als Tag hinzu", () => {
    const result = tagsFromMetadata({
      reviewTitle: "Test",
      category: "game",
      score: 85,
      metadata: { platforms: ["PC", "PlayStation 5"] },
    });
    expect(result).toContain("PC");
    expect(result).toContain("Empfehlung");
  });

  it("ordnet Score-Stufen zu", () => {
    expect(tagsFromMetadata({ reviewTitle: "T", category: "c", score: 49 })).toContain("Kritisch");
    expect(tagsFromMetadata({ reviewTitle: "T", category: "c", score: 70 })).toContain("Solide");
    expect(tagsFromMetadata({ reviewTitle: "T", category: "c", score: 80 })).toContain("Empfehlung");
    expect(tagsFromMetadata({ reviewTitle: "T", category: "c", score: 90 })).toContain("Must-Have");
  });

  it("doppelte Tags entfernt und auf 8 begrenzt", () => {
    const result = tagsFromMetadata({
      reviewTitle: "T",
      category: "c",
      score: 95,
      metadata: { genres: ["Action", "Action", "RPG"] },
    });
    expect(result.filter((t) => t === "Action").length).toBe(1);
    expect(result.length).toBeLessThanOrEqual(8);
  });
});
