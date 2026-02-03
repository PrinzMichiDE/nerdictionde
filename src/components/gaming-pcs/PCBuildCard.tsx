"use client";

import { PCBuild } from "@/types/pc-build";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Cpu, Monitor, ShoppingCart, Info, Sparkles, Package, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PCBuildCardProps {
  build: PCBuild;
  isEn?: boolean;
}

function getPriceCategory(price: number): { label: string; color: string; icon: typeof Zap } {
  if (price <= 800) return { label: "Budget", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: TrendingUp };
  if (price <= 1500) return { label: "Mid-Range", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Zap };
  if (price <= 2500) return { label: "High-End", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Zap };
  return { label: "Premium", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Sparkles };
}

export function PCBuildCard({ build, isEn = false }: PCBuildCardProps) {
  const cpu = build.components?.find(c => c.type === "CPU");
  const gpu = build.components?.find(c => c.type === "GPU");
  const ram = build.components?.find(c => c.type === "RAM");
  const ssd = build.components?.find(c => c.type === "SSD");
  const displayImage = isEn && build.image_en ? build.image_en : build.image;
  const componentCount = build.components?.length || 0;
  const priceCategory = getPriceCategory(build.pricePoint);
  const CategoryIcon = priceCategory.icon;

  return (
    <Card className="flex flex-col h-full border-2 hover:border-primary/50 transition-all group overflow-hidden bg-gradient-to-br from-background to-muted/20 hover:shadow-xl hover:shadow-primary/5">
      {displayImage && (
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={displayImage} 
            alt={isEn && build.title_en ? build.title_en : build.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge variant="outline" className={cn("text-[10px] uppercase tracking-tighter font-black flex gap-1 items-center", priceCategory.color)}>
              <CategoryIcon className="h-2.5 w-2.5" />
              {priceCategory.label}
            </Badge>
            <Badge variant="outline" className="bg-primary/5 text-[10px] uppercase tracking-tighter font-black border-primary/20 flex gap-1 items-center">
              <Sparkles className="h-2 w-2 text-primary" />
              Nerdiction
            </Badge>
          </div>
        </div>
      )}
      <CardHeader className="pb-4 relative">
        <div className="flex justify-between items-start mb-3">
          <Badge className="bg-primary text-primary-foreground font-black text-xl px-4 py-1.5 shadow-lg">
            {build.pricePoint}€
          </Badge>
          {componentCount > 0 && (
            <Badge variant="outline" className="text-xs font-medium flex items-center gap-1">
              <Package className="h-3 w-3" />
              {componentCount} Teile
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl md:text-2xl font-black group-hover:text-primary transition-colors leading-tight">
          {isEn && build.title_en ? build.title_en : build.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-4">
        {build.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
            {isEn && build.description_en ? build.description_en : build.description}
          </p>
        )}

        <div className="space-y-2 pt-2 border-t">
          {cpu && (
            <div className="flex items-center gap-3 text-sm group/item hover:bg-muted/50 p-2 rounded-lg transition-colors">
              <div className="p-1.5 bg-primary/10 rounded-md text-primary flex-shrink-0">
                <Cpu className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium line-clamp-1 text-xs">{cpu.name}</span>
            </div>
          )}
          {gpu && (
            <div className="flex items-center gap-3 text-sm group/item hover:bg-muted/50 p-2 rounded-lg transition-colors">
              <div className="p-1.5 bg-primary/10 rounded-md text-primary flex-shrink-0">
                <Monitor className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium line-clamp-1 text-xs">{gpu.name}</span>
            </div>
          )}
          {ram && (
            <div className="flex items-center gap-3 text-sm group/item hover:bg-muted/50 p-2 rounded-lg transition-colors opacity-70">
              <div className="p-1.5 bg-muted rounded-md flex-shrink-0">
                <Package className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium line-clamp-1 text-xs">{ram.name}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-3 pt-4 border-t bg-muted/30">
        <Button variant="outline" asChild className="w-full gap-2 hover:bg-primary/5 hover:border-primary/30">
          <Link href={`/gaming-pcs/${build.slug}`}>
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
            <span className="sm:hidden">Info</span>
          </Link>
        </Button>
        <Button asChild className="w-full gap-2 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" disabled={!build.affiliateLink}>
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


