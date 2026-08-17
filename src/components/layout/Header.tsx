"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Navigation } from "./Navigation";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { BrandMark } from "@/components/shared/BrandMark";
import { cn } from "@/lib/utils";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastScroll = useRef(0);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setScrolled(y > 20);
    lastScroll.current = y;
  }, []);

  useEffect(() => {
    setMounted(true);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <header
      className={cn("site-header", scrolled && "data-scrolled")}
      data-scrolled={scrolled}
      role="banner"
    >
      {/* Masthead row */}
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8 xl:px-12">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-baseline gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm group"
          aria-label="Nerdiction Startseite"
        >
          <span
            className={cn(
              "brand-reveal brand-reveal-1 brand-logo-glow self-center shrink-0",
              !mounted && "opacity-0"
            )}
          >
            <BrandMark className="size-7 md:size-8" />
          </span>
          <span
            className={cn(
              "font-serif text-2xl md:text-3xl font-semibold tracking-tight brand-reveal brand-reveal-2",
              !mounted && "opacity-0"
            )}
          >
            Nerdiction
          </span>
          <span
            className={cn(
              "kicker hidden sm:inline-flex items-center brand-reveal brand-reveal-3",
              !mounted && "opacity-0"
            )}
          >
            <span className="text-primary">Magazin</span>
            <span className="live-dot" aria-hidden="true" />
          </span>
        </Link>

        {/* Search — Desktop */}
        <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-4 lg:mx-8">
          <GlobalSearch />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>

      {/* Navigation row — Desktop */}
      <div className="hidden md:block header-divider">
        <Navigation />
      </div>
    </header>
  );
}
