import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculatePublicationDate } from "@/lib/date-utils";

const now = new Date("2026-01-15T12:00:00Z");

describe("calculatePublicationDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("gibt ein Datum zwischen 01.01.2022 und jetzt zurück, wenn kein Release-Datum übergeben wird", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = calculatePublicationDate();

    const start = new Date("2022-01-01T00:00:00Z").getTime();
    const end = now.getTime();
    const expected = new Date(start + 0.5 * (end - start));

    expect(result.getTime()).toBe(expected.getTime());
    expect(result >= new Date("2022-01-01T00:00:00Z")).toBe(true);
    expect(result <= now).toBe(true);
  });

  it("liefert 3-6 Tage nach Release für Titel ab 2023", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // → 3 Tage

    const releaseTimestamp = Math.floor(
      new Date("2024-06-01T00:00:00Z").getTime() / 1000,
    );
    const result = calculatePublicationDate(releaseTimestamp);

    const expected = new Date("2024-06-04T00:00:00Z");
    expect(result.getTime()).toBe(expected.getTime());
  });

  it("begrenzt auf 'jetzt', wenn das berechnete Datum in der Zukunft liegt", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99); // → 6 Tage

    const releaseTimestamp = Math.floor(now.getTime() / 1000);
    const result = calculatePublicationDate(releaseTimestamp);

    expect(result.getTime()).toBe(now.getTime());
  });

  it("gibt ein Datum zwischen 2022 und jetzt für Titel vor 2023 zurück", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.3);

    const releaseTimestamp = Math.floor(
      new Date("2021-01-01T00:00:00Z").getTime() / 1000,
    );
    const result = calculatePublicationDate(releaseTimestamp);

    const start = new Date("2022-01-01T00:00:00Z").getTime();
    const end = now.getTime();
    const expected = new Date(start + 0.3 * (end - start));

    expect(result.getTime()).toBe(expected.getTime());
  });
});
