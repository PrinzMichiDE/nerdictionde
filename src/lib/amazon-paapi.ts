import ProductAdvertisingAPIv1 from "paapi5-nodejs-sdk";
import NodeCache from "node-cache";

// Cache product data for 24 hours
const cache = new NodeCache({ stdTTL: 86400 });

interface AmazonPAAPIConfig {
  accessKey: string;
  secretKey: string;
  partnerTag: string;
  marketplace: string;
}

export interface AmazonProductData {
  asin: string;
  title: string;
  price?: string;
  currency?: string;
  images: string[];
  description: string;
  features: string[];
  specs: Record<string, any>;
  rating?: number;
  reviewCount?: number;
  availability?: string;
}

function getPAAPIConfig(): AmazonPAAPIConfig | null {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG;
  const marketplace = process.env.AMAZON_PAAPI_MARKETPLACE || "de";

  if (!accessKey || !secretKey || !partnerTag) {
    return null;
  }

  return { accessKey, secretKey, partnerTag, marketplace };
}

/**
 * Maps marketplace to host and region
 */
function getMarketplaceDetails(marketplace: string): { host: string; region: string } {
  switch (marketplace.toLowerCase()) {
    case "de":
      return { host: "webservices.amazon.de", region: "eu-central-1" };
    case "com":
      return { host: "webservices.amazon.com", region: "us-east-1" };
    case "co.uk":
      return { host: "webservices.amazon.co.uk", region: "eu-west-1" };
    default:
      return { host: "webservices.amazon.de", region: "eu-central-1" };
  }
}

/**
 * Fetches product data from Amazon PA API 5.0
 */
export async function getAmazonProductByASIN(asin: string): Promise<AmazonProductData> {
  const config = getPAAPIConfig();
  if (!config) {
    throw new Error("Amazon PA API credentials missing");
  }

  // Check cache first
  const cacheKey = `amazon_paapi_${asin}_${config.marketplace}`;
  const cachedData = cache.get<AmazonProductData>(cacheKey);
  if (cachedData) {
    console.log(`📦 Returning cached PA API data for ${asin}`);
    return cachedData;
  }

  const { host, region } = getMarketplaceDetails(config.marketplace);

  const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
  defaultClient.accessKey = config.accessKey;
  defaultClient.secretKey = config.secretKey;
  defaultClient.host = host;
  defaultClient.region = region;

  const api = new ProductAdvertisingAPIv1.DefaultApi();
  const getItemsRequest = new ProductAdvertisingAPIv1.GetItemsRequest();

  getItemsRequest["PartnerTag"] = config.partnerTag;
  getItemsRequest["PartnerType"] = "Associates";
  getItemsRequest["ItemIds"] = [asin];
  getItemsRequest["Resources"] = [
    "Images.Primary.Large",
    "Images.Variants.Large",
    "ItemInfo.Title",
    "ItemInfo.Features",
    "ItemInfo.ByLineInfo",
    "ItemInfo.ProductInfo",
    "ItemInfo.TechnicalInfo",
    "Offers.Listings.Price",
    "Offers.Listings.Availability",
    "CustomerReviews.Count",
    "CustomerReviews.StarRating",
  ];

  return new Promise((resolve, reject) => {
    api.getItems(getItemsRequest, (error: any, data: any) => {
      if (error) {
        console.error("PA API Error:", error);
        reject(error);
        return;
      }

      try {
        const getItemsResponse = ProductAdvertisingAPIv1.GetItemsResponse.constructFromObject(data);
        if (getItemsResponse.Errors) {
          console.error("PA API Response Errors:", getItemsResponse.Errors);
          reject(new Error(getItemsResponse.Errors[0].Message));
          return;
        }

        if (!getItemsResponse.ItemsResult || getItemsResponse.ItemsResult.Items.length === 0) {
          reject(new Error("Product not found via PA API"));
          return;
        }

        const item = getItemsResponse.ItemsResult.Items[0];
        
        // Parse images
        const images = [];
        if (item.Images?.Primary?.Large?.URL) {
          images.push(item.Images.Primary.Large.URL);
        }
        if (item.Images?.Variants) {
          item.Images.Variants.forEach((variant: any) => {
            if (variant.Large?.URL) images.push(variant.Large.URL);
          });
        }

        // Parse price
        const listing = item.Offers?.Listings?.[0];
        const price = listing?.Price?.DisplayAmount;
        const currency = listing?.Price?.Currency;

        // Parse features
        const features = item.ItemInfo?.Features?.DisplayValues || [];

        // Parse specs (Technical Info)
        const specs: Record<string, any> = {};
        if (item.ItemInfo?.TechnicalInfo) {
          // This part varies a lot, we try to gather what's available
          const tech = item.ItemInfo.TechnicalInfo;
          Object.keys(tech).forEach(key => {
            if (tech[key]?.DisplayValue) {
              specs[key] = tech[key].DisplayValue;
            }
          });
        }

        const productData: AmazonProductData = {
          asin: item.ASIN,
          title: item.ItemInfo?.Title?.DisplayValue || "Unknown Title",
          price,
          currency,
          images: images.slice(0, 10),
          description: features.join("\n\n"),
          features,
          specs,
          rating: item.CustomerReviews?.StarRating,
          reviewCount: item.CustomerReviews?.Count,
          availability: listing?.Availability?.Message,
        };

        // Cache the result
        cache.set(cacheKey, productData);
        resolve(productData);
      } catch (err) {
        console.error("Error parsing PA API response:", err);
        reject(err);
      }
    });
  });
}

/**
 * Searches for products on Amazon using SearchItems operation
 */
export async function searchAmazonProducts(
  keywords: string,
  itemCount: number = 5
): Promise<AmazonProductData[]> {
  const config = getPAAPIConfig();
  if (!config) {
    throw new Error("Amazon PA API credentials missing");
  }

  const cacheKey = `amazon_paapi_search_${keywords}_${config.marketplace}_${itemCount}`;
  const cachedData = cache.get<AmazonProductData[]>(cacheKey);
  if (cachedData) {
    console.log(`📦 Returning cached PA API search for "${keywords}"`);
    return cachedData;
  }

  const { host, region } = getMarketplaceDetails(config.marketplace);

  const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
  defaultClient.accessKey = config.accessKey;
  defaultClient.secretKey = config.secretKey;
  defaultClient.host = host;
  defaultClient.region = region;

  const api = new ProductAdvertisingAPIv1.DefaultApi();
  const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();

  searchItemsRequest["PartnerTag"] = config.partnerTag;
  searchItemsRequest["PartnerType"] = "Associates";
  searchItemsRequest["Keywords"] = keywords;
  searchItemsRequest["ItemCount"] = itemCount;
  searchItemsRequest["Resources"] = [
    "Images.Primary.Large",
    "ItemInfo.Title",
    "ItemInfo.Features",
    "Offers.Listings.Price",
  ];

  return new Promise((resolve, reject) => {
    api.searchItems(searchItemsRequest, (error: any, data: any) => {
      if (error) {
        console.error("PA API Search Error:", error);
        reject(error);
        return;
      }

      try {
        const searchItemsResponse = ProductAdvertisingAPIv1.SearchItemsResponse.constructFromObject(data);
        if (searchItemsResponse.Errors) {
          console.error("PA API Search Response Errors:", searchItemsResponse.Errors);
          reject(new Error(searchItemsResponse.Errors[0].Message));
          return;
        }

        if (!searchItemsResponse.SearchResult || !searchItemsResponse.SearchResult.Items) {
          resolve([]);
          return;
        }

        const results: AmazonProductData[] = searchItemsResponse.SearchResult.Items.map((item: any) => {
          const listing = item.Offers?.Listings?.[0];
          return {
            asin: item.ASIN,
            title: item.ItemInfo?.Title?.DisplayValue || "Unknown Title",
            price: listing?.Price?.DisplayAmount,
            currency: listing?.Price?.Currency,
            images: item.Images?.Primary?.Large?.URL ? [item.Images.Primary.Large.URL] : [],
            description: item.ItemInfo?.Features?.DisplayValues?.join("\n\n") || "",
            features: item.ItemInfo?.Features?.DisplayValues || [],
            specs: {},
          };
        });

        cache.set(cacheKey, results);
        resolve(results);
      } catch (err) {
        console.error("Error parsing PA API search response:", err);
        reject(err);
      }
    });
  });
}

/**
 * Helper to check if credentials are provided
 */
export function hasPAAPICredentials(): boolean {
  return !!(process.env.AMAZON_PAAPI_ACCESS_KEY && 
            process.env.AMAZON_PAAPI_SECRET_KEY && 
            process.env.AMAZON_PAAPI_PARTNER_TAG);
}

