"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
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
      variant="secondary"
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 rounded-md shadow-md transition-all duration-300 border border-border",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
      )}
      onClick={scrollToTop}
      aria-label="Nach oben scrollen"
    >
      <ArrowUp className="size-5" />
    </Button>
  );
}

