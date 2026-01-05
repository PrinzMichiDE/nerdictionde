"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Star, DollarSign, Package, Hash, RefreshCcw, ExternalLink } from "lucide-react";
import { generateAmazonAffiliateLinkFromASIN } from "@/lib/amazon-search";
import axios from "axios";
import { cn } from "@/lib/utils";

interface AmazonMetadataProps {
  asin?: string | null;
  specs?: Record<string, any>;
  affiliateLink?: string | null;
  amazonData?: {
    price?: string;
    currency?: string;
    rating?: number;
    reviewCount?: number;
    availability?: string;
    title?: string;
  } | null;
  isEn?: boolean;
}

export function AmazonMetadata({ asin, specs, affiliateLink, amazonData, isEn = false }: AmazonMetadataProps) {
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [priceSource, setPriceSource] = useState<"paapi" | "scraping" | "static">("static");

  // Format price - handle different formats
  const formatPriceString = (price: any, currency: string = "EUR") => {
    if (!price) return null;
    if (typeof price === "string" && (price.includes("€") || price.includes("$") || price.includes(",") || price.includes("."))) {
      return price;
    }
    const numericPrice = typeof price === "string" ? parseFloat(price.replace(/[^\d.,]/g, "").replace(",", ".")) : Number(price);
    if (isNaN(numericPrice)) return price.toString();
    
    return currency === "EUR" || currency === "€" 
      ? `€${numericPrice.toFixed(2).replace(".", ",")}`
      : `$${numericPrice.toFixed(2)}`;
  };

  useEffect(() => {
    const staticPrice = amazonData?.price || specs?.price;
    if (staticPrice) {
      setCurrentPrice(formatPriceString(staticPrice, amazonData?.currency || "EUR"));
    }
  }, [amazonData, specs]);

  const fetchCurrentPrice = async () => {
    if (!asin) return;
    setLoadingPrice(true);
    try {
      const response = await axios.get(`/api/amazon/price?asin=${asin}`);
      if (response.data.price) {
        setCurrentPrice(formatPriceString(response.data.price, response.data.currency));
        setPriceSource(response.data.source);
      }
    } catch (error) {
      console.error("Error fetching current price:", error);
    } finally {
      setLoadingPrice(false);
    }
  };

  // Extract rating - prioritize Amazon API data
  const rating = amazonData?.rating !== undefined ? amazonData.rating : specs?.rating;

  // Generate affiliate link if ASIN is available but no affiliateLink is provided
  const finalAffiliateLink = affiliateLink || (asin ? generateAmazonAffiliateLinkFromASIN(asin) : null);

  return (
    <div className="space-y-6 pt-10 border-t">
      <h2 className="text-3xl font-bold flex items-center gap-3">
        <ShoppingCart className="h-8 w-8 text-primary" />
        {isEn ? "Product Details" : "Produktdetails"}
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* ASIN */}
        {asin && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                ASIN
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-mono font-semibold">{asin}</p>
            </CardContent>
          </Card>
        )}

        {/* Price */}
        {(currentPrice || loadingPrice) && (
          <Card className="border-2 overflow-hidden group">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  {isEn ? "Price" : "Preis"}
                </div>
                {asin && (
                  <button 
                    onClick={fetchCurrentPrice}
                    disabled={loadingPrice}
                    className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCcw className={cn("h-3 w-3", loadingPrice && "animate-spin")} />
                    {isEn ? "Check Price" : "Preis prüfen"}
                  </button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-black text-primary tracking-tighter">
                  {loadingPrice ? "..." : currentPrice}
                </p>
                {priceSource !== "static" && !loadingPrice && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase font-bold">
                    Live via {priceSource}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                {isEn ? "Prices may change since the last update." : "Preise können sich seit dem letzten Update geändert haben."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Rating */}
        {rating !== undefined && rating !== null && !isNaN(Number(rating)) && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                {isEn ? "Rating" : "Bewertung"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">
                  {rating != null && !isNaN(Number(rating)) ? Number(rating).toFixed(1) : "N/A"}
                </p>
                <span className="text-sm text-muted-foreground">/ 5</span>
                {amazonData?.reviewCount && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({amazonData.reviewCount.toLocaleString()} {isEn ? "reviews" : "Bewertungen"})
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Availability */}
        {(amazonData?.availability || asin) && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                {isEn ? "Availability" : "Verfügbarkeit"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {amazonData?.availability ? (
                <Badge 
                  variant="secondary" 
                  className={`text-sm ${
                    amazonData.availability.toLowerCase().includes("stock") || 
                    amazonData.availability.toLowerCase().includes("available") ||
                    amazonData.availability.toLowerCase().includes("lieferbar")
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {amazonData.availability}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-sm bg-green-500/10 text-green-600 dark:text-green-400">
                  {isEn ? "Available on Amazon" : "Auf Amazon verfügbar"}
                </Badge>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Amazon Affiliate Link - Always show if ASIN or affiliateLink is available */}
      {finalAffiliateLink && (
        <Card className="border-2 border-primary/20 bg-primary/5 shadow-xl">
          <CardContent className="pt-6">
            <a 
              href={finalAffiliateLink} 
              target="_blank" 
              rel="nofollow sponsored"
              className="flex items-center justify-center w-full bg-[#FF9900] hover:bg-[#E68A00] text-black font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] group"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              <span>{isEn ? "View on Amazon" : "Auf Amazon ansehen"}</span>
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </a>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {isEn 
                ? "As an Amazon Associate we earn from qualifying purchases." 
                : "Als Amazon-Partner verdienen wir an qualifizierten Käufen."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
