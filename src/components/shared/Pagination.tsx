"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
  baseUrl?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel = "Pagination",
  baseUrl,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label={ariaLabel} className="flex items-center justify-center gap-1">
      {/* Previous */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-sm border border-border bg-background text-sm font-medium transition-colors",
          currentPage <= 1
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label="Vorherige Seite"
        aria-disabled={currentPage <= 1}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>

      {/* Page numbers */}
      {pages.map((page, index) => {
        if (page === "ellipsis") {
          return (
            <span
              key={`ellipsis-${index}`}
              className="h-8 w-8 flex items-center justify-center text-sm text-muted-foreground"
              aria-hidden="true"
            >
              …
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        if (baseUrl) {
          return (
            <Link
              key={pageNum}
              href={`${baseUrl}${baseUrl.includes("?") ? "&" : "?"}page=${pageNum}`}
              className={cn(
                "inline-flex items-center justify-center h-8 w-8 min-w-[2rem] rounded-sm border border-border text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label={`Seite ${pageNum}`}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNum}
            </Link>
          );
        }

        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            className={cn(
              "inline-flex items-center justify-center h-8 w-8 min-w-[2rem] rounded-sm border border-border text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label={`Seite ${pageNum}`}
            aria-current={isActive ? "page" : undefined}
            aria-pressed={isActive}
          >
            {pageNum}
          </button>
        );
      })}

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(
          "inline-flex items-center justify-center h-8 w-8 rounded-sm border border-border bg-background text-sm font-medium transition-colors",
          currentPage >= totalPages
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        aria-label="Nächste Seite"
        aria-disabled={currentPage >= totalPages}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (currentPage > 4) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 3) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);

  return pages;
}