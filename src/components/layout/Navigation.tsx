"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks, isActive } from "@/lib/navigation";

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav
      className="mx-auto flex max-w-7xl items-center gap-1 px-4 md:px-6 lg:px-8 xl:px-12 h-11"
      aria-label="Main navigation"
    >
      {navLinks.map((link) => {
        const active = isActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className="relative flex h-full items-center px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            data-active={active ? "true" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
            {active && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
