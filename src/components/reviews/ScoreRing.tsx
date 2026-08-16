"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { getScoreColor } from "@/lib/review-category";

interface ScoreRingProps {
  score: number;
  size?: number;
  ringWidth?: number;
  className?: string;
  /** Hintergrundfarbe des inneren Loches (Standard: --card) */
  hole?: string;
  delay?: number;
  showVerdict?: boolean;
}

export function ScoreRing({
  score,
  size = 56,
  ringWidth = 4,
  className,
  hole = "var(--card)",
  delay = 0,
  showVerdict = false,
}: ScoreRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState(0);

  const numericScore = typeof score === "number" ? score : Number(score) || 0;
  const safeScore = Math.max(0, Math.min(100, isNaN(numericScore) ? 0 : numericScore));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      const id = globalThis.setTimeout(() => setInView(true), 0);
      return () => globalThis.clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    let frame: number;
    const duration = 1500;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(safeScore * ease(t)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, safeScore]);

  const fontSize = Math.max(12, Math.round(size * 0.32));

  return (
    <div
      className={cn("flex flex-col items-center gap-1.5", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      <div
        ref={ref}
        className={cn(
          "score-ring",
          inView && "is-inview"
        )}
        style={
          {
            width: size,
            height: size,
            "--score-target": `${safeScore}%`,
            "--ring-color": getScoreColor(safeScore),
            "--ring-w": `${ringWidth}px`,
            "--ring-hole": hole,
          } as CSSProperties
        }
        role="img"
        aria-label={`Score: ${safeScore} von 100`}
      >
        <span
          className="score-ring-inner font-bold"
          style={{ fontSize }}
        >
          {display}
        </span>
      </div>
      {showVerdict && (
        <span
          className="kicker text-muted-foreground"
          style={{ fontSize: "0.625rem" }}
        >
          {safeScore >= 90 ? "Phänomenal" : safeScore >= 80 ? "Hervorragend" : safeScore >= 70 ? "Gut" : safeScore >= 60 ? "Solide" : safeScore >= 50 ? "Mittelmaß" : "Enttäuschend"}
        </span>
      )}
    </div>
  );
}
