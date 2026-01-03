"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

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

  return (
    <nav 
      role="navigation" 
      aria-label="Pagination Navigation" 
      className="flex flex-col items-center gap-4 py-8"
    >
      <div className="flex items-center gap-1 sm:gap-2">
        {/* First Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-9 hidden sm:flex"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={createPageURL(1)} aria-label="Erste Seite">
              <ChevronsLeft className="size-4" />
            </Link>
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={createPageURL(currentPage - 1)} aria-label="Vorherige Seite">
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 sm:gap-2 mx-2">
          {pages.map((page, index) => (
            typeof page === "number" ? (
              <Button
                key={index}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className={cn(
                  "size-9 text-sm font-medium",
                  currentPage === page ? "pointer-events-none" : ""
                )}
                asChild={currentPage !== page}
              >
                {currentPage !== page ? (
                  <Link href={createPageURL(page)} aria-label={`Seite ${page}`}>
                    {page}
                  </Link>
                ) : (
                  <span>{page}</span>
                )}
              </Button>
            ) : (
              <span key={index} className="w-9 text-center text-muted-foreground">
                {page}
              </span>
            )
          ))}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-9"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
        >
          {currentPage < totalPages ? (
            <Link href={createPageURL(currentPage + 1)} aria-label="Nächste Seite">
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="icon"
          className="size-9 hidden sm:flex"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
        >
          {currentPage < totalPages ? (
            <Link href={createPageURL(totalPages)} aria-label="Letzte Seite">
              <ChevronsRight className="size-4" />
            </Link>
          ) : (
            <ChevronsRight className="size-4" />
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground font-medium">
        Seite {currentPage} von {totalPages}
      </p>
    </nav>
  );
}

