"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  const checkVisibility = useCallback(() => {
    setVisible(window.scrollY > 600);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", checkVisibility, { passive: true });
    return () => window.removeEventListener("scroll", checkVisibility);
  }, [checkVisibility]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 rounded-full bg-card border border-border p-2.5 shadow-lg text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
      aria-label="Nach oben scrollen"
    >
      <ChevronUp className="size-4" />
    </button>
  );
}
