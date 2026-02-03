"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface SpoilerSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Optional label for the reveal button */
  label?: string;
}

/**
 * Collapsible spoiler block. Content is hidden until user clicks to reveal.
 */
export function SpoilerSection({ children, className, label = "Spoiler anzeigen" }: SpoilerSectionProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-amber-500/30 bg-amber-500/5 overflow-hidden",
        className
      )}
    >
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="w-full px-4 py-3 text-left text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ⚠️ {label}
        </button>
      ) : (
        <div className="px-4 py-3 text-sm prose prose-sm dark:prose-invert max-w-none">
          {children}
        </div>
      )}
    </div>
  );
}
