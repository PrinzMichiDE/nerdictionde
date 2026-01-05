import axios from "axios";
import * as cheerio from "cheerio";
import { getAmazonProductByASIN, hasPAAPICredentials, AmazonProductData } from "./amazon-paapi";
import { searchAmazonProduct, extractProductSpecs } from "./tavily";

export function parseAmazonUrl(url: string): string | null {
  const patterns = [
    {
      regex: /amazon\.(?:de|com|co\.uk)\/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/i,
      index: 1,
    },
    { regex: /\/dp\/([A-Z0-9]{10})/i, index: 1 },
  ];

  for (const p of patterns) {
    const match = url.match(p.regex);
    if (match && match[p.index]) return match[p.index];
  }
  return null;
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Enhanced scraping implementation with retry logic and more details
 */
export async function scrapeAmazonProduct(url: string, retryCount = 0): Promise<any> {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": getRandomUserAgent(),
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(data);

    // Check for CAPTCHA
    if ($("form[action*='captcha']").length > 0 || $("title").text().includes("Robot Check")) {
      if (retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount);
        console.warn(`⚠️ Amazon CAPTCHA detected, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return scrapeAmazonProduct(url, retryCount + 1);
      }
      throw new Error("Amazon blockiert automatisierte Anfragen (CAPTCHA).");
    }

    const title = $("#productTitle").text().trim();
    const price = $(".a-price .a-offscreen").first().text().trim();
    const description = $("#feature-bullets ul").text().trim();
    
    // Get all available images
    const images: string[] = [];
    const mainImage = $("#landingImage").attr("src") || $("#imgBlkFront").attr("src");
    if (mainImage) images.push(mainImage);
    
    // Try to get more images from color variants if available
    $("#altImages ul li img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("play-button")) {
        // Amazon images often have dimensions in the URL like ._AC_US40_.jpg
        // We try to get the original/large version
        const highRes = src.replace(/\._AC_.*_\./, ".");
        if (!images.includes(highRes)) images.push(highRes);
      }
    });

    // Get product details/specs
    const specs: Record<string, string> = {};
    $("#productDetails_techSpec_section_1 tr, #prodDetails tr").each((_, el) => {
      const key = $(el).find("th, td.label").text().trim();
      const value = $(el).find("td, td.value").text().trim();
      if (key && value) specs[key] = value;
    });

    // Rating
    const ratingText = $(".a-icon-alt").first().text().trim();
    const ratingMatch = ratingText.match(/(\d+(?:[.,]\d+)?)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(",", ".")) : undefined;

    return {
      name: title,
      title,
      price,
      summary: description,
      description,
      cover: mainImage ? { url: mainImage } : null,
      images: images.slice(0, 10),
      specs,
      rating,
      asin: parseAmazonUrl(url),
    };
  } catch (error: any) {
    if (retryCount < 3 && (error.code === 'ECONNABORTED' || error.response?.status === 503)) {
      const delay = 2000 * Math.pow(2, retryCount);
      console.warn(`⚠️ Amazon request failed (${error.code || error.response?.status}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return scrapeAmazonProduct(url, retryCount + 1);
    }
    console.error("Scraping Amazon failed:", error.message);
    throw new Error(`Produktdaten konnten nicht von Amazon geladen werden: ${error.message}`);
  }
}

/**
 * Unified function to fetch product data with fallback chain:
 * PA API -> Tavily -> Scraping
 */
export async function getAmazonProductData(
  productName: string,
  asin?: string
): Promise<{
  data: any;
  source: "paapi" | "tavily" | "scraping";
}> {
  // 1. Try PA API first (if credentials available and ASIN provided)
  if (asin && hasPAAPICredentials()) {
    try {
      console.log(`📡 Attempting PA API for ${asin}...`);
      const data = await getAmazonProductByASIN(asin);
      return { data, source: "paapi" };
    } catch (error: any) {
      console.warn(`⚠️ PA API failed for ${asin}:`, error.message);
    }
  }
  
  // 2. Try Tavily Search
  try {
    console.log(`🔍 Attempting Tavily Search for ${productName}${asin ? ` (${asin})` : ""}...`);
    const searchResults = await searchAmazonProduct(productName, asin);
    const tavilyData = extractProductSpecs(searchResults);
    
    // Normalize Tavily data to match our structure
    const data = {
      name: productName,
      title: productName,
      price: tavilyData.price,
      description: tavilyData.description,
      summary: tavilyData.description,
      specs: tavilyData.specs,
      pros: tavilyData.pros,
      cons: tavilyData.cons,
      rating: tavilyData.rating,
      asin: asin || parseAmazonUrl(searchResults.results[0]?.url) || undefined,
      images: [], // Tavily images are separate
      tavilySearchResults: searchResults, // Pass through for image extraction later
    };
    
    return { data, source: "tavily" };
  } catch (error: any) {
    console.warn(`⚠️ Tavily failed for ${productName}:`, error.message);
  }
  
  // 3. Fallback to scraping (requires ASIN)
  if (asin) {
    try {
      console.log(`🕷️ Attempting Scraping for ${asin}...`);
      const url = `https://www.amazon.de/dp/${asin}`;
      const data = await scrapeAmazonProduct(url);
      return { data, source: "scraping" };
    } catch (error: any) {
      console.warn(`⚠️ Scraping failed for ${asin}:`, error.message);
    }
  } else if (productName) {
    // If no ASIN, try to find one via Tavily (already tried above, but maybe just for scraping)
    console.warn(`❌ No ASIN and other sources failed for ${productName}`);
  }
  
  throw new Error(`Alle Datenquellen für "${productName}" sind fehlgeschlagen.`);
}
