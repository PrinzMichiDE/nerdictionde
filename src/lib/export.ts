/**
 * Export utilities for reviews
 * PDF export, share links, etc.
 */

/**
 * Generate shareable link with preview
 */
export function generateShareLink(
  reviewSlug: string,
  options: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  } = {}
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nerdiction.de";
  const url = new URL(`${baseUrl}/reviews/${reviewSlug}`);

  if (options.utm_source) {
    url.searchParams.set("utm_source", options.utm_source);
  }
  if (options.utm_medium) {
    url.searchParams.set("utm_medium", options.utm_medium);
  }
  if (options.utm_campaign) {
    url.searchParams.set("utm_campaign", options.utm_campaign);
  }

  return url.toString();
}

/**
 * Copy to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        document.body.removeChild(textArea);
        return true;
      } catch {
        document.body.removeChild(textArea);
        return false;
      }
    }
  } catch {
    return false;
  }
}

/**
 * Generate PDF export (client-side)
 * Uses browser's print functionality
 */
export function exportToPDF() {
  if (typeof window === "undefined") return;

  // Add print styles
  const style = document.createElement("style");
  style.textContent = `
    @media print {
      @page {
        margin: 2cm;
      }
      body * {
        visibility: hidden;
      }
      article, article * {
        visibility: visible;
      }
      article {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);

  window.print();

  // Remove style after printing
  setTimeout(() => {
    document.head.removeChild(style);
  }, 1000);
}

/**
 * Generate markdown export
 */
export function exportToMarkdown(review: {
  title: string;
  content: string;
  score: number;
  pros: string[];
  cons: string[];
  category: string;
}): string {
  const date = new Date().toLocaleDateString("de-DE");
  
  return `# ${review.title}

**Kategorie:** ${review.category}  
**Score:** ${review.score}/100  
**Datum:** ${date}

## Bewertung

${review.content}

## Pro

${review.pros.map((pro) => `- ${pro}`).join("\n")}

## Contra

${review.cons.map((con) => `- ${con}`).join("\n")}

---
*Exportiert von Nerdiction.de*
`;
}

/**
 * Download as markdown file
 */
export function downloadAsMarkdown(
  review: {
    title: string;
    content: string;
    score: number;
    pros: string[];
    cons: string[];
    category: string;
  },
  filename?: string
) {
  const markdown = exportToMarkdown(review);
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || `${review.title.toLowerCase().replace(/\s+/g, "-")}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
