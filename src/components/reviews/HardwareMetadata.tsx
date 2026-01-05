"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Star, Package, Building2, Cpu, Monitor } from "lucide-react";

interface HardwareMetadataProps {
  hardware: {
    type?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    releaseDate?: Date | null;
    msrp?: number | null;
    description?: string | null;
    description_en?: string | null;
  } | null;
  specs?: Record<string, any>;
  affiliateLink?: string | null;
  isEn?: boolean;
}

export function HardwareMetadata({ hardware, specs, affiliateLink, isEn = false }: HardwareMetadataProps) {
  if (!hardware && !specs) return null;

  // Extract price from specs if available
  const price = specs?.price || specs?.msrp || hardware?.msrp;
  const formattedPrice = price ? `$${price}` : null;

  // Extract rating from specs if available
  const rating = specs?.rating;

  return (
    <div className="space-y-6 pt-10 border-t">
      <h2 className="text-3xl font-bold flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        {isEn ? "Product Information" : "Produktinformationen"}
      </h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Hardware Type */}
        {hardware?.type && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                {isEn ? "Type" : "Typ"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="text-sm capitalize">
                {hardware.type}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Manufacturer */}
        {hardware?.manufacturer && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {isEn ? "Manufacturer" : "Hersteller"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{hardware.manufacturer}</p>
            </CardContent>
          </Card>
        )}

        {/* Model */}
        {hardware?.model && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                {isEn ? "Model" : "Modell"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{hardware.model}</p>
            </CardContent>
          </Card>
        )}

        {/* Release Date */}
        {hardware?.releaseDate && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                {isEn ? "Release Date" : "Erscheinungsdatum"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {new Date(hardware.releaseDate).toLocaleDateString(isEn ? "en-US" : "de-DE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
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
              {hardware?.msrp && price !== hardware.msrp && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isEn ? "MSRP" : "UVP"}: ${hardware.msrp}
                </p>
              )}
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
                <p className="text-2xl font-bold text-foreground">{Number(rating).toFixed(1)}</p>
                <span className="text-sm text-muted-foreground">/ 10</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description */}
      {(hardware?.description || hardware?.description_en) && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">
              {isEn ? "Description" : "Beschreibung"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 leading-relaxed">
              {isEn && hardware.description_en ? hardware.description_en : hardware.description}
            </p>
          </CardContent>
        </Card>
      )}

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
              <span>{isEn ? "View on Amazon" : "Auf Amazon ansehen"}</span>
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
