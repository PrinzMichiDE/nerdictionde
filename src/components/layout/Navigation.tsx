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
            className="group relative flex h-full items-center px-3.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            data-active={active ? "true" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={`relative z-10 ${
                active ? "text-foreground" : ""
              }`}
            >
              {link.label}
            </span>
            <span
              aria-hidden="true"
              className={`absolute inset-x-1.5 bottom-1 top-1 rounded-sm transition-all duration-200 ${
                active
                  ? "bg-accent"
                  : "bg-transparent group-hover:bg-accent/60"
              }`}
            />
            <span
              aria-hidden="true"
              className={`absolute bottom-0 left-1.5 right-1.5 h-[1.5px] origin-center transition-transform duration-200 ${
                active
                  ? "scale-x-100 bg-primary"
                  : "scale-x-0 bg-primary/70 group-hover:scale-x-100"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
