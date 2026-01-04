"use client";

import { Button } from "@/components/ui/button";
import { Gamepad2, Cpu, ShoppingCart, Film, Tv } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

const categories = [
  { name: "Alle", href: "/reviews", icon: null, value: "all" },
  { name: "Games", href: "/reviews?category=game", icon: Gamepad2, value: "game" },
  { name: "Filme", href: "/reviews?category=movie", icon: Film, value: "movie" },
  { name: "Serien", href: "/reviews?category=series", icon: Tv, value: "series" },
  { name: "Hardware", href: "/reviews?category=hardware", icon: Cpu, value: "hardware" },
  { name: "Produkte", href: "/reviews?category=product", icon: ShoppingCart, value: "product" },
];

function CategoryFilterContent() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "all";

  return (
    <div className="flex flex-wrap items-center gap-3 mb-12">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = currentCategory === category.value;

        return (
          <Button
            key={category.value}
            asChild
            variant={isActive ? "default" : "outline"}
            size="lg"
            className={cn(
              "rounded-full transition-all duration-300",
              isActive
                ? "shadow-lg scale-105"
                : "hover:scale-105 hover:border-primary/50"
            )}
          >
            <Link href={category.href} className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4" />}
              {category.name}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

export function CategoryFilter() {
  return (
    <Suspense fallback={
      <div className="flex flex-wrap items-center gap-3 mb-12">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.value}
              asChild
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              <Link href={category.href} className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4" />}
                {category.name}
              </Link>
            </Button>
          );
        })}
      </div>
    }>
      <CategoryFilterContent />
    </Suspense>
  );
}
