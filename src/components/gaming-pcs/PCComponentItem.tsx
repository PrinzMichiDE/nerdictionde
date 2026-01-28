"use client";

import { PCComponent } from "@/types/pc-build";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Info, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PCComponentItemProps {
  component: PCComponent;
  isEn?: boolean;
}

/**
 * Generates an Amazon affiliate link for a hardware component
 * @param componentName - The name of the hardware component
 * @returns Amazon affiliate link URL
 */
function generateAmazonAffiliateLink(componentName: string): string {
  // Replace spaces with + and encode the component name
  const encodedName = componentName.replace(/\s+/g, "+");
  return `https://www.amazon.de/s?k=${encodedName}&linkCode=ll2&tag=michelfritzschde-21&linkId=f5fd3285c9a0e9cc09fb4853a36e2c40&language=de_DE&ref_=as_li_ss_tl`;
}

/**
 * Gets the affiliate link, converting non-Amazon links to Amazon format
 * @param affiliateLink - The existing affiliate link (may be Geizhals or Amazon)
 * @param componentName - The component name to use for Amazon link generation
 * @returns Amazon affiliate link URL
 */
function getAffiliateLink(affiliateLink: string | null | undefined, componentName: string): string | null {
  if (!affiliateLink) {
    return generateAmazonAffiliateLink(componentName);
  }
  
  // If it's already an Amazon link, use it as-is
  if (affiliateLink.includes("amazon")) {
    return affiliateLink;
  }
  
  // Convert Geizhals or other links to Amazon format
  return generateAmazonAffiliateLink(componentName);
}

export function PCComponentItem({ component, isEn = false }: PCComponentItemProps) {
  const affiliateLink = getAffiliateLink(component.affiliateLink, component.name);
  return (
    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all group">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row min-h-[180px]">
          {/* Component Image - Larger and more prominent */}
          <div className="w-full md:w-[240px] lg:w-[280px] bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r relative overflow-hidden">
            {component.image ? (
              <div className="relative w-full h-full min-h-[160px] flex items-center justify-center">
                <Image
                  src={component.image}
                  alt={component.name}
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-110 p-4"
                  sizes="(max-width: 768px) 100vw, 240px"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center text-muted-foreground/40 gap-3">
                <Package className="h-16 w-16" />
                <span className="text-xs font-medium uppercase tracking-wider text-center px-4">
                  {component.type}
                </span>
              </div>
            )}
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className="flex-grow p-4 md:p-6 flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-3 flex-grow">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider px-2 py-0">
                  {component.type}
                </Badge>
                {component.manufacturer && (
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {component.manufacturer}
                  </span>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-black leading-none tracking-tight group-hover:text-primary transition-colors">
                  {component.name}
                </h3>
                {component.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {isEn && component.description_en ? component.description_en : component.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col md:items-end justify-center gap-4 shrink-0 md:min-w-[180px]">
              <div className="flex flex-wrap gap-2">
                {component.reviewId && (
                  <Button variant="outline" size="sm" asChild className="h-9 gap-2">
                    <Link href={`/reviews/${component.reviewId}`}>
                      <Info className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {isEn ? "Review" : "Test"}
                      </span>
                    </Link>
                  </Button>
                )}
                {affiliateLink && (
                  <Button 
                    size="sm" 
                    asChild 
                    className="h-9 gap-2 border-none shadow-sm hover:shadow-md transition-all active:scale-95 bg-[#FF9900] hover:bg-[#E68A00] text-black"
                  >
                    <a href={affiliateLink} target="_blank" rel="nofollow sponsored">
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Amazon
                      </span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

