"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Star, DollarSign, Package, Hash } from "lucide-react";

interface AmazonMetadataProps {
  asin?: string | null;
  specs?: Record<string, any>;
  affiliateLink?: string | null;
  isEn?: boolean;
}

export function AmazonMetadata({ asin, specs, affiliateLink, isEn = false }: AmazonMetadataProps) {
  // Extract price from specs if available
  const price = specs?.price;
  const formattedPrice = price ? `$${price}` : null;

  // Extract rating from specs if available
  const rating = specs?.rating;

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
        {formattedPrice && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                {isEn ? "Price" : "Preis"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{formattedPrice}</p>
            </CardContent>
          </Card>
        )}

        {/* Rating */}
        {rating !== undefined && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                {isEn ? "Rating" : "Bewertung"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-foreground">{rating.toFixed(1)}</p>
                <span className="text-sm text-muted-foreground">/ 10</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Availability */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {isEn ? "Availability" : "Verfügbarkeit"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="text-sm bg-green-500/10 text-green-600 dark:text-green-400">
              {isEn ? "Available on Amazon" : "Auf Amazon verfügbar"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Amazon Link */}
      {affiliateLink && (
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <a 
              href={affiliateLink} 
              target="_blank" 
              rel="nofollow sponsored"
              className="flex items-center justify-center w-full bg-[#FF9900] hover:bg-[#E68A00] text-black font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] group"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              <span>{isEn ? "View on Amazon" : "Auf Amazon ansehen"}</span>
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
