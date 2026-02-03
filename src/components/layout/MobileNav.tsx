"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { cn } from "@/lib/utils";
import { Home, FileText, Monitor, Wrench, Tag, Calendar } from "lucide-react";

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
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="size-9"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        aria-expanded={open}
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
            className="fixed top-16 left-0 right-0 z-50 border-b bg-background md:hidden animate-slide-up max-h-[calc(100vh-4rem)] overflow-y-auto"
            aria-label="Mobile navigation"
          >
            <div className="container px-4 py-4 space-y-4">
              <div className="pb-2 border-b">
                <GlobalSearch />
              </div>
              <div className="space-y-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  const hasSubmenu = link.submenu && link.submenu.length > 0;
                  const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href)) ||
                    (hasSubmenu && link.submenu?.some(item => pathname === item.href || pathname.startsWith(item.href)));
                  const isSubmenuOpen = openSubmenu === link.href;

                  if (hasSubmenu) {
                    return (
                      <div key={link.href} className="space-y-1">
                        <button
                          onClick={() => setOpenSubmenu(isSubmenuOpen ? null : link.href)}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive 
                              ? "bg-accent text-accent-foreground" 
                              : "text-foreground"
                          )}
                          aria-expanded={isSubmenuOpen}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="size-5" />
                            <span>{link.label}</span>
                          </div>
                          <ChevronDown className={cn(
                            "size-4 transition-transform",
                            isSubmenuOpen && "rotate-180"
                          )} />
                        </button>
                        {isSubmenuOpen && (
                          <div className="pl-4 space-y-1">
                            {link.submenu?.map((subItem) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = pathname === subItem.href || (subItem.href !== "/" && pathname.startsWith(subItem.href));
                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={() => {
                                    setOpen(false);
                                    setOpenSubmenu(null);
                                  }}
                                  className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    "hover:bg-accent hover:text-accent-foreground",
                                    isSubActive 
                                      ? "bg-accent text-accent-foreground" 
                                      : "text-muted-foreground"
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
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive 
                          ? "bg-accent text-accent-foreground" 
                          : "text-foreground"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="size-5" />
                      <span>{link.label}</span>
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

