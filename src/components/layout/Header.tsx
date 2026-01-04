import Link from "next/link";
import { Navigation } from "./Navigation";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { Gamepad2 } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 transition-colors">
      <div className="container flex h-16 items-center px-4 md:px-6 lg:px-8">
        <div className="mr-4 flex w-full justify-between items-center gap-4">
          <Link 
            href="/" 
            className="mr-6 flex items-center space-x-2 group transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg shrink-0"
            aria-label="Nerdiction Home"
          >
            <div className="relative">
              <Gamepad2 className="size-6 text-primary transition-transform group-hover:rotate-12" />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-bold text-xl sm:inline-block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Nerdiction
            </span>
          </Link>
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <GlobalSearch reviews={reviews} />
          </div>
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Navigation />
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}

