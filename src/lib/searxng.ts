/**
 * SearXNG search client for product discovery and details.
 * Uses SEARXNG_URL from .env (e.g. https://your-searxng.instance/search).
 */

import axios, { AxiosError } from "axios";

const ASIN_REGEX = /\b[B0-9][A-Z0-9]{9}\b/;
const AMAZON_DP_REGEX = /amazon\.(?:de|com|co\.uk)\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i;

export interface SearXNGResult {
  title: string;
  url: string;
  content?: string;
  engine?: string;
}

export interface SearXNGResponse {
  results?: SearXNGResult[];
  query?: string;
}

function getBaseUrl(): string {
  const url = process.env.SEARXNG_URL;
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    throw new Error(
      "SEARXNG_URL is not set or invalid. Set it in .env (e.g. https://your-searxng.instance/search)"
    );
  }
  return url.replace(/\/?$/, "");
}

/**
 * Run a search query against SearXNG. Returns results array.
 */
export async function searchSearXNG(
  query: string,
  options?: { language?: string; pageno?: number; maxResults?: number }
): Promise<SearXNGResult[]> {
  const base = getBaseUrl();
  const lang = options?.language ?? "de-DE";
  const pageno = options?.pageno ?? 1;
  const sep = base.includes("?") ? "&" : "?";
  const url = `${base}${sep}q=${encodeURIComponent(query)}&format=json&language=${encodeURIComponent(lang)}&pageno=${pageno}`;

  try {
    const { data } = await axios.get<SearXNGResponse>(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NerdictionBot/1.0)",
        Accept: "application/json",
      },
      timeout: 15000,
    });

    const results = Array.isArray(data.results) ? data.results : [];
    const max = options?.maxResults ?? 20;
    return results.slice(0, max);
  } catch (err) {
    const message = err instanceof AxiosError ? err.message : String(err);
    console.warn("SearXNG search failed:", message);
    throw err;
  }
}

/**
 * Extract ASIN from an Amazon URL string.
 */
export function extractAsinFromUrl(url: string): string | null {
  const m = url.match(AMAZON_DP_REGEX);
  return m ? m[1].toUpperCase() : null;
}

/**
 * Extract ASIN from result title or content (e.g. "B08H99BPJN").
 */
export function extractAsinFromText(text: string): string | null {
  const m = text.match(ASIN_REGEX);
  return m ? m[0].toUpperCase() : null;
}

/**
 * Discover product names and optional ASINs via SearXNG.
 * Runs several product-related queries and deduplicates by normalized title.
 */
export async function discoverProductsViaSearXNG(
  targetCount: number = 25
): Promise<Array<{ name: string; asin: string | null }>> {
  const queries = [
    "Amazon Bestseller 2024 Elektronik",
    "beste Produkte Amazon Deutschland",
    "Amazon Bestseller Technik",
    "Stiftung Warentest Sieger Produkte",
    "beste Kaufempfehlung 2024",
    "Amazon Empfehlung Elektronik",
    "beliebte Produkte Amazon",
    "Amazon Bestseller Küche",
    "beste Gadgets 2024",
  ];

  const seen = new Set<string>();
  const products: Array<{ name: string; asin: string | null }> = [];

  for (const q of queries) {
    if (products.length >= targetCount) break;
    try {
      const results = await searchSearXNG(q, { maxResults: 15 });
      for (const r of results) {
        const title = cleanProductTitle(r.title);
        if (!title || title.length < 5) continue;
        const norm = title.toLowerCase().replace(/\s+/g, " ").trim();
        if (seen.has(norm)) continue;
        seen.add(norm);
        const asin = extractAsinFromUrl(r.url) || extractAsinFromText(r.url + " " + (r.content ?? ""));
        products.push({ name: title, asin });
        if (products.length >= targetCount) break;
      }
    } catch {
      // Skip failed query
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  return products;
}

/**
 * Get product details (ASIN, title) for a product name via SearXNG.
 */
export async function getProductDetailsViaSearXNG(
  productName: string
): Promise<{ name: string; asin: string | null; url?: string } | null> {
  const query = `${productName} Amazon site:amazon.de`;
  try {
    const results = await searchSearXNG(query, { maxResults: 5 });
    for (const r of results) {
      const asin = extractAsinFromUrl(r.url);
      if (asin) {
        const title = cleanProductTitle(r.title) || productName;
        return { name: title, asin, url: r.url };
      }
    }
    return { name: productName, asin: null };
  } catch {
    return { name: productName, asin: null };
  }
}

/**
 * Clean a raw result title into a product name (strip site name, "Amazon", etc.).
 */
function cleanProductTitle(raw: string): string {
  return raw
    .replace(/\s*[-|–—]\s*Amazon\.(de|com).*$/i, "")
    .replace(/\s*[-|–—]\s*.*Amazon.*$/i, "")
    .replace(/\s*[-|–—]\s*.*\d{4}.*$/i, "")
    .replace(/\s*\(.*\)\s*$/g, "")
    .replace(/\s*:\s*.*$/g, "")
    .trim()
    .slice(0, 200);
}
