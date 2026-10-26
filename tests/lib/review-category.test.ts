import { describe, it, expect } from "vitest";
import {
  getCategoryStyle,
  getVerdict,
  getScoreColor,
  stripMarkdown,
} from "@/lib/review-category";

describe("getCategoryStyle", () => {
  it("liefert den Stil für bekannte Kategorien", () => {
    expect(getCategoryStyle("game")).toEqual({
      label: "Games",
      dot: "var(--chart-3)",
      color: "var(--chart-3)",
    });
    expect(getCategoryStyle("movie")).toEqual({
      label: "Filme",
      dot: "var(--chart-2)",
      color: "var(--chart-2)",
    });
    expect(getCategoryStyle("series")).toEqual({
      label: "Serien",
      dot: "var(--chart-5)",
      color: "var(--chart-5)",
    });
    expect(getCategoryStyle("hardware")).toEqual({
      label: "Hardware",
      dot: "var(--chart-1)",
      color: "var(--chart-1)",
    });
  });

  it("fällt auf einen Default-Stil zurück für unbekannte Kategorien", () => {
    const style = getCategoryStyle("unbekannt");
    expect(style.label).toBe("Unbekannt");
    expect(style.dot).toBe("var(--primary)");
    expect(style.color).toBe("var(--primary)");
  });
});

describe("getVerdict", () => {
  it("teilt die Wertung in deutsche Verdikte ein", () => {
    expect(getVerdict(100)).toBe("Phänomenal");
    expect(getVerdict(90)).toBe("Phänomenal");
    expect(getVerdict(89)).toBe("Hervorragend");
    expect(getVerdict(80)).toBe("Hervorragend");
    expect(getVerdict(79)).toBe("Gut");
    expect(getVerdict(70)).toBe("Gut");
    expect(getVerdict(69)).toBe("Solide");
    expect(getVerdict(60)).toBe("Solide");
    expect(getVerdict(59)).toBe("Mittelmaß");
    expect(getVerdict(50)).toBe("Mittelmaß");
    expect(getVerdict(49)).toBe("Enttäuschend");
    expect(getVerdict(0)).toBe("Enttäuschend");
  });
});

describe("getScoreColor", () => {
  it("liefert die Farbe basierend auf der Wertung", () => {
    expect(getScoreColor(100)).toBe("var(--chart-3)");
    expect(getScoreColor(90)).toBe("var(--chart-3)");
    expect(getScoreColor(89)).toBe("var(--chart-2)");
    expect(getScoreColor(75)).toBe("var(--chart-2)");
    expect(getScoreColor(74)).toBe("var(--chart-4)");
    expect(getScoreColor(50)).toBe("var(--chart-4)");
    expect(getScoreColor(49)).toBe("var(--chart-1)");
    expect(getScoreColor(25)).toBe("var(--chart-1)");
    expect(getScoreColor(24)).toBe("var(--destructive)");
    expect(getScoreColor(0)).toBe("var(--destructive)");
  });
});

describe("stripMarkdown", () => {
  it("entfernt Markdown-Zeichen und normalisiert Leerzeichen", () => {
    expect(stripMarkdown("# Hallo Welt")).toBe("Hallo Welt");
    expect(stripMarkdown("**fett** und *kursiv*")).toBe("fett und kursiv");
    expect(stripMarkdown("Zeile > Zitat")).toBe("Zeile Zitat");
    expect(stripMarkdown("  doppelte   Leerzeichen  ")).toBe("doppelte Leerzeichen");
    expect(stripMarkdown("")).toBe("");
  });
});
