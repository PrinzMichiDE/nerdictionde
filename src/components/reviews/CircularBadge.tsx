import { cn } from "@/lib/utils";

interface CircularBadgeProps {
  text: string;
  className?: string;
  core?: string;
  coreIcon?: React.ReactNode;
}

export function CircularBadge({ text, className, core, coreIcon }: CircularBadgeProps) {
  const circular = text.toUpperCase();

  return (
    <div className={cn("circular-badge", className)} aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs>
          <path
            id="circular-badge-path"
            d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"
            fill="none"
          />
        </defs>
        <text>
          <textPath href="#circular-badge-path" textLength="286">
            {circular}
          </textPath>
        </text>
      </svg>
      <span className="circular-badge-core">
        {coreIcon ??
          (core ? (
            <span className="font-serif font-semibold">{core}</span>
          ) : (
            <span className="text-primary text-xl leading-none">✦</span>
          ))}
      </span>
    </div>
  );
}
