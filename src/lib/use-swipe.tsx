"use client";

import { useRef, useCallback, type TouchEvent, type ReactNode } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

// Lightweight swipe detector for touch gestures (mobile PWA navigation).
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 50 }: SwipeOptions) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;

      // Ignore mostly-vertical gestures (scrolling)
      if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) {
        startX.current = null;
        startY.current = null;
        return;
      }

      if (dx < 0) onSwipeLeft?.();
      else onSwipeRight?.();

      startX.current = null;
      startY.current = null;
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  return { onTouchStart, onTouchEnd };
}

export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold,
  className,
}: {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  className?: string;
}) {
  const handlers = useSwipe({ onSwipeLeft, onSwipeRight, threshold });
  return (
    <div className={className} {...handlers}>
      {children}
    </div>
  );
}
