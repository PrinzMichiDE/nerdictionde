"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "./Navigation";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { BrandMark } from "@/components/shared/BrandMark";
import { ProfileLink } from "@/components/shared/ProfileLink";

export function Header() {
  const [scrolled, setScrolled] = useState(() =>
    typeof window !== "undefined" && window.scrollY > 10,
  );

  useEffect(() => {
    let raf: number;
    const handler = () => {
      raf = requestAnimationFrame(() => setScrolled(window.scrollY > 10));
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => {
      window.removeEventListener("scroll", handler);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className="site-header sticky top-0 z-50 w-full bg-background"
      role="banner"
      data-scrolled={scrolled}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6 lg:px-8 xl:px-12">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-label="Nerdiction Startseite"
        >
          <BrandMark className="size-7 md:size-8" />
          <span className="font-serif text-[1.5rem] md:text-[1.75rem] font-semibold tracking-tight leading-none text-foreground">
            Nerdiction
          </span>
        </Link>

        {/* Search — Desktop */}
        <div className="hidden md:block flex-1 max-w-md lg:max-w-lg mx-4 lg:mx-8">
          <GlobalSearch />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <ThemeToggle />
          <ProfileLink />
          <MobileNav />
        </div>
      </div>

      {/* Navigation row — Desktop */}
      <div className="hidden md:block border-t border-border">
        <Navigation />
      </div>
    </header>
  );
}
