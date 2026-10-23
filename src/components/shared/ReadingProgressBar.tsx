"use client";

import { useEffect, useState, useCallback } from "react";

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const article = document.querySelector("article");
    if (!article) return;

    const rect = article.getBoundingClientRect();
    const articleTop = rect.top + window.scrollY;
    const articleHeight = article.offsetHeight;
    const viewportHeight = window.innerHeight;

    const start = articleTop;
    const end = articleTop + articleHeight - viewportHeight;
    const scrolled = Math.max(0, window.scrollY - start);
    const total = end - start;

    setProgress(total > 0 ? Math.min(100, Math.round((scrolled / total) * 100)) : 0);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-[3px]"
      style={{ backgroundColor: "var(--muted)" }}
      aria-hidden="true"
    >
      <div
        className="h-full bg-primary transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
