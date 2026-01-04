"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

interface Heading {
  level: number;
  text: string;
  id: string;
}

interface TableOfContentsProps {
  headings: Heading[];
  isEn: boolean;
}

export function TableOfContents({ headings, isEn }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -66% 0px",
      }
    );

    const elements: HTMLElement[] = [];
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
        elements.push(element);
      }
    });

    return () => {
      elements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, [headings, mounted]);

  const handleClick = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);

  const headingItems = useMemo(() => {
    return headings.map((heading, index) => ({
      ...heading,
      key: `${heading.id}-${index}`,
    }));
  }, [headings]);

  if (!mounted || headings.length === 0) return null;

  return (
    <div className="p-6 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm">
      <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
        <span className="text-2xl">📑</span>
        {isEn ? "Table of Contents" : "Inhaltsverzeichnis"}
      </h2>
      <nav className="space-y-2">
        {headingItems.map((heading) => (
          <a
            key={heading.key}
            href={`#${heading.id}`}
            onClick={(e) => {
              e.preventDefault();
              handleClick(heading.id);
            }}
            className={`block text-sm transition-colors py-1 rounded-md px-2 -mx-2 break-words overflow-wrap-anywhere ${
              activeId === heading.id
                ? "text-primary font-semibold bg-primary/10"
                : "hover:text-primary hover:bg-primary/5"
            } ${
              heading.level === 1
                ? "font-bold text-foreground"
                : heading.level === 2
                ? "font-semibold text-foreground/90 pl-4"
                : heading.level === 3
                ? "text-foreground/80 pl-8"
                : "text-foreground/70 pl-12"
            }`}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

