"use client";

import { Review } from "@/types/review";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/reviews/ScoreBadge";
import { YouTubeEmbed } from "@/components/reviews/YouTubeEmbed";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

interface PreviewPanelProps {
  review: Review;
}

export function PreviewPanel({ review }: PreviewPanelProps) {
  // Custom component for Markdown images to handle placeholders
  const MarkdownComponents = {
    p: ({ children, ...props }: any) => {
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
        return <div className="my-6 p-4 border border-dashed rounded text-[10px] text-center text-muted-foreground uppercase">Bild Platzhalter {index} (Nicht verfügbar)</div>;
      }
      return <p {...props}>{children}</p>;
    },
  };

  return (
    <div className="space-y-8 max-w-full pb-8">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Badge className="capitalize">{review.category}</Badge>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Draft Preview</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {review.title || "Titel eingeben..."}
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
          <span className="text-muted-foreground text-[10px] uppercase tracking-widest">Kein Bild</span>
        )}
      </div>

      {/* YouTube Videos Preview */}
      {review.youtubeVideos && review.youtubeVideos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Videos & Trailer
          </h3>
          <div className="grid gap-4">
            {review.youtubeVideos.map((videoId, index) => (
              <YouTubeEmbed
                key={index}
                videoId={videoId}
                title={`${review.title} - Video ${index + 1}`}
                className="border-2"
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
            components={MarkdownComponents as any}
          >
            {review.content || "Inhalt schreiben oder generieren lassen..."}
          </ReactMarkdown>
        </div>

        <div className="p-6 border-2 border-primary/10 rounded-xl bg-primary/5 flex flex-col items-center space-y-2">
          <span className="text-[10px] font-bold uppercase text-primary/60 tracking-widest">Vorschau Wertung</span>
          <ScoreBadge score={review.score} className="h-16 w-16 text-2xl border-2 border-background shadow-md" />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3 p-4 rounded-lg bg-green-500/5 border border-green-500/10">
                <h4 className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Pro</h4>
                <ul className="space-y-2">
                    {review.pros.map((p, i) => (
                        <li key={i} className="text-[11px] flex items-start leading-snug">
                            <span className="mr-2 text-green-500">✓</span> {p}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="space-y-3 p-4 rounded-lg bg-red-500/5 border border-red-500/10">
                <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Contra</h4>
                <ul className="space-y-2">
                    {review.cons.map((c, i) => (
                        <li key={i} className="text-[11px] flex items-start leading-snug">
                            <span className="mr-2 text-red-500">✗</span> {c}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
}

