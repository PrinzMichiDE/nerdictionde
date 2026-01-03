"use client";

import { useState } from "react";
import { Download, Share2, FileText, Link as LinkIcon, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Review } from "@/types/review";
import { copyToClipboard, downloadAsMarkdown, exportToPDF, generateShareLink } from "@/lib/export";
import { trackEvent } from "@/lib/analytics";

interface ExportMenuProps {
  review: Review;
  className?: string;
}

export function ExportMenu({ review, className }: ExportMenuProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const link = generateShareLink(review.slug);
    const success = await copyToClipboard(link);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent("share_link_copied", { reviewId: review.id });
    }
  };

  const handleExportPDF = () => {
    exportToPDF();
    trackEvent("export_pdf", { reviewId: review.id });
  };

  const handleExportMarkdown = () => {
    downloadAsMarkdown({
      title: review.title,
      content: review.content,
      score: review.score,
      pros: review.pros,
      cons: review.cons,
      category: review.category,
    });
    trackEvent("export_markdown", { reviewId: review.id });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="mr-2 size-4" />
          Teilen & Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="mr-2 size-4 text-green-500" />
              Link kopiert!
            </>
          ) : (
            <>
              <LinkIcon className="mr-2 size-4" />
              Link kopieren
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="mr-2 size-4" />
          Als PDF exportieren
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportMarkdown}>
          <Download className="mr-2 size-4" />
          Als Markdown exportieren
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
