import Link from "next/link";
import { Navigation } from "./Navigation";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { Gamepad2 } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 transition-colors">
      <div className="container flex h-16 md:h-20 lg:h-24 items-center px-4 md:px-6 lg:px-8 xl:px-12 max-w-7xl mx-auto">
        <div className="mr-4 flex w-full justify-between items-center gap-4 md:gap-6 lg:gap-8">
          <Link 
            href="/" 
            className="mr-6 md:mr-8 lg:mr-10 flex items-center space-x-2 md:space-x-3 group transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg shrink-0"
            aria-label="Nerdiction Home"
          >
            <div className="relative">
              <Gamepad2 className="size-6 md:size-7 lg:size-8 text-primary transition-transform group-hover:rotate-12" />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-bold text-xl md:text-2xl lg:text-3xl sm:inline-block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Nerdiction
            </span>
          </Link>
          <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg xl:max-w-xl mx-4 lg:mx-8">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-2 md:gap-4 lg:gap-6 shrink-0">
            <Navigation />
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}

