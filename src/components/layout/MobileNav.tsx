"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ProfileLink } from "@/components/shared/ProfileLink";
import { cn } from "@/lib/utils";
import { navLinks } from "@/lib/navigation";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpen = useCallback(() => {
    setOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    document.body.style.overflow = "";
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="size-10"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
        aria-controls="mobile-menu-overlay"
        onClick={open ? handleClose : handleOpen}
      >
        <span className="relative size-5 overflow-hidden">
          <Menu
            className="absolute inset-0 size-5 transition-opacity duration-200"
            style={{ opacity: open ? 0 : 1 }}
          />
          <X
            className="absolute inset-0 size-5 transition-opacity duration-200"
            style={{ opacity: open ? 1 : 0 }}
          />
        </span>
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            id="mobile-menu-overlay"
            className="fixed inset-0 z-40 bg-background/60 md:hidden"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <nav
            id="mobile-menu-drawer"
            className="fixed top-0 right-0 z-50 h-full w-[280px] border-l border-border bg-background shadow-xl md:hidden"
            role="dialog"
            aria-label="Mobile Navigation"
            aria-modal="true"
          >
            <div className="flex h-14 items-center justify-between px-4 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Menü</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label="Menü schließen"
                onClick={handleClose}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="px-4 py-5 space-y-4 overflow-y-auto h-[calc(100%-3.5rem)]">
              {/* Search */}
              <div className="pb-3 border-b border-border">
                <GlobalSearch />
              </div>

              {/* Links */}
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={handleClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Theme & Account */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">Erscheinungsbild</span>
                <ThemeToggle />
              </div>
              <div className="pt-2">
                <ProfileLink />
              </div>
            </div>
          </nav>
        </>
      )}
    </>
  );
}
