"use client";

import { ReactNode, useRef, useState, CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RippleEffect {
  x: number;
  y: number;
  id: number;
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function RippleButton({
  children,
  className,
  onClick,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple: RippleEffect = {
      x,
      y,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  return (
    <Button
      ref={buttonRef}
      onClick={handleClick}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </Button>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface HoverCardProps {
  children: ReactNode;
  hoverContent: ReactNode;
  className?: string;
}

export function HoverCard({ children, hoverContent, className = "" }: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm border-2 border-primary/30 rounded-lg transition-all duration-300 z-10",
          isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        {hoverContent}
      </div>
    </div>
  );
}

interface PulseDotProps {
  className?: string;
  color?: string;
}

export function PulseDot({ className = "", color = "bg-primary" }: PulseDotProps) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn("h-2 w-2 rounded-full", color)} />
      <div
        className={cn(
          "absolute inset-0 rounded-full animate-ping",
          color,
          "opacity-75"
        )}
      />
    </div>
  );
}
