"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

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

export function Navigation() {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdown]);

  return (
    <nav
      className="hidden md:flex items-center gap-1 container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 h-11"
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const hasSubmenu = link.submenu && link.submenu.length > 0;
        const isActive =
          pathname === link.href ||
          (link.href !== "/" && pathname.startsWith(link.href)) ||
          (hasSubmenu &&
            link.submenu?.some(
              (item) => pathname === item.href || pathname.startsWith(item.href)
            ));
        const isDropdownOpen = openDropdown === link.href;

        if (hasSubmenu) {
          return (
            <div key={link.href} className="relative h-full" ref={dropdownRef}>
              <button
                onClick={() => setOpenDropdown(isDropdownOpen ? null : link.href)}
                className={cn(
                  "relative h-full flex items-center gap-1.5 px-3 lg:px-4 text-sm font-semibold uppercase tracking-[0.08em] transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                  isDropdownOpen && "text-primary"
                )}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <span>{link.label}</span>
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform",
                    isDropdownOpen && "rotate-180"
                  )}
                />
                <span
                  className={cn(
                    "absolute inset-x-3 bottom-0 h-0.5 bg-primary transition-opacity",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden="true"
                />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-52 bg-popover border border-border rounded-md shadow-lg shadow-border/30 py-1.5 mt-1">
                  {link.submenu?.map((subItem) => {
                    const isSubActive =
                      pathname === subItem.href ||
                      (subItem.href !== "/" && pathname.startsWith(subItem.href));
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setOpenDropdown(null)}
                        className={cn(
                          "flex items-center px-4 py-2.5 text-sm font-medium transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          isSubActive
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground"
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
            className={cn(
              "relative h-full flex items-center px-3 lg:px-4 text-sm font-semibold uppercase tracking-[0.08em] transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <span>{link.label}</span>
            <span
              className={cn(
                "absolute inset-x-3 bottom-0 h-0.5 bg-primary transition-opacity",
                isActive ? "opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            />
          </Link>
        );
      })}
    </nav>
  );
}
