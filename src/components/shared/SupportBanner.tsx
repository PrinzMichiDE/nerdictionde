"use client";

import { useState, useEffect } from "react";
import { X, Heart, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SupportBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed (with timestamp - show again after 7 days)
    const dismissedData = localStorage.getItem("support-banner-dismissed");
    if (dismissedData) {
      try {
        const { timestamp } = JSON.parse(dismissedData);
        const daysSinceDismiss = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss < 7) {
          return; // Don't show if dismissed less than 7 days ago
        }
      } catch {
        // If parsing fails, show the banner
      }
    }
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("support-banner-dismissed", JSON.stringify({
      timestamp: Date.now(),
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/95 to-primary/90 backdrop-blur-md border-2 border-primary/50 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          aria-label="Banner schließen"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex flex-col md:flex-row items-center gap-4 pr-8">
          <div className="flex items-center gap-3 text-primary-foreground">
            <div className="p-2 bg-primary-foreground/20 rounded-lg">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Dauerhaft kostenlos & keine Paywalls</h3>
              <p className="text-sm text-primary-foreground/90">
                Unterstütze dieses Projekt und hilf dabei, es kostenlos zu halten
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <Button
              asChild
              size="lg"
              className="bg-[#FF5E5B] hover:bg-[#FF4A47] text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              <Link
                href="https://ko-fi.com/michelfritzsch"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Coffee className="mr-2 h-5 w-5" />
                Unterstützen
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
