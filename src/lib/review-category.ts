import type { ReviewCategory } from "@/types/review";

export interface ReviewCategoryStyle {
  label: string;
  dot: string;
  color: string;
}

export const REVIEW_CATEGORIES: ReviewCategory[] = ["game", "movie", "series", "hardware"];

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
  hardware: {
    label: "Hardware",
    dot: "var(--chart-1)",
    color: "var(--chart-1)",
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
  if (score >= 75) return "var(--chart-2)";
  if (score >= 50) return "var(--chart-4)";
  if (score >= 25) return "var(--chart-1)";
  return "var(--destructive)";
}

export function stripMarkdown(text: string): string {
  return text.replace(/[#*`>_-]/g, " ").replace(/\s+/g, " ").trim();
}
