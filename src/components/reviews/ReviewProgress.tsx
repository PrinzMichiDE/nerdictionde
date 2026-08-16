"use client";

import { useState, useEffect } from "react";

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
    <div className="fixed top-16 left-0 w-full h-1 z-[60] pointer-events-none" aria-hidden="true">
      <div 
        className="h-full bg-primary transition-all duration-150 ease-out motion-safe:transition-[width]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

