"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

const categories = [
  { name: "Alle", href: "/reviews", value: "all" },
  { name: "Games", href: "/reviews?category=game", value: "game" },
  { name: "Filme", href: "/reviews?category=movie", value: "movie" },
  { name: "Serien", href: "/reviews?category=series", value: "series" },
];

function CategoryFilterContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";

  return (
    <nav className="border-b border-border mb-10 md:mb-14" aria-label="Kategorie Filter">
      <div className="flex flex-wrap items-center gap-1 -mb-px">
        {categories.map((category) => {
          const isActive = currentCategory === category.value && pathname.startsWith("/reviews");

          return (
            <Link
              key={category.value}
              href={category.href}
              className={cn(
                "kicker px-3 md:px-4 py-2.5 md:py-3 -mb-px border-b-2 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-sm",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function CategoryFilter() {
  return (
    <Suspense fallback={<div className="border-b border-border mb-10 md:mb-14 h-11" />}>
      <CategoryFilterContent />
    </Suspense>
  );
}
