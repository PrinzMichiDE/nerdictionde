"use client";

import { useMemo } from "react";

interface HighlighterProps {
  text: string;
  query: string;
  className?: string;
  tagName?: "mark" | "span";
}

export function Highlighter({
  text,
  query,
  className = "",
  tagName = "mark",
}: HighlighterProps) {
  const highlighted = useMemo(() => {
    if (!query || !query.trim() || !text) return [{ text, highlight: false }];

    const terms = query
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 1)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    if (terms.length === 0) return [{ text, highlight: false }];

    const regex = new RegExp(`(${terms.join("|")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const isHighlight = regex.test(part);
      return { text: part, highlight: isHighlight };
    });
  }, [text, query]);

  return (
    <span className={className}>
      {highlighted.map((part, index) =>
        part.highlight ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-800 text-foreground rounded px-0.5"
            aria-hidden="true"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
}