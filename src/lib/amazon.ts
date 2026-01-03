import axios from "axios";
import * as cheerio from "cheerio";

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

/**
 * Scrapes basic Amazon product data without using the official API.
 * Note: Amazon has strong anti-bot measures. This is a basic implementation.
 */
export async function scrapeAmazonProduct(url: string) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    const $ = cheerio.load(data);

    const title = $("#productTitle").text().trim();
    const price = $(".a-price .a-offscreen").first().text().trim();
    const description = $("#feature-bullets ul").text().trim();
    
    // Get the main image
    const mainImage = $("#landingImage").attr("src") || $("#imgBlkFront").attr("src");

    // Get product details/specs
    const specs: Record<string, string> = {};
    $("#productDetails_techSpec_section_1 tr").each((_, el) => {
      const key = $(el).find("th").text().trim();
      const value = $(el).find("td").text().trim();
      if (key && value) specs[key] = value;
    });

    return {
      name: title,
      price,
      summary: description,
      cover: mainImage ? { url: mainImage } : null,
      specs,
      asin: parseAmazonUrl(url),
    };
  } catch (error) {
    console.error("Scraping Amazon failed:", error);
    throw new Error("Produktdaten konnten nicht von Amazon geladen werden. Bitte manuell eingeben.");
  }
}
