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
    <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-bold text-xs">
                {component.type}
              </Badge>
              {component.manufacturer && (
                <span className="text-sm text-muted-foreground">
                  {component.manufacturer}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold leading-tight">
              {component.name}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-6">
            {component.price && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  {isEn ? "Price approx." : "Preis ca."}
                </p>
                <p className="text-xl font-black text-primary">
                  {component.price.toLocaleString(isEn ? "en-US" : "de-DE", {
                    style: "currency",
                    currency: component.currency,
                  })}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {component.reviewId && (
                <Button variant="outline" size="sm" asChild className="gap-2">
                  <Link href={`/reviews/${component.reviewId}`}>
                    <Info className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {isEn ? "Review" : "Testbericht"}
                    </span>
                  </Link>
                </Button>
              )}
              {component.affiliateLink && (
                <Button 
                  size="sm" 
                  asChild 
                  className={cn(
                    "gap-2 border-none",
                    component.affiliateLink.includes("amazon") 
                      ? "bg-[#FF9900] hover:bg-[#E68A00] text-black" 
                      : "bg-[#0055aa] hover:bg-[#004488] text-white"
                  )}
                >
                  <a href={component.affiliateLink} target="_blank" rel="nofollow sponsored">
                    <ExternalLink className="h-4 w-4" />
                    <span>
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
      </CardContent>
    </Card>
  );
}

