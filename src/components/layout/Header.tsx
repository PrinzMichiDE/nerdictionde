"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Navigation } from "./Navigation";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { BrandMark } from "@/components/shared/BrandMark";
import { ProfileLink } from "@/components/shared/ProfileLink";

export function Header() {
  const lastScroll = useRef(0);
  const [scrolled, setScrolled] = useState(() =>
    typeof window !== "undefined" && window.scrollY > 10,
  );

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    lastScroll.current = y;
    setScrolled(y > 10);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <header
      className="site-header"
      role="banner"
      data-scrolled={scrolled}
    >
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8 xl:px-12">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-baseline gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm group brand-reveal"
          aria-label="Nerdiction Startseite"
        >
          <BrandMark className="size-7 md:size-8 brand-logo-glow" />
          <span className="font-serif text-2xl md:text-3xl font-semibold tracking-tight brand-reveal">
            Nerdiction
          </span>
          <span className="kicker hidden sm:inline-flex items-center brand-reveal">
            <span className="text-primary">Magazin</span>
          </span>
        </Link>

        {/* Search — Desktop */}
        <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-4 lg:mx-8">
          <GlobalSearch />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <ThemeToggle />
          <ProfileLink />
          <MobileNav />
        </div>
      </div>

      {/* Navigation row — Desktop */}
      <div className="hidden md:block border-t border-border header-divider">
        <Navigation />
      </div>
    </header>
  );
}
