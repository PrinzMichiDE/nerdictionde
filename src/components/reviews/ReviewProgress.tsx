"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function ReviewProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-16 left-0 w-full h-1 z-[60] pointer-events-none">
      <div 
        className="h-full bg-primary transition-all duration-150 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

