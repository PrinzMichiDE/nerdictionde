"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Gamepad2, Film, Tv } from "lucide-react";

const categories = [
  { value: "gaming", label: "Gaming", icon: Gamepad2 },
  { value: "movies", label: "Filme", icon: Film },
  { value: "series", label: "Serien", icon: Tv },
] as const;

interface ForumCategoryFilterProps {
  activeCategory?: string;
}

export function ForumCategoryFilter({ activeCategory }: ForumCategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href="/forum"
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors border",
          !activeCategory
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/30"
        )}
      >
        Alle
      </Link>
      {categories.map(({ value, label, icon: Icon }) => (
        <Link
          key={value}
          href={`/forum?category=${value}`}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors border",
            activeCategory === value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/30"
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}
