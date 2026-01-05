"use client";

import { PCBuild } from "@/types/pc-build";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Monitor, ChevronRight, ShoppingCart, Info } from "lucide-react";
import Link from "next/link";

interface PCBuildCardProps {
  build: PCBuild;
  isEn?: boolean;
}

export function PCBuildCard({ build, isEn = false }: PCBuildCardProps) {
  const cpu = build.components?.find(c => c.type === "CPU");
  const gpu = build.components?.find(c => c.type === "GPU");

  return (
    <Card className="flex flex-col h-full border-2 hover:border-primary/50 transition-all group overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <Badge className="bg-primary text-primary-foreground font-bold">
            {build.pricePoint}€ Build
          </Badge>
          <div className="text-2xl font-black text-primary">
            ~{build.totalPrice.toLocaleString(isEn ? "en-US" : "de-DE", {
              style: "currency",
              currency: build.currency,
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
        <CardTitle className="text-xl md:text-2xl font-black group-hover:text-primary transition-colors">
          {isEn && build.title_en ? build.title_en : build.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-4">
        {build.description && (
          <p className="text-muted-foreground text-sm line-clamp-3">
            {isEn && build.description_en ? build.description_en : build.description}
          </p>
        )}

        <div className="space-y-2 pt-2">
          {cpu && (
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="font-medium line-clamp-1">{cpu.name}</span>
            </div>
          )}
          {gpu && (
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Monitor className="h-4 w-4" />
              </div>
              <span className="font-medium line-clamp-1">{gpu.name}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-3 pt-4 border-t bg-muted/30">
        <Button variant="outline" asChild className="w-full gap-2">
          <Link href={`/gaming-pcs/${build.pricePoint}`}>
            <Info className="h-4 w-4" />
            <span>Details</span>
          </Link>
        </Button>
        <Button asChild className="w-full gap-2" disabled={!build.affiliateLink}>
          {build.affiliateLink ? (
            <a href={build.affiliateLink} target="_blank" rel="nofollow sponsored">
              <ShoppingCart className="h-4 w-4" />
              <span>Kaufen</span>
            </a>
          ) : (
            <div className="flex items-center gap-2">
               <ShoppingCart className="h-4 w-4" />
               <span>Kaufen</span>
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}


