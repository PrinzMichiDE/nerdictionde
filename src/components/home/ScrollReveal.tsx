"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "left" | "right" | "zoom" | "blur" | "fade";

interface ScrollRevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  id?: string;
}

const variantClasses: Record<RevealVariant, string> = {
  up: "",
  left: "reveal-left",
  right: "reveal-right",
  zoom: "reveal-zoom",
  blur: "reveal-blur",
  fade: "reveal-fade",
};

let sharedObserver: IntersectionObserver | null = null;
const pendingElements = new Map<Element, (visible: boolean) => void>();

function getSharedObserver() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const cb = pendingElements.get(entry.target);
        if (entry.isIntersecting && cb) {
          cb(true);
          pendingElements.delete(entry.target);
          sharedObserver!.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  return sharedObserver;
}

export function ScrollReveal({
  children,
  variant = "up",
  delay = 0,
  className,
  id,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    if (!("IntersectionObserver" in window)) {
      const tid = globalThis.setTimeout(() => setVisible(true), 0);
      return () => globalThis.clearTimeout(tid);
    }

    const observer = getSharedObserver();
    pendingElements.set(el, setVisible);
    observer.observe(el);

    return () => {
      pendingElements.delete(el);
      observer.unobserve(el);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        "reveal",
        variantClasses[variant],
        visible && "reveal-visible",
        className
      )}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
