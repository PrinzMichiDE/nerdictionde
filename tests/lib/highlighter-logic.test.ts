import { describe, it, expect } from "vitest";

/**
 * Tests for the highlight logic extracted from Highlighter component.
 * This mirrors the useMemo computation in the component.
 */
function computeHighlights(text: string, query: string): Array<{ text: string; highlight: boolean }> {
  if (!query || !query.trim() || !text) return [{ text, highlight: false }];

  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (terms.length === 0) return [{ text, highlight: false }];

  const regex = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part) => {
    const isHighlight = regex.test(part);
    return { text: part, highlight: isHighlight };
  });
}

describe("Highlighter logic (computeHighlights)", () => {
  it("returns plain text when query is empty", () => {
    const result = computeHighlights("Cyberpunk 2077 Review", "");
    expect(result).toEqual([{ text: "Cyberpunk 2077 Review", highlight: false }]);
  });

  it("returns plain text when query is whitespace only", () => {
    const result = computeHighlights("Cyberpunk 2077 Review", "   ");
    expect(result).toEqual([{ text: "Cyberpunk 2077 Review", highlight: false }]);
  });

  it("returns plain text when text is empty", () => {
    const result = computeHighlights("", "Cyberpunk");
    expect(result).toEqual([{ text: "", highlight: false }]);
  });

  it("highlights a single term in the text", () => {
    const result = computeHighlights("Cyberpunk 2077 Review", "Cyberpunk");
    // Split regex creates empty string at start when text starts with match
    expect(result).toEqual([
      { text: "", highlight: false },
      { text: "Cyberpunk", highlight: true },
      { text: " 2077 Review", highlight: false },
    ]);
  });

  it("highlights multiple occurrences of the same term", () => {
    const result = computeHighlights("Cyberpunk 2077 Cyberpunk Review", "Cyberpunk");
    expect(result).toEqual([
      { text: "", highlight: false },
      { text: "Cyberpunk", highlight: true },
      { text: " 2077 ", highlight: false },
      { text: "Cyberpunk", highlight: true },
      { text: " Review", highlight: false },
    ]);
  });

  it("highlights multiple different terms", () => {
    const result = computeHighlights("Cyberpunk 2077 RPG Review", "Cyberpunk RPG");
    const highlighted = result.filter((r) => r.highlight);
    expect(highlighted).toHaveLength(2);
    const texts = highlighted.map((h) => h.text);
    expect(texts).toContain("Cyberpunk");
    expect(texts).toContain("RPG");
  });

  it("is case-insensitive", () => {
    const result = computeHighlights("CYBERPUNK 2077 Review", "cyberpunk");
    const highlighted = result.filter((r) => r.highlight);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].text).toBe("CYBERPUNK");
  });

  it("escapes special regex characters in query", () => {
    const result = computeHighlights("C++ Programming", "C++");
    const highlighted = result.filter((r) => r.highlight);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].text).toBe("C++");
  });

  it("filters out single character terms", () => {
    const result = computeHighlights("A Game", "a");
    expect(result).toEqual([{ text: "A Game", highlight: false }]);
  });

  it("handles terms with spaces correctly", () => {
    const result = computeHighlights("The Witcher 3 Wild Hunt", "The Witcher");
    // Terms are split by whitespace, so "The" and "Witcher" are matched separately
    const highlighted = result.filter((r) => r.highlight);
    expect(highlighted).toHaveLength(2);
    const texts = highlighted.map((h) => h.text);
    expect(texts).toContain("The");
    expect(texts).toContain("Witcher");
  });

  it("preserves text around highlights", () => {
    const result = computeHighlights("Review of Cyberpunk 2077 game", "Cyberpunk");
    const highlighted = result.filter((r) => r.highlight);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].text).toBe("Cyberpunk");
    const nonHighlighted = result.filter((r) => !r.highlight).map((r) => r.text).join("");
    expect(nonHighlighted).toBe("Review of  2077 game");
  });

  it("handles overlapping terms correctly", () => {
    const result = computeHighlights("Cyberpunk 2077", "Cyberpunk 2077");
    const highlighted = result.filter((r) => r.highlight);
    expect(highlighted.length).toBeGreaterThan(0);
  });

  it("handles query with multiple spaces", () => {
    const result = computeHighlights("Cyberpunk 2077 Review", "  Cyberpunk   Review  ");
    const highlighted = result.filter((r) => r.highlight);
    expect(highlighted).toHaveLength(2);
    const texts = highlighted.map((h) => h.text);
    expect(texts).toContain("Cyberpunk");
    expect(texts).toContain("Review");
  });

  it("handles unicode characters in query and text", () => {
    const result = computeHighlights("Überraschung Cyberpunk 2077", "Überraschung");
    const highlighted = result.filter((r) => r.highlight);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0].text).toBe("Überraschung");
  });
});