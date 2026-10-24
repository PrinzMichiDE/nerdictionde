"use client";

import { Review } from "@/types/review";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { YouTubeEmbed } from "@/components/reviews/YouTubeEmbed";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

type MarkdownComponents = React.ComponentProps<typeof ReactMarkdown>["components"];

interface PreviewPanelProps {
  review: Review;
}

export function PreviewPanel({ review }: PreviewPanelProps) {
  // Custom component for Markdown images to handle placeholders
  const components: MarkdownComponents = {
    p: ({ children, ...props }) => {
      const content = children?.toString() || "";
      const match = content.match(/!\[\[IMAGE_(\d+)\]\]/);
      
      if (match) {
        const index = parseInt(match[1]);
        const imageUrl = review.images[index];
        
        if (imageUrl) {
          return (
            <div className="my-6 relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <Image src={imageUrl} alt={`Preview ${index}`} fill className="object-cover" unoptimized />
            </div>
          );
        }
        return <div className="my-6 rounded border border-dashed p-4 text-center text-xs text-muted-foreground">Bildplatzhalter {index} (nicht verfügbar)</div>;
      }
      return <p {...props}>{children}</p>;
    },
  };

  return (
    <div className="space-y-8 max-w-full pb-8">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Badge className="capitalize">{review.category}</Badge>
          <span className="text-xs text-muted-foreground">Vorschau</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {review.title || "Titel eingeben"}
        </h1>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted/50 flex items-center justify-center">
        {review.images?.[0] ? (
          <Image
            src={review.images[0]}
            alt={review.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="text-xs text-muted-foreground">Kein Bild</span>
        )}
      </div>

      {/* YouTube Videos Preview */}
      {review.youtubeVideos && review.youtubeVideos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Videos & Trailer
          </h3>
          <div className="grid gap-4">
            {review.youtubeVideos.map((videoId, index) => (
              <YouTubeEmbed
                key={index}
                videoId={videoId}
                title={`${review.title} - Video ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="prose prose-sm dark:prose-invert max-w-none bg-background/50 p-4 rounded-lg border border-border/50 prose-headings:scroll-mt-20">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
            components={components}
          >
            {review.content || "Inhalt schreiben oder generieren lassen"}
          </ReactMarkdown>
        </div>

        <div className="flex flex-col items-center space-y-2 rounded-lg border border-border bg-muted/30 p-5">
          <span className="text-xs text-muted-foreground">Wertung</span>
          <ScoreBadge score={review.score} className="h-14 w-14 text-2xl" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-success/20 bg-success/5 p-4">
                <h4 className="text-xs font-medium text-success">Pro</h4>
                <ul className="space-y-2">
                    {review.pros.map((p, i) => (
                        <li key={i} className="flex items-start text-sm leading-snug">
                            <span className="mr-2 text-success">✓</span> {p}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <h4 className="text-xs font-medium text-destructive">Contra</h4>
                <ul className="space-y-2">
                    {review.cons.map((c, i) => (
                        <li key={i} className="flex items-start text-sm leading-snug">
                            <span className="mr-2 text-destructive">✗</span> {c}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
}

