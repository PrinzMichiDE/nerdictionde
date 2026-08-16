"use client";

import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          aria-live="polite"
          className={cn(
            "pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300",
            t.variant === "destructive"
              ? "bg-destructive text-destructive-foreground border-destructive"
              : "bg-background text-foreground border-border"
          )}
        >
          {t.variant === "destructive" ? (
            <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
          )}
          <div className="min-w-0">
            {t.title && <div className="font-semibold text-sm">{t.title}</div>}
            {t.description && (
              <div className="text-sm mt-0.5 opacity-90">{t.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
