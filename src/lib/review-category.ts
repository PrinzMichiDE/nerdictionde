import type { ReviewCategory } from "@/types/review";

export interface ReviewCategoryStyle {
  label: string;
  dot: string;
  color: string;
}

export const REVIEW_CATEGORIES: ReviewCategory[] = ["game", "movie", "series"];

export const reviewCategoryStyles: Record<ReviewCategory, ReviewCategoryStyle> = {
  game: {
    label: "Games",
    dot: "var(--chart-3)",
    color: "var(--chart-3)",
  },
  movie: {
    label: "Filme",
    dot: "var(--chart-2)",
    color: "var(--chart-2)",
  },
  series: {
    label: "Serien",
    dot: "var(--chart-5)",
    color: "var(--chart-5)",
  },
};

export function getCategoryStyle(category: string): ReviewCategoryStyle {
  return (
    reviewCategoryStyles[category as ReviewCategory] ?? {
      label: category.charAt(0).toUpperCase() + category.slice(1),
      dot: "var(--primary)",
      color: "var(--primary)",
    }
  );
}

export function getVerdict(score: number): string {
  if (score >= 90) return "Phänomenal";
  if (score >= 80) return "Hervorragend";
  if (score >= 70) return "Gut";
  if (score >= 60) return "Solide";
  if (score >= 50) return "Mittelmaß";
  return "Enttäuschend";
}

export function getScoreColor(score: number): string {
  if (score >= 90) return "var(--chart-3)";
  if (score >= 75) return "oklch(0.65 0.16 130)";
  if (score >= 50) return "oklch(0.72 0.17 70)";
  if (score >= 25) return "oklch(0.68 0.16 45)";
  return "var(--destructive)";
}

export function stripMarkdown(text: string): string {
  return text.replace(/[#*`>_-]/g, " ").replace(/\s+/g, " ").trim();
}
