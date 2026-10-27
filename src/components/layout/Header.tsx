"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Navigation } from "./Navigation";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { BrandMark } from "@/components/shared/BrandMark";
import { ProfileLink } from "@/components/shared/ProfileLink";
import { Button } from "@/components/ui/button";

export function Header() {
  const [scrolled, setScrolled] = useState(() =>
    typeof window !== "undefined" && window.scrollY > 10,
  );
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    const handler = () => {
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 10);
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0) {
          setScrollProgress(Math.min(1, Math.max(0, y / docHeight)));
        } else {
          setScrollProgress(0);
        }
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => {
      window.removeEventListener("scroll", handler);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        window.setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>(
            '[aria-label="Suche nach Reviews"]',
          );
          input?.focus();
        }, 50);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header
      className="site-header sticky top-0 z-50 w-full"
      role="banner"
      data-scrolled={scrolled}
    >
      <div className="site-header-top mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-6 lg:px-8 xl:px-12">
        {/* Brand */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-label="Nerdiction Startseite"
        >
          <BrandMark className="size-7 md:size-8 transition-transform duration-200 group-hover:scale-[1.02]" />
          <span className="font-serif text-[1.5rem] md:text-[1.75rem] font-semibold tracking-tight leading-none text-foreground">
            Nerdiction
          </span>
          <span className="magazine-kicker hidden sm:inline-flex" aria-hidden="true">Magazin</span>
        </Link>

        {/* Search — Desktop */}
        <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-4 lg:mx-8 items-center">
          <div className="relative w-full">
            <GlobalSearch />
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground hidden lg:flex"
              onClick={() => {
                window.setTimeout(() => {
                  const input = document.querySelector<HTMLInputElement>(
                    '[aria-label="Suche nach Reviews"]',
                  );
                  input?.focus();
                }, 10);
              }}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Suchen...</span>
              <kbd className="kbd-badge ml-1">
                <span className="text-[9px]">⌘</span>K
              </kbd>
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-9"
            aria-label="Suche öffnen"
            onClick={() => {
              window.setTimeout(() => {
                const input = document.querySelector<HTMLInputElement>(
                  '[aria-label="Suche nach Reviews"]',
                );
                input?.focus();
              }, 50);
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <ProfileLink />
          <MobileNav />
        </div>
      </div>

      {/* Navigation row — Desktop */}
      <div className="site-header-navrow hidden md:block border-t border-border/60">
        <Navigation />
      </div>

      <div
        className="site-header-progress"
        data-visible={scrolled}
        style={{ "--scroll-progress": scrollProgress } as React.CSSProperties}
        aria-hidden="true"
      />
    </header>
  );
}
