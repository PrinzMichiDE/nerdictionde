import type { ReviewShape, SpecRow, PricePoint, YouTubeVideo } from "./review-compare-types";

const SLUG_REGEX = /^[a-z0-9-]+$/;
const YOUTUBE_REGEX = /(?:(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function parseCompareIds(
  idsParam: string | null | undefined,
  aParam: string | null | undefined,
  bParam: string | null | undefined,
  cParam: string | null | undefined = null
): string[] {
  const slugs: string[] = [];

  if (idsParam) {
    slugs.push(
      ...idsParam
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && SLUG_REGEX.test(s))
    );
  }

  if (slugs.length === 0) {
    if (aParam && SLUG_REGEX.test(aParam)) slugs.push(aParam);
    if (bParam && SLUG_REGEX.test(bParam) && bParam !== aParam) slugs.push(bParam);
    if (cParam && SLUG_REGEX.test(cParam) && cParam !== aParam && cParam !== bParam) slugs.push(cParam);
  }

  const unique = [...new Set(slugs)];
  return unique.slice(0, 3);
}

export function validateSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

export function getSpecsUnion(reviews: ReviewShape[]): SpecRow[][] {
  const allKeys = new Set<string>();

  for (const review of reviews) {
    if (review.specs && typeof review.specs === "object" && review.specs !== null) {
      for (const key of Object.keys(review.specs as Record<string, unknown>)) {
        allKeys.add(key);
      }
    }
    if (review.metadata && typeof review.metadata === "object" && review.metadata !== null) {
      const meta = review.metadata as Record<string, unknown>;
      const relevantKeys = ["developer", "publisher", "genres", "platforms", "gameModes", "modes"];
      for (const key of relevantKeys) {
        if (key in meta) allKeys.add(key);
      }
    }
  }

  const sortedKeys = [...allKeys].sort((a, b) => a.localeCompare(b));

  return reviews.map((review) =>
    sortedKeys.map((key) => {
      let value: unknown = "–";

      if (review.specs && typeof review.specs === "object" && review.specs !== null) {
        const specs = review.specs as Record<string, unknown>;
        if (key in specs) value = specs[key];
      }

      if (value === "–" && review.metadata && typeof review.metadata === "object" && review.metadata !== null) {
        const meta = review.metadata as Record<string, unknown>;
        const metaKeyMap: Record<string, string> = {
          developer: "developer",
          publisher: "publisher",
          genres: "genres",
          platforms: "platforms",
          gameModes: "gameModes",
          modes: "modes",
        };
        const metaKey = metaKeyMap[key];
        if (metaKey && metaKey in meta) value = meta[metaKey];
      }

      const formattedValue = formatSpecValue(value);
      return { label: formatSpecLabel(key), value: formattedValue };
    })
  );
}

function formatSpecLabel(key: string): string {
  const labelMap: Record<string, string> = {
    cpu: "Prozessor (CPU)",
    gpu: "Grafikkarte (GPU)",
    ram: "Arbeitsspeicher (RAM)",
    storage: "Speicherplatz",
    os: "Betriebssystem",
    resolution: "Auflösung",
    fps: "Ziel-FPS",
    developer: "Entwickler",
    publisher: "Publisher",
    genres: "Genres",
    platforms: "Plattformen",
    gameModes: "Spielmodi",
    modes: "Modi",
  };
  return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
}

function formatSpecValue(value: unknown): string {
  if (value === null || value === undefined) return "–";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function formatPriceHistoryForDisplay(history: ReviewShape["priceHistory"]): PricePoint[] {
  return history
    .slice()
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, 5)
    .map((item) => ({
      date: new Date(item.recordedAt),
      price: item.price,
      source: item.source,
      currency: item.currency,
    }));
}

export function extractYouTubeId(input: string): string | null {
  const match = input.match(YOUTUBE_REGEX);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  return null;
}

export function getYouTubeVideos(videos: string[]): YouTubeVideo[] {
  return videos
    .map((v) => {
      const id = extractYouTubeId(v);
      if (!id) return null;
      return {
        id,
        url: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
        thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      };
    })
    .filter((v): v is YouTubeVideo => v !== null);
}

export function computeScoreCompareData(reviews: ReviewShape[]) {
  const scores = reviews.map((r) => r.score);
  const labels = reviews.map((r) => r.title);
  const average = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return {
    scores,
    labels,
    average,
    diffs: scores.map((s) => (average !== null ? s - average : 0)),
  };
}