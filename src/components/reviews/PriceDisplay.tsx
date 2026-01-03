"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, ExternalLink, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getLatestPrice, getPriceStats } from "@/lib/db/price-history";

interface PriceDisplayProps {
  reviewId: string;
  affiliateLink?: string | null;
  amazonAsin?: string | null;
  category?: string;
  className?: string;
}

interface PriceData {
  price?: number;
  currency?: string;
  availability?: "in-stock" | "out-of-stock" | "pre-order";
  priceHistory?: Array<{ date: string; price: number }>;
}

export function PriceDisplay({
  reviewId,
  affiliateLink,
  amazonAsin,
  category,
  className,
}: PriceDisplayProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch price from database
  useEffect(() => {
    if (!amazonAsin && !affiliateLink) return;

    setIsLoading(true);
    
    // Fetch latest price from database
    fetch(`/api/reviews/${reviewId}/price`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPriceData({
            price: data.data.price,
            currency: data.data.currency || "EUR",
            availability: data.data.availability,
            priceHistory: data.data.history,
          });
        } else {
          // Fallback: no price data available
          setPriceData(null);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
        setPriceData(null);
      });
  }, [reviewId, amazonAsin, affiliateLink]);

  if (!affiliateLink && !amazonAsin) return null;

  const handleClick = () => {
    if (affiliateLink) {
      window.open(affiliateLink, "_blank", "noopener,noreferrer");
    } else if (amazonAsin) {
      window.open(`https://amazon.de/dp/${amazonAsin}`, "_blank", "noopener,noreferrer");
    }
  };

  const formatPrice = (price: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(price);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Preis wird geladen...</span>
        </div>
      ) : priceData ? (
        <>
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/50 border-2 border-border">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Aktueller Preis
                </span>
                {priceData.availability === "in-stock" && (
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400">
                    Verfügbar
                  </Badge>
                )}
                {priceData.availability === "out-of-stock" && (
                  <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-600 dark:text-red-400">
                    Nicht verfügbar
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(priceData.price!, priceData.currency)}
                </span>
                {priceData.priceHistory && priceData.priceHistory.length > 1 && (
                  <span className="text-xs text-muted-foreground">
                    (letzte 30 Tage)
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleClick}
            className="w-full bg-[#FF9900] hover:bg-[#E68A00] text-black font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
            aria-label="Auf Amazon ansehen"
          >
            <ShoppingCart className="mr-2 size-5" />
            Auf Amazon ansehen
            <ExternalLink className="ml-2 size-4" />
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            * Als Amazon-Partner verdienen wir an qualifizierten Käufen
          </p>
        </>
      ) : (
        <Button
          onClick={handleClick}
          variant="outline"
          className="w-full"
          aria-label="Auf Amazon ansehen"
        >
          <ShoppingCart className="mr-2 size-4" />
          Auf Amazon ansehen
          <ExternalLink className="ml-2 size-4" />
        </Button>
      )}
    </div>
  );
}
