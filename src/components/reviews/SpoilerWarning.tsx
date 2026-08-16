"use client";

import { cn } from "@/lib/utils";
import { TriangleAlert } from "lucide-react";

interface SpoilerWarningProps {
  className?: string;
  message?: string;
}

export function SpoilerWarning({
  className,
  message = "Dieser Abschnitt kann Spoiler enthalten.",
}: SpoilerWarningProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200",
        className
      )}
    >
      <TriangleAlert className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
