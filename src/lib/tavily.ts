import { tavily, type TavilySearchResponse } from "@tavily/core";

const tavilyClient = tavily({
  apiKey: process.env.TAVILY_API_KEY || "",
});

export type { TavilySearchResponse };

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
    const response = await tavilyClient.search(query, {
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
    const response = await tavilyClient.search(query, {
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
  specs: Record<string, any>;
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
  const specs: Record<string, any> = {};
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
    price: specs.price,
    rating: specs.rating,
  };
}
