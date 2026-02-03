/**
 * Extract YouTube video IDs from various data sources (IGDB, TMDB, Tavily)
 * for automatic attachment to reviews.
 */

const YOUTUBE_ID_REGEX = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/g;
const YOUTUBE_ID_ONLY_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Normalize a YouTube reference to a video ID (11 chars). Accepts ID or URL.
 */
export function toYouTubeVideoId(urlOrId: string): string | null {
  const trimmed = String(urlOrId).trim();
  if (!trimmed) return null;
  if (YOUTUBE_ID_ONLY_REGEX.test(trimmed)) return trimmed;
  const match = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

/**
 * Extract unique YouTube video IDs from IGDB game data.
 * IGDB returns videos[] with video_id (typically YouTube).
 */
export function extractYouTubeVideoIdsFromIGDB(gameData: { videos?: Array<{ video_id?: string }> }): string[] {
  const ids: string[] = [];
  const raw = gameData?.videos;
  if (!Array.isArray(raw)) return ids;
  for (const v of raw) {
    const id = v?.video_id ? toYouTubeVideoId(String(v.video_id)) : null;
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, 10);
}

/**
 * Extract YouTube video IDs from TMDB videos response (movie or series).
 * TMDB returns videos.results[] with site and key (key is YouTube video ID).
 */
export function extractYouTubeVideoIdsFromTMDB(
  videos?: { results?: Array<{ site?: string; key?: string }> }
): string[] {
  const ids: string[] = [];
  const results = videos?.results;
  if (!Array.isArray(results)) return ids;
  for (const r of results) {
    if (String(r?.site).toLowerCase() !== "youtube" || !r?.key) continue;
    const id = toYouTubeVideoId(r.key);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, 10);
}

/**
 * Extract YouTube video IDs from a string (e.g. Tavily result content or URL).
 */
export function extractYouTubeVideoIdsFromText(text: string): string[] {
  const ids: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(YOUTUBE_ID_REGEX.source, "g");
  while ((m = re.exec(text)) !== null) {
    if (m[1] && !ids.includes(m[1])) ids.push(m[1]);
  }
  return ids;
}

/**
 * Search for YouTube videos (trailers/reviews) via Tavily for hardware or products.
 * Returns up to 5 unique video IDs.
 */
export async function searchYouTubeVideoIdsTavily(
  productName: string,
  manufacturer?: string
): Promise<string[]> {
  const query = manufacturer
    ? `${manufacturer} ${productName} trailer OR review site:youtube.com`
    : `${productName} trailer review youtube`;

  try {
    const { getTavilyClient } = await import("./tavily");
    const response = await getTavilyClient().search(query, {
      search_depth: "basic",
      include_answer: false,
      include_images: false,
      max_results: 10,
    });

    const ids: string[] = [];
    const seen = new Set<string>();

    if (response.results && Array.isArray(response.results)) {
      for (const r of response.results) {
        const url = (r as { url?: string }).url;
        const content = (r as { content?: string }).content;
        for (const chunk of [url, content].filter(Boolean) as string[]) {
          for (const id of extractYouTubeVideoIdsFromText(chunk)) {
            if (!seen.has(id)) {
              seen.add(id);
              ids.push(id);
            }
          }
        }
      }
    }

    return ids.slice(0, 5);
  } catch (error) {
    console.warn("Tavily YouTube search failed for", productName, error);
    return [];
  }
}
