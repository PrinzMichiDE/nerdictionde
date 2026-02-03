"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, FileText, Monitor, Wrench, Tag, Calendar, ChevronDown, Wrench as ToolsIcon } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/reviews", label: "Reviews", icon: FileText },
  { href: "/releases", label: "Releases", icon: Calendar },
  { 
    href: "/gaming-pcs", 
    label: "Gaming PCs", 
    icon: Monitor,
    submenu: [
      { href: "/gaming-pcs", label: "Übersicht", icon: Monitor },
      { href: "/pc-builder", label: "PC Builder", icon: Wrench },
    ]
  },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/tools", label: "Tools", icon: ToolsIcon },
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
    <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main navigation">
      {links.map((link) => {
        const Icon = link.icon;
        const hasSubmenu = link.submenu && link.submenu.length > 0;
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href)) || 
          (hasSubmenu && link.submenu?.some(item => pathname === item.href || pathname.startsWith(item.href)));
        const isDropdownOpen = openDropdown === link.href;

        if (hasSubmenu) {
          return (
            <div key={link.href} className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpenDropdown(isDropdownOpen ? null : link.href)}
                className={cn(
                  "relative flex items-center gap-2 md:gap-2.5 lg:gap-3 px-4 md:px-5 lg:px-6 py-2 md:py-2.5 lg:py-3 rounded-lg text-sm md:text-base lg:text-lg font-medium transition-all",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive 
                    ? "text-foreground bg-accent" 
                    : "text-muted-foreground"
                )}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <Icon className="size-4 md:size-5 lg:size-5" />
                <span>{link.label}</span>
                <ChevronDown className={cn(
                  "size-4 transition-transform",
                  isDropdownOpen && "rotate-180"
                )} />
                {isActive && (
                  <span 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                )}
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-popover border rounded-lg shadow-lg z-50 py-1">
                  {link.submenu?.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = pathname === subItem.href || (subItem.href !== "/" && pathname.startsWith(subItem.href));
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={() => setOpenDropdown(null)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          isSubActive 
                            ? "bg-accent text-accent-foreground" 
                            : "text-foreground"
                        )}
                        aria-current={isSubActive ? "page" : undefined}
                      >
                        <SubIcon className="size-4" />
                        <span>{subItem.label}</span>
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
              "relative flex items-center gap-2 md:gap-2.5 lg:gap-3 px-4 md:px-5 lg:px-6 py-2 md:py-2.5 lg:py-3 rounded-lg text-sm md:text-base lg:text-lg font-medium transition-all",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive 
                ? "text-foreground bg-accent" 
                : "text-muted-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-4 md:size-5 lg:size-5" />
            <span>{link.label}</span>
            {isActive && (
              <span 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

