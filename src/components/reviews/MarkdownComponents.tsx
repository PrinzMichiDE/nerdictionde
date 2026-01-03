"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarkdownComponentsProps {
  images?: string[];
  reviewTitle?: string;
}

export function createMarkdownComponents({
  images = [],
  reviewTitle = "",
}: MarkdownComponentsProps) {
  return {
    p: ({ children, ...props }: any) => {
      const content = children?.toString() || "";
      const match = content.match(/!\[\[IMAGE_(\d+)\]\]/);

      if (match) {
        const index = parseInt(match[1]);
        const imageUrl = images[index];

        if (imageUrl) {
          return (
            <figure className="my-12 relative aspect-video w-full overflow-hidden rounded-2xl border-2 shadow-xl group">
              <Image
                src={imageUrl}
                alt={`${reviewTitle} - Screenshot ${index + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <figcaption className="absolute bottom-4 left-4 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-md backdrop-blur-sm">
                Screenshot {index + 1}
              </figcaption>
            </figure>
          );
        }
        return null;
      }
      return <p {...props}>{children}</p>;
    },
    code: ({ className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match;
      const [copied, setCopied] = useState(false);

      if (isInline) {
        return (
          <code
            className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
            {...props}
          >
            {children}
          </code>
        );
      }

      const codeString = String(children).replace(/\n$/, "");

      const copyToClipboard = () => {
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      return (
        <div className="relative group my-6">
          <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border rounded-t-lg">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {match[1]}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-7 px-2 text-xs"
              aria-label="Code kopieren"
            >
              {copied ? (
                <>
                  <Check className="size-3 mr-1 text-green-500" />
                  Kopiert
                </>
              ) : (
                <>
                  <Copy className="size-3 mr-1" />
                  Kopieren
                </>
              )}
            </Button>
          </div>
          <pre
            className={cn(
              "overflow-x-auto rounded-b-lg bg-muted p-4 text-sm",
              className
            )}
          >
            <code className="font-mono" {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    },
    img: ({ src, alt, ...props }: any) => {
      return (
        <figure className="my-8">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 shadow-lg">
            <Image
              src={src || ""}
              alt={alt || ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
              loading="lazy"
            />
          </div>
          {alt && (
            <figcaption className="mt-2 text-sm text-center text-muted-foreground italic">
              {alt}
            </figcaption>
          )}
        </figure>
      );
    },
    blockquote: ({ children, ...props }: any) => {
      return (
        <blockquote
          className="my-6 border-l-4 border-primary pl-4 italic text-muted-foreground"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    a: ({ href, children, ...props }: any) => {
      const isExternal = href?.startsWith("http");
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-primary hover:underline font-medium"
          {...props}
        >
          {children}
        </a>
      );
    },
  };
}
