"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, FileText } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/reviews", label: "Reviews", icon: FileText },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive 
                ? "text-foreground bg-accent" 
                : "text-muted-foreground"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-4" />
            <span>{link.label}</span>
            {isActive && (
              <span 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

