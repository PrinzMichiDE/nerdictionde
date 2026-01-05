"use client";

import { PCBuild } from "@/types/pc-build";
import { PCComponentItem } from "./PCComponentItem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Share2, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PCBuildDetailProps {
  build: PCBuild;
  isEn?: boolean;
}

export function PCBuildDetail({ build, isEn = false }: PCBuildDetailProps) {
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
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <Link 
          href="/gaming-pcs" 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEn ? "Back to Overview" : "Zurück zur Übersicht"}
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Badge className="text-lg px-4 py-1 bg-primary text-primary-foreground font-black uppercase tracking-tighter">
              {build.pricePoint}€ {isEn ? "Edition" : "Edition"}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none">
              {isEn && build.title_en ? build.title_en : build.title}
            </h1>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">
              {isEn ? "Total Price approx." : "Gesamtpreis ca."}
            </p>
            <div className="text-4xl md:text-5xl font-black text-primary">
              {build.totalPrice.toLocaleString(isEn ? "en-US" : "de-DE", {
                style: "currency",
                currency: build.currency,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Image */}
      {(isEn ? build.image_en || build.image : build.image) && (
        <div className="relative aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden border-4 border-muted shadow-2xl">
          <img 
            src={(isEn ? build.image_en || build.image : build.image)!} 
            alt={isEn && build.title_en ? build.title_en : build.title}
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
        </div>
      )}

      {/* Description */}
      {build.description && (
        <div className="prose prose-neutral dark:prose-invert max-w-none bg-muted/30 p-6 rounded-2xl border">
          <p className="text-lg leading-relaxed text-muted-foreground italic">
            {isEn && build.description_en ? build.description_en : build.description}
          </p>
        </div>
      )}

      {/* Components List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
            <span className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center text-sm">
              {build.components?.length || 0}
            </span>
            {isEn ? "Components" : "Komponenten"}
          </h2>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {build.components?.map((component) => (
            <PCComponentItem key={component.id} component={component} isEn={isEn} />
          ))}
        </div>
      </div>

      {/* CTA Section */}
      {build.affiliateLink && (
        <div className="bg-primary/5 border-2 border-primary/20 rounded-3xl p-8 md:p-12 text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              {isEn ? "Ready to Build?" : "Bereit zum Loslegen?"}
            </h3>
            <p className="text-muted-foreground">
              {isEn 
                ? "Click below to see the full parts list and current best prices."
                : "Klicke unten, um die vollständige Teileliste und die aktuell besten Preise zu sehen."}
            </p>
          </div>
          <Button size="lg" asChild className="h-16 px-12 text-lg font-black uppercase tracking-widest bg-[#FF9900] hover:bg-[#E68A00] text-black border-none shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
            <a href={build.affiliateLink} target="_blank" rel="nofollow sponsored" className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6" />
              {isEn ? "Buy this Build" : "Diesen PC kaufen"}
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

