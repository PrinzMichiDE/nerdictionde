"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { BookmarkButton } from "@/components/shared/BookmarkButton";
import { CompareButton } from "./CompareButton";
import { ReviewPdfDownload } from "./ReviewPdfDownload";

interface ReviewActionsProps {
  title: string;
  url: string;
  slug: string;
  reviewId: string;
  isLoggedIn: boolean;
  initialBookmarked?: boolean;
  lang?: string;
}

export function ReviewActions({
  title,
  url,
  slug,
  reviewId,
  isLoggedIn,
  initialBookmarked,
  lang = "de",
}: ReviewActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ShareButtons
        contentType="review"
        contentId={reviewId}
        title={title}
        url={url}
        variant="inline"
        showLabels={true}
      />

      <ReviewPdfDownload reviewId={reviewId} lang={lang} />

      <Button
        variant="outline"
        size="sm"
        onClick={() => window.print()}
        className="h-9 rounded-full px-4 gap-2 transition-colors hover:border-primary/50"
        aria-label="Review drucken"
      >
        <Printer className="size-4" />
        <span className="text-xs font-semibold">Drucken</span>
      </Button>

      <CompareButton slug={slug} className="flex-1" />

      {isLoggedIn && (
        <BookmarkButton
          reviewId={reviewId}
          initialBookmarked={initialBookmarked}
        />
      )}
    </div>
  );
}
