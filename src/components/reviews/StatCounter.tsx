"use client";

import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function StatCounter({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1400,
}: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      const id = globalThis.setTimeout(() => setDisplay(value), 0);
      return () => globalThis.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();

          const start = performance.now();
          const factor = Math.pow(10, decimals);
          const ease = (t: number) => 1 - Math.pow(1 - t, 3);

          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            setDisplay(Math.round(value * ease(t) * factor) / factor);
            if (t < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, decimals, duration]);

  const formatted = display.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
