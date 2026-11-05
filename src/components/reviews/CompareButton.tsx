"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Scale, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Lokaler Vergleich (max. 3 Reviews) in localStorage.
 * Klicken fügt den aktuellen Review hinzu/entfernt und navigiert zur
 * Vergleichsseite `/reviews/vergleichen`, sodass der Vergleich per URL teilbar ist.
 *
 * Hydration-sicher: localStorage wird erst nach dem Mount gelesen.
 * Der Klick-Event wird gestoppt, damit ein umgebender Link nicht mitfeuert.
 */
const STORAGE_KEY = "nerdiction:compare";
const MAX_COMPARE = 3;

interface CompareButtonProps {
  slug: string;
  className?: string;
}

export function CompareButton({ slug, className }: CompareButtonProps) {
  const router = useRouter();
  const [cart, setCart] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setCart(JSON.parse(stored));
    } catch {
      // localStorage nicht verfügbar
    }
  }, []);

  const inCart = cart.includes(slug);
  const full = cart.length >= MAX_COMPARE && !inCart;

  const toggle = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (full) return;

      let next: string[];
      if (inCart) {
        next = cart.filter((s) => s !== slug);
      } else {
        next = [...cart, slug];
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage nicht verfügbar – Vergleich trotzdem nicht blockieren
      }
      setCart(next);

      const params = new URLSearchParams();
      if (next[0]) params.set("a", next[0]);
      if (next[1]) params.set("b", next[1]);
      if (next[2]) params.set("c", next[2]);
      router.push(`/reviews/vergleichen?${params.toString()}`);
    },
    [cart, slug, inCart, full, router],
  );

  const label = inCart
    ? "Aus Vergleich entfernen"
    : full
      ? "Vergleich voll (3)"
      : "Zum Vergleich hinzufügen";

  return (
    <Button
      onClick={toggle}
      disabled={full}
      variant="outline"
      size="sm"
      className={cn("w-full text-[0.75rem] font-medium", className)}
      aria-pressed={inCart}
      aria-label={label}
    >
      {inCart ? (
        <>
          <Scale className="size-3.5" /> {label}
        </>
      ) : (
        <>
          <LinkIcon className="size-3.5" /> {label}
        </>
      )}
    </Button>
  );
}
