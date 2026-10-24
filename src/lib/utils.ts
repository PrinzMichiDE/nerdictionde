import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    game: "text-purple-500 bg-purple-500/10",
    movie: "text-amber-500 bg-amber-500/10",
    series: "text-sky-500 bg-sky-500/10",
    hardware: "text-emerald-500 bg-emerald-500/10",
  };
  return colors[category] || "text-muted-foreground bg-muted";
}
