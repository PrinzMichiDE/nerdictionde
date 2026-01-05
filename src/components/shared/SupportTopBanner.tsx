"use client";

import { useState, useEffect } from "react";
import { X, Heart, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SupportTopBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if top banner was dismissed
    const dismissed = localStorage.getItem("support-top-banner-dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20 py-3 md:py-4 px-4 md:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-4 text-sm md:text-base lg:text-lg text-foreground/90">
          <Heart className="h-4 w-4 md:h-5 md:w-5 text-primary fill-current" />
          <span className="font-medium">
            <span className="font-bold">Dauerhaft kostenlos</span> & keine Paywalls
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Unterstütze dieses Projekt</span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-primary/30 hover:bg-primary/10 text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 h-auto"
          >
            <Link
              href="https://ko-fi.com/michelfritzsch"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 md:gap-2"
            >
              <Coffee className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Unterstützen</span>
            </Link>
          </Button>
          
          <button
            onClick={() => {
              setIsVisible(false);
              localStorage.setItem("support-top-banner-dismissed", "true");
            }}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 md:p-1.5"
            aria-label="Banner schließen"
          >
            <X className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
