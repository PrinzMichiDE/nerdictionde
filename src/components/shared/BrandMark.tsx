import { useId } from "react";

export function BrandMark({ className }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gradientId = `nerdiction-bg-${uid}`;
  const shadowId = `nerdiction-shadow-${uid}`;

  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy="5"
            stdDeviation="9"
            floodColor="#0b1f47"
            floodOpacity="0.35"
          />
        </filter>
      </defs>
      <rect width="512" height="512" rx="104" fill={`url(#${gradientId})`} />
      <rect
        x="10"
        y="10"
        width="492"
        height="492"
        rx="94"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.22"
        strokeWidth="2"
      />
      <g
        fill="none"
        stroke="#ffffff"
        strokeWidth="56"
        strokeLinecap="round"
        filter={`url(#${shadowId})`}
      >
        <path d="M 196 150 L 196 362" />
        <path d="M 316 150 L 316 362" />
        <path d="M 218.9 133 L 245.8 222.1" />
        <path d="M 266.2 289.9 L 293.1 379" />
      </g>
    </svg>
  );
}
