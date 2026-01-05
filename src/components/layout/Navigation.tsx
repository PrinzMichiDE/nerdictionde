"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, FileText, Monitor } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/reviews", label: "Reviews", icon: FileText },
  { href: "/gaming-pcs", label: "Gaming PCs", icon: Monitor },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1 lg:gap-2" aria-label="Main navigation">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        
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

