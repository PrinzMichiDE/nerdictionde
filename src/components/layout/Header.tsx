import Link from "next/link";
import { Navigation } from "./Navigation";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { BrandMark } from "@/components/shared/BrandMark";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border">
      {/* Masthead row */}
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between gap-4 px-4 md:px-6 lg:px-8 xl:px-12">
        <Link
          href="/"
          className="flex items-baseline gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label="Nerdiction Startseite"
        >
          <BrandMark className="size-7 md:size-8 self-center shrink-0" />
          <span className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
            Nerdiction
          </span>
          <span className="kicker text-primary hidden sm:inline">Magazin</span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-4 lg:mx-8">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>

      {/* Navigation row */}
      <div className="hidden md:block border-t border-border">
        <Navigation />
      </div>
    </header>
  );
}
