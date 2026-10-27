import { tavily, type TavilySearchResponse } from "@tavily/core";
import * as cheerio from "cheerio";

let tavilyClient: ReturnType<typeof tavily> | null = null;

export function getTavilyClient() {
  if (!tavilyClient) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
      throw new Error("No API key provided. Please provide the api_key attribute or set the TAVILY_API_KEY environment variable.");
    }
    tavilyClient = tavily({ apiKey });
  }
  return tavilyClient;
}

export type { TavilySearchResponse };

/**
 * Free fallback search using Brave Search API
 */
async function searchWithBrave(
  query: string,
  maxResults = 8
): Promise<TavilySearchResponse> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) throw new Error("No Brave API key");
  
  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
      {
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": apiKey,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Brave search failed: ${response.status}`);
    }
    
    const data = await response.json() as any;
    const results = (data.web?.results || []).map((r: any, i: number) => ({
      title: r.title || "",
      url: r.url || "",
      content: r.description || "",
      score: 1 - i * 0.1,
      publishedDate: r.age || "",
    }));
    
    return {
      query,
      responseTime: 0,
      images: [],
      results,
      requestId: `brave-${Date.now()}`,
      answer: data.web?.results?.[0]?.description,
    };
  } catch (error) {
    console.error("Brave fallback search failed:", error);
    throw error;
  }
}

/**
 * Free fallback search using DuckDuckGo HTML scraping
 */
async function searchWithDuckDuckGo(
  query: string,
  maxResults = 8,
  includeImages = false
): Promise<TavilySearchResponse> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results: any[] = [];
    
    $(".result").each((i, el) => {
      if (i >= maxResults) return false;
      const titleEl = $(el).find(".result__a");
      const snippetEl = $(el).find(".result__snippet");
      
      const title = titleEl.text().trim();
      let url = titleEl.attr("href") || "";
      // DuckDuckGo redirects through uddg, extract actual URL
      if (url.includes("uddg=")) {
        try {
          const match = url.match(/uddg=([^&]+)/);
          if (match) {
            url = decodeURIComponent(match[1]);
          }
        } catch {}
      }
      const content = snippetEl.text().trim();
      
      if (title && url) {
        results.push({
          title,
          url,
          content,
          score: 1 - i * 0.1,
          publishedDate: "",
        });
      }
    });
    
    return {
      query,
      responseTime: 0,
      images: [],
      results,
      requestId: `ddg-${Date.now()}`,
      answer: results[0]?.content,
    };
  } catch (error) {
    console.error("DuckDuckGo fallback search failed:", error);
    throw error;
  }
}

/**
 * Try Tavily first, fallback to free alternatives if it fails
 */
export async function searchWithFallback(
  query: string,
  options: any = {}
): Promise<TavilySearchResponse> {
  try {
    const client = getTavilyClient();
    return await client.search(query, options);
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    // If quota exceeded or no API key, try free alternatives
    if (
      errorMsg.includes("usage limit") ||
      errorMsg.includes("quota") ||
      errorMsg.includes("No API key") ||
      errorMsg.includes("exceeds")
    ) {
      console.log("⚠️  Tavily nicht verfügbar, verwende kostenlose Alternative");
      
      const maxResults = options.max_results || options.maxResults || 8;
      const includeImages = options.include_images || options.includeImages || false;
      
      // Try Brave first if API key available
      if (process.env.BRAVE_SEARCH_API_KEY) {
        try {
          return await searchWithBrave(query, maxResults);
        } catch (braveError) {
          console.log("Brave fehlgeschlagen, versuche DuckDuckGo...");
        }
      }
      
      // Fallback to DuckDuckGo
      try {
        return await searchWithDuckDuckGo(query, maxResults, includeImages);
      } catch (fallbackError) {
        console.error("Alle Suchalternativen fehlgeschlagen:", fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
}

/**
 * Search for hardware product information using Tavily
 */
export async function searchHardwareProduct(
  productName: string,
  manufacturer?: string
): Promise<TavilySearchResponse> {
  const query = manufacturer
    ? `${manufacturer} ${productName} review specifications`
    : `${productName} review specifications hardware`;

  try {
    const response = await searchWithFallback(query, {
      search_depth: "advanced",
      include_answer: true,
      include_images: true,
      include_raw_content: false,
      max_results: 10,
      include_domains: [
        "techradar.com",
        "tomshardware.com",
        "anandtech.com",
        "pcgamer.com",
        "theverge.com",
        "arstechnica.com",
        "hardware.info",
        "computerbase.de",
        "golem.de",
        "heise.de",
      ],
    });

    return response;
  } catch (error) {
    console.error(`Error searching for hardware product ${productName}:`, error);
    throw error;
  }
}

/**
 * Search for game review information using Tavily
 */
export async function searchGameProduct(
  gameName: string,
  platform?: string
): Promise<TavilySearchResponse> {
  const query = platform
    ? `${gameName} game review ${platform} gameplay performance`
    : `${gameName} game review gameplay performance`;

  try {
    const response = await searchWithFallback(query, {
      search_depth: "advanced",
      include_answer: true,
      include_images: true,
      include_raw_content: false,
      max_results: 8,
      include_domains: [
        "ign.com",
        "eurogamer.net",
        "gamepressure.com",
        "pcgamer.com",
        "gamespot.com",
        "gamerant.com",
        "gamingbolt.com",
        "rockpapershotgun.com",
        "gamepro.de",
        "gamestar.de",
        "4players.de",
      ],
    });

    return response;
  } catch (error) {
    console.error(`Error searching for game ${gameName}:`, error);
    throw error;
  }
}

/**
 * Builds a compact research summary (answer + top results) from a Tavily
 * response, suitable to be embedded into an LLM prompt as factual context.
 */
export function buildResearchSummary(
  searchResults: TavilySearchResponse,
  maxResults = 5,
  maxCharsPerResult = 400
): string[] {
  const lines: string[] = [];
  if (searchResults.answer) {
    lines.push(`Recherche-Zusammenfassung: ${searchResults.answer}`);
  }
  const results = (searchResults.results || []).slice(0, maxResults);
  results.forEach((result, i) => {
    const content = (result.content || "").replace(/\s+/g, " ").trim();
    lines.push(`Quelle ${i + 1} (${result.title || "Unbekannt"}): ${content.substring(0, maxCharsPerResult)}`);
  });
  return lines;
}

/**
 * Backwards-compatible alias for game reviews.
 */
export function buildGameResearchSummary(
  searchResults: TavilySearchResponse,
  maxResults = 5,
  maxCharsPerResult = 400
): string[] {
  return buildResearchSummary(searchResults, maxResults, maxCharsPerResult);
}

/**
 * Search for movie review information using Tavily.
 */
export async function searchMovieProduct(
  movieTitle: string,
  year?: number
): Promise<TavilySearchResponse> {
  const query = year
    ? `${movieTitle} (${year}) movie review critics plot performance`
    : `${movieTitle} movie review critics plot performance`;

  try {
    const response = await searchWithFallback(query, {
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: false,
      max_results: 8,
      include_domains: [
        "rottentomatoes.com",
        "metacritic.com",
        "ign.com",
        "variety.com",
        "hollywoodreporter.com",
        "deadline.com",
        "screenrant.com",
        "indiewire.com",
        "collider.com",
        "theguardian.com",
        "filmstarts.de",
        "moviepilot.de",
        "kino.de",
        "cineasts.de",
      ],
    });

    return response;
  } catch (error) {
    console.error(`Error searching for movie ${movieTitle}:`, error);
    throw error;
  }
}

/**
 * Search for series review information using Tavily.
 */
export async function searchSeriesProduct(
  seriesTitle: string,
  year?: number
): Promise<TavilySearchResponse> {
  const query = year
    ? `${seriesTitle} (${year}) TV series review season critics`
    : `${seriesTitle} TV series review season critics`;

  try {
    const response = await searchWithFallback(query, {
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: false,
      max_results: 8,
      include_domains: [
        "rottentomatoes.com",
        "metacritic.com",
        "ign.com",
        "variety.com",
        "hollywoodreporter.com",
        "deadline.com",
        "screenrant.com",
        "indiewire.com",
        "collider.com",
        "theguardian.com",
        "filmstarts.de",
        "moviepilot.de",
        "kino.de",
        "cineasts.de",
      ],
    });

    return response;
  } catch (error) {
    console.error(`Error searching for series ${seriesTitle}:`, error);
    throw error;
  }
}

/**
 * Search for Amazon product information using Tavily
 */
export async function searchAmazonProduct(
  productName: string,
  asin?: string
): Promise<TavilySearchResponse> {
  const query = asin
    ? `Amazon ${asin} ${productName} reviews ratings`
    : `Amazon ${productName} reviews ratings specifications`;

  try {
    const response = await searchWithFallback(query, {
      search_depth: "advanced",
      include_answer: true,
      include_images: true,
      include_raw_content: false,
      max_results: 10,
      include_domains: [
        "amazon.com",
        "amazon.de",
        "amazon.co.uk",
        "techradar.com",
        "cnet.com",
        "wirecutter.com",
        "rtings.com",
        "consumerreports.org",
      ],
    });

    return response;
  } catch (error) {
    console.error(`Error searching for Amazon product ${productName}:`, error);
    throw error;
  }
}

/**
 * Extract product specifications from Tavily search results
 */
export function extractProductSpecs(searchResults: TavilySearchResponse): {
  specs: Record<string, unknown>;
  description: string;
  pros: string[];
  cons: string[];
  price?: string;
  rating?: number;
} {
  const allContent = searchResults.results
    .map((r) => r.content)
    .join("\n\n");

  const answer = searchResults.answer || "";

  // Try to extract specs from content
  const specs: Record<string, unknown> = {};
  const pros: string[] = [];
  const cons: string[] = [];

  // Extract common hardware specs patterns
  const specPatterns = [
    /(?:VRAM|Video Memory|Memory):\s*(\d+\s*(?:GB|MB))/i,
    /(?:Clock Speed|Base Clock|Boost Clock):\s*(\d+(?:\.\d+)?\s*(?:MHz|GHz))/i,
    /(?:Cores|Threads):\s*(\d+)/i,
    /(?:TDP|Power Consumption):\s*(\d+\s*(?:W|watts))/i,
    /(?:Resolution|Display Resolution):\s*(\d+x\d+)/i,
    /(?:Refresh Rate):\s*(\d+\s*Hz)/i,
    /(?:Storage|Capacity):\s*(\d+\s*(?:GB|TB|MB))/i,
    /(?:RAM|Memory):\s*(\d+\s*(?:GB|MB))/i,
    /(?:Price|Cost|MSRP):\s*\$?(\d+(?:\.\d+)?)/i,
    /(?:Rating|Score):\s*(\d+(?:\.\d+)?)\s*(?:\/10|\/5|stars?)?/i,
  ];

  specPatterns.forEach((pattern) => {
    const match = allContent.match(pattern);
    if (match) {
      const key = pattern.source
        .replace(/[()]/g, "")
        .split("|")[0]
        .toLowerCase()
        .replace(/\s+/g, "_");
      specs[key] = match[1];
    }
  });

  // Extract price
  const priceMatch = allContent.match(/\$(\d+(?:\.\d+)?)/);
  if (priceMatch) {
    specs.price = priceMatch[1];
  }

  // Extract rating
  const ratingMatch = allContent.match(/(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*(?:10|5)/i);
  if (ratingMatch) {
    specs.rating = parseFloat(ratingMatch[1]);
  }

  // Extract pros/cons from answer or content
  const prosMatches = allContent.match(/pros?:?\s*([^.]*(?:\.[^.]*){0,3})/i);
  const consMatches = allContent.match(/cons?:?\s*([^.]*(?:\.[^.]*){0,3})/i);

  if (prosMatches) {
    pros.push(...prosMatches[1].split(/[,\n]/).map((p) => p.trim()).filter(Boolean));
  }
  if (consMatches) {
    cons.push(...consMatches[1].split(/[,\n]/).map((c) => c.trim()).filter(Boolean));
  }

  return {
    specs,
    description: answer || allContent.substring(0, 500),
    pros: pros.slice(0, 5),
    cons: cons.slice(0, 5),
    price: specs.price as string | undefined,
    rating: specs.rating as number | undefined,
  };
}

/**
 * Extract images from Tavily search results
 */
export function extractTavilyImages(searchResults: TavilySearchResponse): string[] {
  const images: string[] = [];
  
  // Get images from the images array if available
  // Tavily images can be strings or objects with url property
  if (searchResults.images && Array.isArray(searchResults.images)) {
    searchResults.images.forEach((img) => {
      if (typeof img === "string") {
        images.push(img);
      } else if (img && typeof img === "object" && "url" in img && typeof img.url === "string") {
        images.push(img.url);
      }
    });
  }
  
  // Also extract image URLs from result content (common image URL patterns)
  const imageUrlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(jpg|jpeg|png|gif|webp|svg)/gi;
  
  searchResults.results.forEach((result) => {
    if (result.content) {
      const matches = result.content.match(imageUrlPattern);
      if (matches) {
        images.push(...matches);
      }
    }
  });
  
  // Remove duplicates and filter out invalid URLs
  const uniqueImages = Array.from(new Set(images))
    .filter((url) => {
      try {
        const urlObj = new URL(url);
        return urlObj.protocol === "http:" || urlObj.protocol === "https:";
      } catch {
        return false;
      }
    })
    .slice(0, 10); // Limit to 10 images
  
  return uniqueImages;
}
