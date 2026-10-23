"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { BrandMark } from "@/components/shared/BrandMark";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function WorkspaceBar() {
  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <Link
          href="/admin"
          className="flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Zur Redaktions-Übersicht"
        >
          <BrandMark className="size-7" />
          <span className="text-base font-semibold tracking-tight">Redaktion</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Zur Website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
