"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";

export function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const updateProgress = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0 && barRef.current) {
        barRef.current.style.width = `${(window.scrollY / totalScroll) * 100}%`;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full bg-primary transition-[width] duration-150 ease-out will-change-[width]"
      />
    </div>
  );
}

export function ScrollToTop() {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let ticking = false;
    const toggleVisibility = () => {
      if (btnRef.current) {
        const visible = window.scrollY > 400;
        btnRef.current.style.opacity = visible ? "1" : "0";
        btnRef.current.style.transform = visible ? "translateY(0)" : "translateY(16px)";
        btnRef.current.style.pointerEvents = visible ? "auto" : "none";
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(toggleVisibility);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Button
      ref={btnRef}
      onClick={scrollToTop}
      size="icon"
      className="fixed bottom-8 right-8 z-50 rounded-md shadow-md opacity-0 pointer-events-none transition-[transform,opacity] duration-300"
      aria-label="Nach oben scrollen"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  );
}
