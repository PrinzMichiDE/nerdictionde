"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/reviews", label: "Reviews" },
  { href: "/releases", label: "Releases" },
  { href: "/tools", label: "Tools" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden md:flex items-center gap-1 container max-w-7xl mx-auto px-4 md:px-6 lg:px-8 xl:px-12 h-11"
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/" && pathname.startsWith(link.href));

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
