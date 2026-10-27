"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintButtonProps {
  label?: string;
  ariaLabel?: string;
  className?: string;
}

export function PrintButton({
  label = "Drucken",
  ariaLabel = "Artikel drucken",
  className = "h-9 rounded-full px-4 gap-2 transition-colors hover:border-primary/50",
}: PrintButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className={className}
      aria-label={ariaLabel}
    >
      <Printer className="size-4" />
      <span className="text-xs font-semibold">{label}</span>
    </Button>
  );
}
