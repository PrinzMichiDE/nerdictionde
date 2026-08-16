import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./ScrollReveal";

interface SectionHeadingProps {
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}

export function SectionHeading({
  kicker,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <ScrollReveal
      className={cn(
        "flex flex-col gap-3",
        align === "center"
          ? "items-center text-center mx-auto max-w-3xl"
          : "items-start text-left",
        className
      )}
    >
      {kicker && (
        <span className="kicker inline-flex items-center gap-2 text-primary">
          <span className="h-px w-6 bg-current opacity-60" aria-hidden="true" />
          {kicker}
          {align === "center" && (
            <span className="h-px w-6 bg-current opacity-60" aria-hidden="true" />
          )}
        </span>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] text-balance">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed text-pretty">
          {description}
        </p>
      )}
    </ScrollReveal>
  );
}
