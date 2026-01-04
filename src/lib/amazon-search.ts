import axios from "axios";

const AMAZON_AFFILIATE_TAG = "michelfritzschde-21";
const AMAZON_BASE_URL = "https://www.amazon.de";

/**
 * Generates Amazon affiliate link with the configured tag
 */
export function generateAmazonAffiliateLink(searchQuery: string): string {
  const encodedQuery = encodeURIComponent(searchQuery);
  return `${AMAZON_BASE_URL}/s?k=${encodedQuery}&linkCode=ll2&tag=${AMAZON_AFFILIATE_TAG}&linkId=e4c8e5f74e2f3773613c722da1db44a1&language=de_DE&ref_=as_li_ss_tl`;
}

/**
 * Generates Amazon affiliate link from product ASIN
 */
export function generateAmazonAffiliateLinkFromASIN(asin: string): string {
  return `${AMAZON_BASE_URL}/dp/${asin}?&linkCode=ll2&tag=${AMAZON_AFFILIATE_TAG}&linkId=e4c8e5f74e2f3773613c722da1db44a1&language=de_DE&ref_=as_li_ss_tl`;
}

/**
 * Searches for hardware on Amazon and returns affiliate link
 * This is a simplified version that generates search links
 */
export async function searchAmazonHardware(
  hardwareName: string,
  manufacturer?: string,
  model?: string
): Promise<string> {
  // Build search query
  let searchQuery = hardwareName;
  
  // Try to improve search query with manufacturer and model
  if (manufacturer && !hardwareName.toLowerCase().includes(manufacturer.toLowerCase())) {
    searchQuery = `${manufacturer} ${hardwareName}`;
  }
  
  if (model && !searchQuery.toLowerCase().includes(model.toLowerCase())) {
    searchQuery = `${searchQuery} ${model}`;
  }

  // Generate affiliate search link
  return generateAmazonAffiliateLink(searchQuery);
}
