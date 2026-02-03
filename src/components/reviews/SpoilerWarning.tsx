"use client";

import { cn } from "@/lib/utils";

interface SpoilerWarningProps {
  className?: string;
  /** Optional short message */
  message?: string;
}

/**
 * Banner shown above content that may contain spoilers (e.g. movie/series reviews).
 */
export function SpoilerWarning({
  className,
  message = "Dieser Abschnitt kann Spoiler enthalten.",
}: SpoilerWarningProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 rounded-lg border-2 border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200",
        className
      )}
    >
      <span className="text-lg" aria-hidden>
        ⚠️
      </span>
      <span>{message}</span>
    </div>
  );
}
