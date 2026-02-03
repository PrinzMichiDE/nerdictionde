import axios from "axios";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import prisma from "@/lib/prisma";
import { matchDealToReview } from "@/lib/deal-matching";
import { generateAmazonAffiliateLinkFromASIN, generateAmazonAffiliateLink } from "@/lib/amazon-search";
import { uploadImage } from "@/lib/blob";

const MYDEALZ_BASE = "https://www.mydealz.de";
const DEALS_LIST_URL = `${MYDEALZ_BASE}/new`;

export interface ScrapedDeal {
  title: string;
  url: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  currency: string;
  imageUrl?: string;
  category?: string;
  asin?: string;
}

/**
 * Extract price from German text (e.g. "34,99€", "für 799 CHF", "1.197 €").
 */
function extractPrice(text: string): { price: number; original?: number; currency: string } | null {
  const normalized = text.replace(/\s/g, " ");
  const eurMatch = normalized.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*€/);
  const chfMatch = normalized.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*CHF/);
  const match = eurMatch ?? chfMatch;
  if (!match) return null;
  const priceStr = match[1].replace(/\./g, "").replace(",", ".");
  const price = parseFloat(priceStr);
  if (Number.isNaN(price)) return null;
  const currency = eurMatch ? "EUR" : "CHF";
  const nextPriceMatch = normalized.match(/Nächster Preis[^\d]*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/i);
  let original: number | undefined;
  if (nextPriceMatch) {
    const origStr = nextPriceMatch[1].replace(/\./g, "").replace(",", ".");
    original = parseFloat(origStr);
    if (Number.isNaN(original)) original = undefined;
  }
  return { price, original, currency };
}

/**
 * Extract image from deal detail page
 */
async function scrapeDealImage(dealUrl: string): Promise<string | undefined> {
  try {
    const { data } = await axios.get(dealUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
      timeout: 10000,
    });

    const $ = cheerio.load(data);
    
    // Try multiple selectors for deal images
    const imgSelectors = [
      ".thread-image img",
      ".cept-image img",
      ".threadImg",
      "img.thread-image",
      "img.cept-image",
      ".dealImage img",
      ".product-image img",
      "img[data-src]",
      "img[src*='deal']",
    ];
    
    for (const selector of imgSelectors) {
      const img = $(selector).first();
      if (img.length) {
        let imgUrl = img.attr("data-src") || img.attr("src");
        if (imgUrl) {
          // Clean and normalize URL
          imgUrl = imgUrl.split("?")[0];
          if (imgUrl.startsWith("http")) return imgUrl;
          if (imgUrl.startsWith("//")) return `https:${imgUrl}`;
          if (imgUrl.startsWith("/")) return `${MYDEALZ_BASE}${imgUrl}`;
        }
      }
    }
  } catch (err) {
    // Silently fail - don't block scraping if detail page fails
  }
  return undefined;
}

/**
 * Scrape Amazon deals from Mydealz listing page.
 * Only processes deals that contain Amazon links.
 */
export async function scrapeMydealzDeals(limit = 50): Promise<ScrapedDeal[]> {
  const deals: ScrapedDeal[] = [];
  try {
    const { data } = await axios.get(DEALS_LIST_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
      },
      timeout: 15000,
    });

    const $ = cheerio.load(data);
    const seenUrls = new Set<string>();
    const dealLinks: Array<{ dealUrl: string; container: cheerio.Cheerio<AnyNode> }> = [];

    // First, collect all deal links
    $('a[href*="/deals/"]').each((_, el) => {
      const dealHref = $(el).attr("href");
      if (!dealHref) return;
      const fullDealUrl = dealHref.startsWith("http") ? dealHref : `${MYDEALZ_BASE}${dealHref}`;
      const container = $(el).closest("article, .thread, .cept-deal");
      dealLinks.push({ dealUrl: fullDealUrl, container });
    });

    console.log(`Found ${dealLinks.length} deal links, checking for Amazon links...`);

    // Process deal links and extract Amazon links from detail pages
    for (const { dealUrl, container } of dealLinks.slice(0, limit * 3)) { // Check more deals to find Amazon ones
      if (deals.length >= limit) break;
      
      // Get deal title from listing page
      const title =
        container.find(".thread-title, .cept-tt, h2").first().text().trim() ||
        container.find("a[href*='/deals/']").first().text().trim().split("\n")[0]?.trim() ||
        "";
      if (title.length < 5) continue;

      // Visit deal detail page to find Amazon link
      let amazonUrl: string | undefined;
      try {
        const dealPage = await axios.get(dealUrl, { 
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
          },
          timeout: 8000 
        });
        const $deal = cheerio.load(dealPage.data);
        
        // Look for Amazon links with multiple selectors
        const amazonSelectors = [
          'a[href*="amazon.de"]',
          'a[href*="amazon.com"]',
          'a[href*="amzn.to"]',
          '.cept-merchant-link a[href*="amazon"]',
          '.thread-merchant-link a[href*="amazon"]',
          '.deal-link a[href*="amazon"]',
        ];
        
        let foundUrl: string | undefined;
        for (const selector of amazonSelectors) {
          const amazonLink = $deal(selector).first();
          if (amazonLink.length) {
            foundUrl = amazonLink.attr("href");
            if (foundUrl) {
              console.log(`Found Amazon link: ${foundUrl.substring(0, 100)}`);
              break;
            }
          }
        }
        
        if (foundUrl) {
          let resolvedUrl = foundUrl;
          
          // Handle shortened links
          if (resolvedUrl.includes("amzn.to")) {
            try {
              const response = await axios.head(resolvedUrl, { maxRedirects: 5, timeout: 5000 });
              resolvedUrl = response.request.res.responseUrl || resolvedUrl;
            } catch {
              await new Promise(resolve => setTimeout(resolve, 300));
              continue;
            }
          }
          
          // Normalize URL
          if (!resolvedUrl.startsWith("http")) {
            resolvedUrl = `https://www.amazon.de${resolvedUrl}`;
          }
          amazonUrl = resolvedUrl;
        }
        
        if (!amazonUrl) {
          await new Promise(resolve => setTimeout(resolve, 300));
          continue; // Skip deals without Amazon links
        }
      } catch (error) {
        // Skip if we can't access deal page
        await new Promise(resolve => setTimeout(resolve, 300));
        continue;
      }
      
      // Create unique key from ASIN or URL
      const asinMatch = amazonUrl.match(/\/([A-Z0-9]{10})(?:[\/?]|$)/i) || 
                       amazonUrl.match(/dp\/([A-Z0-9]{10})/i);
      const uniqueKey = asinMatch ? asinMatch[1] : amazonUrl;
      if (seenUrls.has(uniqueKey)) continue;
      seenUrls.add(uniqueKey);

      const body = container.find(".thread-body, .cept-description").text();
      const extracted = extractPrice(body || title);
      const price = extracted?.price ?? 0;
      const currency = extracted?.currency ?? "EUR";
      let discount: number | undefined;
      if (extracted?.original && extracted.original > price && extracted.original > 0) {
        discount = Math.round(((extracted.original - price) / extracted.original) * 100);
      }

      // Try multiple selectors to find images
      let img: string | undefined;
      const imgSelectors = [
        "img.thread-image",
        "img.cept-tb-image",
        "img.cept-image",
        "img.threadImg",
        ".thread-image img",
        ".cept-tb-image img",
        "img[data-src]",
        "img[src]",
      ];
      
      for (const selector of imgSelectors) {
        const foundImg = container.find(selector).first();
        if (foundImg.length) {
          img = foundImg.attr("data-src") || foundImg.attr("src");
          if (img) break;
        }
      }
      
      let imageUrl: string | undefined;
      if (img) {
        const cleanImg = img.split("?")[0];
        if (cleanImg.startsWith("http")) {
          imageUrl = cleanImg;
        } else if (cleanImg.startsWith("//")) {
          imageUrl = `https:${cleanImg}`;
        } else if (cleanImg.startsWith("/")) {
          imageUrl = `${MYDEALZ_BASE}${cleanImg}`;
        }
      }

      // Extract ASIN and convert to affiliate link
      let finalUrl = amazonUrl;
      let asin: string | undefined;
      
      const asinMatchFinal = amazonUrl.match(/\/([A-Z0-9]{10})(?:[\/?]|$)/i) || 
                            amazonUrl.match(/dp\/([A-Z0-9]{10})/i) || 
                            amazonUrl.match(/gp\/product\/([A-Z0-9]{10})/i) ||
                            amazonUrl.match(/product\/([A-Z0-9]{10})/i);
      
      if (asinMatchFinal && asinMatchFinal[1]) {
        asin = asinMatchFinal[1].toUpperCase();
        finalUrl = generateAmazonAffiliateLinkFromASIN(asin);
      } else {
        finalUrl = generateAmazonAffiliateLink(title);
      }

      deals.push({
        title: title.slice(0, 500),
        url: finalUrl,
        price,
        originalPrice: extracted?.original,
        discount,
        currency,
        imageUrl,
        category: undefined,
        asin,
      });
    }

    // For deals without images, try to scrape from detail page (limit to first 10 to avoid too many requests)
    const dealsWithoutImages = deals.filter(d => !d.imageUrl).slice(0, 10);
    for (const deal of dealsWithoutImages) {
      const detailImage = await scrapeDealImage(deal.url);
      if (detailImage) {
        deal.imageUrl = detailImage;
      }
      // Small delay to be polite
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Upload images to Blob Storage (only if not already on Blob Storage)
    const dealsWithImages = deals.filter(d => d.imageUrl && !d.imageUrl.includes("blob.vercel-storage.com"));
    if (dealsWithImages.length > 0) {
      console.log(`📤 Uploading ${dealsWithImages.length} deal images to Blob Storage...`);
      for (const deal of dealsWithImages) {
        if (deal.imageUrl) {
          try {
            // Generate filename from deal title and sanitize
            const sanitizedTitle = deal.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .slice(0, 80);
            const filename = `deals/${sanitizedTitle}-${Date.now()}.jpg`;
            
            const blobUrl = await uploadImage(deal.imageUrl, filename);
            if (blobUrl && blobUrl !== deal.imageUrl && blobUrl.includes("blob.vercel-storage.com")) {
              deal.imageUrl = blobUrl;
              console.log(`✅ Uploaded image for: ${deal.title.slice(0, 50)}...`);
            }
          } catch (error) {
            console.error(`❌ Error uploading image for deal "${deal.title.slice(0, 50)}":`, error);
            // Keep original URL if upload fails
          }
          // Small delay between uploads to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  } catch (err) {
    console.error("scrapeMydealzDeals error:", err);
  }
  return deals;
}

/**
 * Save scraped deals to DB and optionally link to reviews (via deal-matching lib).
 */
export async function saveScrapedDeals(scraped: ScrapedDeal[]): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;
  for (const deal of scraped) {
    if (deal.price <= 0) continue;
    try {
      const existing = await prisma.deal.findFirst({
        where: { url: deal.url },
      });
      const reviewId = await matchDealToReview(deal);
      
      // Use image URL from scraped deal (already uploaded to Blob Storage if available)
      const finalImageUrl = deal.imageUrl ?? existing?.imageUrl ?? null;
      
      if (existing) {
        await prisma.deal.update({
          where: { id: existing.id },
          data: {
            price: deal.price,
            originalPrice: deal.originalPrice ?? null,
            discount: deal.discount ?? null,
            imageUrl: finalImageUrl ?? existing.imageUrl,
            asin: deal.asin ?? existing.asin,
            reviewId: reviewId ?? existing.reviewId,
          },
        });
        updated += 1;
      } else {
        await prisma.deal.create({
          data: {
            title: deal.title,
            price: deal.price,
            originalPrice: deal.originalPrice ?? null,
            discount: deal.discount ?? null,
            currency: deal.currency,
            url: deal.url,
            imageUrl: finalImageUrl,
            source: "mydealz",
            category: deal.category ?? null,
            reviewId: reviewId ?? null,
            asin: deal.asin ?? null,
            status: "active",
          },
        });
        created += 1;
      }
    } catch (e) {
      console.error("saveScrapedDeals item error:", e);
    }
  }
  return { created, updated };
}
