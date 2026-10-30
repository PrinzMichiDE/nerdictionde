export const AMAZON_TAG = "nerdiction-21";
export const AMAZON_DOMAIN = "www.amazon.de";

export function buildAmazonAffiliateUrl(asin: string, tag = AMAZON_TAG): string {
  return `https://${AMAZON_DOMAIN}/dp/${encodeURIComponent(asin)}/?tag=${tag}`;
}

export function extractAsin(url: string): string | null {
  const match = url.match(/(?:dp\/|product\/|gp\/product\/|asin\/)([A-Z0-9]{10})/);
  return match ? match[1] : null;
}

export function isAmazonUrl(url: string): boolean {
  try {
    return /amazon\.de$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}
