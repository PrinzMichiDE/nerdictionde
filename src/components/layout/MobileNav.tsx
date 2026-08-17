"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", icon: "01" },
  { href: "/reviews", label: "Reviews", icon: "02" },
  { href: "/releases", label: "Releases", icon: "03" },
  { href: "/tools", label: "Tools", icon: "04" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const pathname = usePathname();

  const handleClose = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => setOpen(false), 300);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      document.body.style.overflow = "";
      setAnimateIn(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="size-10"
        onClick={() => (open ? handleClose() : setOpen(true))}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
      >
        <span className="relative size-5">
          <Menu
            className={cn(
              "absolute inset-0 size-5 transition-all duration-300",
              open ? "rotate-90 opacity-0 scale-75" : "rotate-0 opacity-100 scale-100"
            )}
          />
          <X
            className={cn(
              "absolute inset-0 size-5 transition-all duration-300",
              open ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-75"
            )}
          />
        </span>
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 bg-background/60 z-40 md:hidden mobile-backdrop",
              !animateIn && "opacity-0"
            )}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <nav
            id="mobile-navigation"
            className={cn(
              "fixed top-16 left-0 right-0 z-50 border-b border-border bg-background md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto mobile-panel",
              !animateIn && "opacity-0 translate-y-[-8px]"
            )}
            aria-label="Mobile navigation"
          >
            <div className="container px-4 py-5 space-y-5">
              {/* Search */}
              <div className="pb-4 border-b border-border mobile-nav-item" style={{ ["--stagger" as string]: 0 }}>
                <GlobalSearch />
              </div>

              {/* Links */}
              <div className="space-y-1">
                {links.map((link, i) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleClose}
                      className={cn(
                        "mobile-nav-item flex items-center gap-3 px-3 py-3.5 rounded-md text-base font-medium transition-all duration-200",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground"
                      )}
                      style={{ ["--stagger" as string]: i + 1 }}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span className="text-xs font-bold text-muted-foreground/50 tabular-nums w-6">
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Theme Toggle */}
              <div className="pt-3 border-t border-border mobile-nav-item flex items-center justify-between" style={{ ["--stagger" as string]: 5 }}>
                <span className="text-sm text-muted-foreground font-medium">Erscheinungsbild</span>
                <ThemeToggle />
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
