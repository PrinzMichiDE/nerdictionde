import axios from "axios";

export interface SteamPcRequirement {
  os?: string;
  cpu?: string;
  ram?: string;
  gpu?: string;
  dx?: string;
  storage?: string;
  raw?: string;
}

export interface SteamReviewSummary {
  total: number;
  positive: number;
  negative: number;
  percentPositive?: number;
  description?: string;
}

export interface SteamGameInfo {
  appId: string;
  name?: string;
  developers?: string[];
  publishers?: string[];
  genres?: string[];
  releaseDate?: string;
  metacriticScore?: number;
  recommendations?: number;
  priceFormatted?: string;
  pcRequirements?: {
    minimum: SteamPcRequirement;
    recommended: SteamPcRequirement;
  };
  reviewSummary?: SteamReviewSummary;
}

export function parseSteamUrl(url: string): string | null {
  const match = url.match(/store\.steampowered\.com\/app\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Parses the HTML pc_requirements block from the Steam storefront API into
 * structured spec fields (OS, CPU, RAM, GPU, DirectX, Storage).
 */
export function parsePcRequirementsHtml(html: string | undefined): SteamPcRequirement {
  const result: SteamPcRequirement = {};
  if (!html) return result;

  const items = html.match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
  const lines = items
    .map((li) => li.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (lines.length === 0) {
    const plain = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    if (plain) result.raw = plain;
    return result;
  }

  for (const line of lines) {
    const match = line.match(/^(OS|Processor|CPU|Memory|RAM|Graphics|Video Card|GPU|DirectX|Storage|Network)\s*:\s*(.+)$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === "os") result.os = value;
    else if (key === "processor" || key === "cpu") result.cpu = value;
    else if (key === "memory" || key === "ram") result.ram = value;
    else if (key === "graphics" || key === "video card" || key === "gpu") result.gpu = value;
    else if (key === "directx") result.dx = value;
    else if (key === "storage") result.storage = value;
  }
  result.raw = lines.join(" | ");
  return result;
}

/**
 * Fetches storefront details for a Steam app (best-effort, no API key required).
 * Includes real PC requirements, Metacritic score, genres and pricing.
 */
export async function getSteamAppDetails(appId: string | number): Promise<SteamGameInfo | null> {
  try {
    const response = await axios.get("https://store.steampowered.com/api/appdetails", {
      params: { appids: String(appId), l: "german", cc: "de" },
      timeout: 15000,
    });
    const data = response.data?.[String(appId)];
    if (!data?.success || !data.data) return null;
    const d = data.data;
    const pc = d.pc_requirements || {};
    return {
      appId: String(appId),
      name: d.name,
      developers: d.developers,
      publishers: d.publishers,
      genres: ((d.genres || []) as Array<{ description: string }>).map((g) => g.description),
      releaseDate: d.release_date?.date,
      metacriticScore: d.metacritic?.score,
      recommendations: d.recommendations?.total,
      priceFormatted: d.price_overview?.final_formatted,
      pcRequirements: {
        minimum: parsePcRequirementsHtml(pc.minimum),
        recommended: parsePcRequirementsHtml(pc.recommended),
      },
    };
  } catch (error) {
    console.warn(`Steam appdetails fetch failed for ${appId}:`, (error as Error).message);
    return null;
  }
}

/**
 * Fetches the aggregated Steam review summary (positive/negative counts) for an app.
 */
export async function getSteamReviewSummary(
  appId: string | number
): Promise<SteamReviewSummary | null> {
  try {
    const response = await axios.get(`https://store.steampowered.com/appreviews/${appId}`, {
      params: { json: 1, language: "german", purchase_type: "all", num_per_page: 0 },
      timeout: 15000,
    });
    const q = response.data?.query_summary;
    if (!q) return null;
    const positive = q.total_positive || 0;
    const negative = q.total_negative || 0;
    const total = q.total_reviews || positive + negative;
    return {
      total,
      positive,
      negative,
      percentPositive: total > 0 ? Math.round((positive / total) * 100) : undefined,
      description: q.review_score_desc,
    };
  } catch (error) {
    console.warn(`Steam review summary fetch failed for ${appId}:`, (error as Error).message);
    return null;
  }
}
