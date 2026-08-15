"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/reviews", label: "Reviews" },
  { href: "/releases", label: "Releases" },
  {
    href: "/gaming-pcs",
    label: "Gaming PCs",
    submenu: [
      { href: "/gaming-pcs", label: "Übersicht" },
      { href: "/pc-builder", label: "PC Builder" },
    ],
  },
  { href: "/deals", label: "Deals" },
  { href: "/tools", label: "Tools" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setOpenSubmenu(null);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        ref={toggleRef}
        variant="ghost"
        size="icon"
        className="size-10"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => {
              setOpen(false);
              setOpenSubmenu(null);
            }}
            aria-hidden="true"
          />
          <nav
            id="mobile-navigation"
            className="fixed top-16 left-0 right-0 z-50 border-b border-border bg-background md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto"
            aria-label="Mobile navigation"
          >
            <div className="container px-4 py-4 space-y-4">
              <div className="pb-3 border-b border-border">
                <GlobalSearch />
              </div>
              <div className="space-y-1">
                {links.map((link) => {
                  const hasSubmenu = link.submenu && link.submenu.length > 0;
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href)) ||
                    (hasSubmenu &&
                      link.submenu?.some(
                        (item) => pathname === item.href || pathname.startsWith(item.href)
                      ));
                  const isSubmenuOpen = openSubmenu === link.href;

                  if (hasSubmenu) {
                    return (
                      <div key={link.href} className="space-y-1">
                        <button
                          onClick={() =>
                            setOpenSubmenu(isSubmenuOpen ? null : link.href)
                          }
                          className={cn(
                            "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-md text-base font-medium transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground"
                          )}
                          aria-expanded={isSubmenuOpen}
                        >
                          <span>{link.label}</span>
                          <ChevronDown
                            className={cn(
                              "size-4 transition-transform",
                              isSubmenuOpen && "rotate-180"
                            )}
                          />
                        </button>
                        {isSubmenuOpen && (
                          <div className="pl-4 space-y-1">
                            {link.submenu?.map((subItem) => {
                              const isSubActive =
                                pathname === subItem.href ||
                                (subItem.href !== "/" &&
                                  pathname.startsWith(subItem.href));
                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={() => {
                                    setOpen(false);
                                    setOpenSubmenu(null);
                                  }}
                                  className={cn(
                                    "flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    isSubActive
                                      ? "bg-accent text-accent-foreground"
                                      : "text-muted-foreground"
                                  )}
                                  aria-current={isSubActive ? "page" : undefined}
                                >
                                  {subItem.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-3 rounded-md text-base font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
