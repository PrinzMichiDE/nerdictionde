"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/shared/GlobalSearch";
import { cn } from "@/lib/utils";
import { Home, FileText } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/reviews", label: "Reviews", icon: FileText },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
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
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav 
            className="fixed top-16 left-0 right-0 z-50 border-b bg-background md:hidden animate-slide-up"
            aria-label="Mobile navigation"
          >
            <div className="container px-4 py-4 space-y-4">
              <div className="pb-2 border-b">
                <GlobalSearch />
              </div>
              <div className="space-y-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                  
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

