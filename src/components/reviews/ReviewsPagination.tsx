"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

export function ReviewsPagination({ totalPages, currentPage }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `/reviews?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (startPage > 1) {
        if (startPage > 2) pages.unshift("...");
        pages.unshift(1);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();
  const pad = (n: number) => String(n).padStart(2, "0");

  const arrowClass = cn(
    "inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
  );

  return (
    <nav
      role="navigation"
      aria-label="Seitennavigation"
      className="mt-4 flex flex-col items-center gap-5 border-t border-border pt-8"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          href={createPageURL(1)}
          aria-label="Erste Seite"
          className={cn(arrowClass, "hidden sm:inline-flex", currentPage <= 1 && "pointer-events-none opacity-35")}
          tabIndex={currentPage <= 1 ? -1 : undefined}
          aria-disabled={currentPage <= 1}
        >
          <ChevronsLeft className="size-4" />
        </Link>

        <Link
          href={createPageURL(currentPage - 1)}
          aria-label="Vorherige Seite"
          className={cn(arrowClass, currentPage <= 1 && "pointer-events-none opacity-35")}
          tabIndex={currentPage <= 1 ? -1 : undefined}
          aria-disabled={currentPage <= 1}
        >
          <ChevronLeft className="size-4" />
        </Link>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {pages.map((page, index) =>
            typeof page === "number" ? (
              <Link
                key={index}
                href={createPageURL(page)}
                aria-label={`Seite ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
                data-active={currentPage === page}
                className={cn(
                  "page-btn",
                  currentPage === page && "pointer-events-none"
                )}
              >
                {page}
              </Link>
            ) : (
              <span key={index} className="w-6 text-center text-muted-foreground">
                {page}
              </span>
            )
          )}
        </div>

        <Link
          href={createPageURL(currentPage + 1)}
          aria-label="Nächste Seite"
          className={cn(arrowClass, currentPage >= totalPages && "pointer-events-none opacity-35")}
          tabIndex={currentPage >= totalPages ? -1 : undefined}
          aria-disabled={currentPage >= totalPages}
        >
          <ChevronRight className="size-4" />
        </Link>

        <Link
          href={createPageURL(totalPages)}
          aria-label="Letzte Seite"
          className={cn(arrowClass, "hidden sm:inline-flex", currentPage >= totalPages && "pointer-events-none opacity-35")}
          tabIndex={currentPage >= totalPages ? -1 : undefined}
          aria-disabled={currentPage >= totalPages}
        >
          <ChevronsRight className="size-4" />
        </Link>
      </div>

      <p className="kicker text-muted-foreground" style={{ fontSize: "0.625rem" }}>
        Seite <span className="text-foreground">{pad(currentPage)}</span> von{" "}
        <span className="text-foreground">{pad(totalPages)}</span>
      </p>
    </nav>
  );
}
