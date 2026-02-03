"use client";

import { useState, useEffect } from "react";
import { PCBuild } from "@/types/pc-build";
import { PCComponentItem } from "./PCComponentItem";
import { BenchmarksSection } from "./BenchmarksSection";
import { FPSSection } from "./FPSSection";
import { CompatibilityCheck } from "./CompatibilityCheck";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Share2, Printer, ArrowLeft, Info, Package, Zap, TrendingUp, DollarSign, Trophy, Cpu, Monitor } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BenchmarkResult, FPSResult } from "@/lib/benchmarks";

interface PCBuildDetailProps {
  build: PCBuild;
  isEn?: boolean;
  performanceData?: {
    benchmarks: BenchmarkResult[];
    fpsResults: FPSResult[];
  } | null;
}

function getPriceCategory(price: number): { label: string; color: string; icon: typeof Zap } {
  if (price <= 800) return { label: "Budget", color: "bg-green-500/10 text-green-600 border-green-500/20", icon: TrendingUp };
  if (price <= 1500) return { label: "Mid-Range", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Zap };
  if (price <= 2500) return { label: "High-End", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Zap };
  return { label: "Premium", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Trophy };
}

export function PCBuildDetail({ build, isEn = false, performanceData }: PCBuildDetailProps) {
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const priceCategory = getPriceCategory(build.pricePoint);
  const CategoryIcon = priceCategory.icon;
  
  const cpu = build.components?.find(c => c.type === "CPU");
  const gpu = build.components?.find(c => c.type === "GPU");
  const ram = build.components?.find(c => c.type === "RAM");
  const ssd = build.components?.find(c => c.type === "SSD");
  
  const totalComponentPrice = build.components?.reduce((sum, c) => sum + (c.price || 0), 0) || 0;
  const componentCount = build.components?.length || 0;

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsStickyVisible(scrollPosition > 400);
      
      // Calculate scroll progress
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const totalScroll = documentHeight - windowHeight;
      const scrollPercent = totalScroll > 0 ? (scrollPosition / totalScroll) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial call
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: build.title,
        text: build.description || "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(isEn ? "Link copied to clipboard!" : "Link in Zwischenablage kopiert!");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted/30 z-50">
        <div
          className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-150 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Sticky CTA Button */}
      {build.affiliateLink && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t shadow-lg transition-all duration-300",
            isStickyVisible ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="container mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <div className="font-black text-lg">{build.pricePoint}€</div>
              <div className="text-sm text-muted-foreground">Gaming PC</div>
            </div>
            <Button
              size="lg"
              asChild
              className="flex-1 sm:flex-none h-14 px-8 text-lg font-black uppercase tracking-widest bg-[#FF9900] hover:bg-[#E68A00] text-black border-none shadow-xl hover:shadow-2xl"
            >
              <a href={build.affiliateLink} target="_blank" rel="nofollow sponsored" className="flex items-center justify-center gap-3">
                <ShoppingCart className="h-5 w-5" />
                {isEn ? "Buy this Build" : "Diesen PC kaufen"}
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <Link 
          href="/gaming-pcs" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          {isEn ? "Back to Overview" : "Zurück zur Übersicht"}
        </Link>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn("text-lg px-4 py-1.5 font-black uppercase tracking-tighter flex items-center gap-2", priceCategory.color)}>
              <CategoryIcon className="h-4 w-4" />
              {priceCategory.label}
            </Badge>
            <Badge className="text-lg px-4 py-1.5 bg-primary text-primary-foreground font-black uppercase tracking-tighter">
              {build.pricePoint}€ {isEn ? "Edition" : "Edition"}
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none">
            {isEn && build.title_en ? build.title_en : build.title}
          </h1>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="text-xs uppercase tracking-tight font-medium">Komponenten</span>
            </div>
            <div className="text-2xl font-black">{componentCount}</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs uppercase tracking-tight font-medium">Gesamtpreis</span>
            </div>
            <div className="text-2xl font-black">{build.totalPrice || build.pricePoint}€</div>
          </CardContent>
        </Card>
        {cpu && (
          <Card className="border-2">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cpu className="h-4 w-4" />
                <span className="text-xs uppercase tracking-tight font-medium">CPU</span>
              </div>
              <div className="text-sm font-bold line-clamp-1">{cpu.name}</div>
            </CardContent>
          </Card>
        )}
        {gpu && (
          <Card className="border-2">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Monitor className="h-4 w-4" />
                <span className="text-xs uppercase tracking-tight font-medium">GPU</span>
              </div>
              <div className="text-sm font-bold line-clamp-1">{gpu.name}</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Image */}
      {(isEn ? build.image_en || build.image : build.image) && (
        <div className="relative aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden border-4 border-muted shadow-2xl group">
          <img 
            src={(isEn ? build.image_en || build.image : build.image)!} 
            alt={isEn && build.title_en ? build.title_en : build.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/20 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare} className="bg-background/80 backdrop-blur-sm hover:bg-background">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.print()} className="bg-background/80 backdrop-blur-sm hover:bg-background">
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Description */}
      {build.description && (
        <div className="prose prose-neutral dark:prose-invert max-w-none bg-gradient-to-br from-muted/30 to-muted/10 p-6 md:p-8 rounded-2xl border-2">
          <p className="text-lg md:text-xl leading-relaxed text-muted-foreground">
            {isEn && build.description_en ? build.description_en : build.description}
          </p>
        </div>
      )}

      {/* Quick Specs */}
      {(cpu || gpu || ram || ssd) && (
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <h3 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {isEn ? "Quick Specs" : "Schnellübersicht"}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cpu && (
                <div className="space-y-2 p-4 rounded-lg bg-background/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Cpu className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-tight font-medium">Prozessor</span>
                  </div>
                  <div className="text-sm font-black">{cpu.name}</div>
                  {cpu.specs && typeof cpu.specs === 'object' && cpu.specs.cores && (
                    <div className="text-xs text-muted-foreground">
                      {cpu.specs.cores} Kerne
                      {cpu.specs.threads && ` / ${cpu.specs.threads} Threads`}
                    </div>
                  )}
                </div>
              )}
              {gpu && (
                <div className="space-y-2 p-4 rounded-lg bg-background/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Monitor className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-tight font-medium">Grafikkarte</span>
                  </div>
                  <div className="text-sm font-black">{gpu.name}</div>
                  {gpu.specs && typeof gpu.specs === 'object' && gpu.specs.vram && (
                    <div className="text-xs text-muted-foreground">
                      {gpu.specs.vram} VRAM
                    </div>
                  )}
                </div>
              )}
              {ram && (
                <div className="space-y-2 p-4 rounded-lg bg-background/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-tight font-medium">Arbeitsspeicher</span>
                  </div>
                  <div className="text-sm font-black">{ram.name}</div>
                  {ram.specs && typeof ram.specs === 'object' && ram.specs.capacity && (
                    <div className="text-xs text-muted-foreground">
                      {ram.specs.capacity}
                    </div>
                  )}
                </div>
              )}
              {ssd && (
                <div className="space-y-2 p-4 rounded-lg bg-background/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-tight font-medium">Speicher</span>
                  </div>
                  <div className="text-sm font-black">{ssd.name}</div>
                  {ssd.specs && typeof ssd.specs === 'object' && ssd.specs.capacity && (
                    <div className="text-xs text-muted-foreground">
                      {ssd.specs.capacity}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Breakdown */}
      {build.components && build.components.length > 0 && totalComponentPrice > 0 && (
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Preis-Breakdown
              </h3>
              <Badge className="text-lg px-4 py-1 bg-primary text-primary-foreground font-black">
                {totalComponentPrice.toLocaleString("de-DE")}€
              </Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {build.components
                .filter(c => c.price && c.price > 0)
                .map((component) => (
                  <div key={component.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border">
                    <span className="text-sm font-medium line-clamp-1 flex-1">{component.name}</span>
                    <span className="text-sm font-black text-primary ml-2">{component.price}€</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compatibility Check */}
      {build.components && build.components.length > 0 && (
        <CompatibilityCheck components={build.components} isEn={isEn} />
      )}

      {/* Components List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-sm font-black">
              {build.components?.length || 0}
            </span>
            {isEn ? "Components" : "Komponenten"}
          </h2>
        </div>

        <div className="grid gap-4">
          {build.components?.map((component) => (
            <PCComponentItem key={component.id} component={component} isEn={isEn} />
          ))}
        </div>
      </div>

      {/* Performance Data Section */}
      {performanceData && (
        <div className="space-y-6">
          {performanceData.benchmarks && performanceData.benchmarks.length > 0 && (
            <BenchmarksSection benchmarks={performanceData.benchmarks} isEn={isEn} />
          )}
          {performanceData.fpsResults && performanceData.fpsResults.length > 0 && (
            <FPSSection fpsResults={performanceData.fpsResults} isEn={isEn} />
          )}
        </div>
      )}

      {/* AI Generated Detail Section */}
      {build.metadata && (build.metadata as any).detailSections && (
        <div className="space-y-8 py-8 border-y">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight">
              {isEn ? "The Gaming PC in Detail" : "Der Gaming PC im Detail"}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {(build.metadata as any).detailSections.map((section: any, idx: number) => (
              <div key={idx} className="space-y-3 p-6 rounded-2xl bg-muted/50 border hover:bg-muted/80 transition-colors">
                <h3 className="text-xl font-black uppercase tracking-tight text-primary">
                  {section.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      {build.affiliateLink && (
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/20 rounded-3xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative space-y-4">
            <div className="space-y-2">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                {isEn ? "Ready to Build?" : "Bereit zum Loslegen?"}
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {isEn 
                  ? "Click below to see the full parts list and current best prices."
                  : "Klicke unten, um die vollständige Teileliste und die aktuell besten Preise zu sehen."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="text-center sm:text-left">
                <div className="text-3xl font-black">{build.pricePoint}€</div>
                <div className="text-sm text-muted-foreground">{componentCount} Komponenten</div>
              </div>
              <Button size="lg" asChild className="h-16 px-12 text-lg font-black uppercase tracking-widest bg-[#FF9900] hover:bg-[#E68A00] text-black border-none shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                <a href={build.affiliateLink} target="_blank" rel="nofollow sponsored" className="flex items-center gap-3">
                  <ShoppingCart className="h-6 w-6" />
                  {isEn ? "Buy this Build" : "Diesen PC kaufen"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

