"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TriangleAlert } from "lucide-react";

interface SpoilerSectionProps {
  children: React.ReactNode;
  className?: string;
  label?: string;
  isEn?: boolean;
}

export function SpoilerSection({
  children,
  className,
  label,
  isEn = false,
}: SpoilerSectionProps) {
  const [revealed, setRevealed] = useState(false);
  const buttonLabel =
    label ?? (isEn ? "Reveal spoilers" : "Spoiler anzeigen");

  return (
    <div
      className={cn(
        "rounded-md border border-amber-500/40 overflow-hidden",
        className
      )}
    >
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          aria-expanded={revealed}
          className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {buttonLabel}
        </button>
      ) : (
        <div className="px-4 py-3 text-sm prose prose-sm dark:prose-invert max-w-none">
          {children}
        </div>
      )}
    </div>
  );
}
