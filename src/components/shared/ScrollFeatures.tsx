"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const totalScroll = documentHeight - windowHeight;
      const scrollProgress = totalScroll > 0 ? (scrollTop / totalScroll) * 100 : 0;
      setProgress(scrollProgress);
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        "fixed bottom-8 right-8 z-50 rounded-full shadow-lg transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-95 pointer-events-none"
      )}
      aria-label="Nach oben scrollen"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  );
}

interface StickyNavProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

export function StickyNav({ children, offset = 0, className = "" }: StickyNavProps) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > offset);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [offset]);

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isSticky
          ? "fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border shadow-lg"
          : "relative",
        className
      )}
    >
      {children}
    </div>
  );
}
