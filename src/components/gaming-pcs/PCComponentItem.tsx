"use client";

import { PCComponent } from "@/types/pc-build";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Info, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PCComponentItemProps {
  component: PCComponent;
  isEn?: boolean;
}

export function PCComponentItem({ component, isEn = false }: PCComponentItemProps) {
  return (
    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all group">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row min-h-[140px]">
          {/* Component Image */}
          <div className="w-full md:w-[160px] bg-muted/20 flex items-center justify-center p-4 border-b md:border-b-0 md:border-r">
            {component.image ? (
              <img 
                src={component.image} 
                alt={component.name} 
                className="max-h-[100px] object-contain transition-transform group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <Info className="h-12 w-12" />
              </div>
            )}
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

            <div className="flex flex-col md:items-end justify-between gap-4 shrink-0 md:min-w-[180px]">
              {component.price && (
                <div className="md:text-right">
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                    {isEn ? "Price approx." : "Preis ca."}
                  </p>
                  <p className="text-2xl font-black text-primary leading-none">
                    {component.price.toLocaleString(isEn ? "en-US" : "de-DE", {
                      style: "currency",
                      currency: component.currency,
                    })}
                  </p>
                </div>
              )}

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
                {component.affiliateLink && (
                  <Button 
                    size="sm" 
                    asChild 
                    className={cn(
                      "h-9 gap-2 border-none shadow-sm hover:shadow-md transition-all active:scale-95",
                      component.affiliateLink.includes("amazon") 
                        ? "bg-[#FF9900] hover:bg-[#E68A00] text-black" 
                        : "bg-[#0055aa] hover:bg-[#004488] text-white"
                    )}
                  >
                    <a href={component.affiliateLink} target="_blank" rel="nofollow sponsored">
                      <ExternalLink className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {component.affiliateLink.includes("amazon") 
                          ? "Amazon" 
                          : (isEn ? "Geizhals" : "Geizhals")}
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

