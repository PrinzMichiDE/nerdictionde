import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root } from "mdast";
import type { ReactNode } from "react";
import { Text as PdfText, View, Link as PdfLink, Image as PdfImage } from "@react-pdf/renderer";

interface MarkdownToPdfOptions {
  reviewImages: string[];
  isEn: boolean;
}

const pdfTextBaseStyle = {
  fontSize: 11,
  lineHeight: 1.6,
  color: "#1a1a2e",
  fontFamily: "Helvetica",
} as const;

type HeadingStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  marginTop: number;
  marginBottom: number;
  color: string;
  borderBottomWidth?: number;
  borderBottomColor?: string;
  paddingBottom?: number;
};

const headingStyles: Record<number, HeadingStyle> = {
  1: { fontFamily: "Times-Roman", fontSize: 22, fontWeight: "bold", marginTop: 24, marginBottom: 12, color: "#1a1a2e", borderBottomWidth: 1, borderBottomColor: "#e0e0e0", paddingBottom: 4 },
  2: { fontFamily: "Times-Roman", fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 10, color: "#1f2937" },
  3: { fontFamily: "Times-Roman", fontSize: 15, fontWeight: "bold", marginTop: 16, marginBottom: 8, color: "#374151" },
  4: { fontFamily: "Times-Roman", fontSize: 13, fontWeight: "bold", marginTop: 14, marginBottom: 6, color: "#374151" },
  5: { fontFamily: "Times-Roman", fontSize: 12, fontWeight: "bold", marginTop: 12, marginBottom: 6, color: "#374151" },
  6: { fontFamily: "Times-Roman", fontSize: 11, fontWeight: "bold", marginTop: 10, marginBottom: 6, color: "#374151" },
};

type MdastNode = {
  type: string;
  value?: string;
  children?: MdastNode[];
  depth?: number;
  ordered?: boolean;
  start?: number;
  url?: string;
};

function inlineChildrenToPdfNodes(children: MdastNode[]): ReactNode[] {
  const nodes: ReactNode[] = [];

  for (const child of children) {
    switch (child.type) {
      case "text":
        nodes.push(child.value ?? "");
        break;
      case "strong":
        nodes.push(
          <PdfText style={{ ...pdfTextBaseStyle, fontWeight: "bold" }}>
            {inlineChildrenToPdfNodes(child.children || [])}
          </PdfText>
        );
        break;
      case "emphasis":
        nodes.push(
          <PdfText style={{ ...pdfTextBaseStyle, fontStyle: "italic" }}>
            {inlineChildrenToPdfNodes(child.children || [])}
          </PdfText>
        );
        break;
      case "link":
        nodes.push(
          <PdfLink href={child.url ?? ""} style={{ ...pdfTextBaseStyle, color: "#3b82f6", textDecoration: "underline" }}>
            {inlineChildrenToPdfNodes(child.children || [])}
          </PdfLink>
        );
        break;
      case "inlineCode":
        nodes.push(
          <PdfText style={{ ...pdfTextBaseStyle, fontFamily: "Courier", backgroundColor: "#f3f4f6", paddingHorizontal: 2, borderRadius: 2 }}>
            {child.value ?? ""}
          </PdfText>
        );
        break;
      default:
        if (child.children) {
          nodes.push(...inlineChildrenToPdfNodes(child.children));
        }
        break;
    }
  }

  return nodes;
}

function mdastNodeToPdfNodes(node: MdastNode, options: MarkdownToPdfOptions, headingIds: Map<string, string>): ReactNode[] {
  const nodes: ReactNode[] = [];

  switch (node.type) {
    case "heading": {
      const level = Math.min(node.depth ?? 1, 6);
      const text = node.children?.map((c) => c.type === "text" ? c.value : "").join("") || "";
      const id = headingIds.get(text) || text.toLowerCase().replace(/\s+/g, "-");
      nodes.push(
        <PdfText key={id} style={headingStyles[level]} id={id}>
          {text}
        </PdfText>
      );
      break;
    }

    case "paragraph": {
      const children = inlineChildrenToPdfNodes(node.children || []);
      // Check for image placeholder ![ [IMAGE_n] ]
      const textContent = node.children?.map((c) => c.type === "text" ? c.value : "").join("") || "";
      const imageMatch = textContent.match(/!\[\[IMAGE_(\d+)\]\]/);
      if (imageMatch && options.reviewImages) {
        const index = parseInt(imageMatch[1], 10);
        const imageUrl = options.reviewImages[index];
        if (imageUrl) {
          nodes.push(
            <View key={`img-${index}`} style={{ marginBottom: 16, alignItems: "center" }}>
              <PdfImage src={imageUrl} style={{ maxWidth: "100%", height: "auto" }} />
              <PdfText style={{ fontSize: 9, color: "#9ca3af", textAlign: "center", marginTop: 4, fontStyle: "italic" }}>
                Abbildung {index + 1}
              </PdfText>
            </View>
          );
          break;
        }
      }
      nodes.push(
        <View key={`p-${Math.random()}`} style={{ marginBottom: 10 }}>
          {children}
        </View>
      );
      break;
    }

    case "blockquote": {
      const children = node.children?.flatMap((c) => mdastNodeToPdfNodes(c, options, headingIds)) || [];
      nodes.push(
        <View
          key={`blockquote-${Math.random()}`}
          style={{ marginVertical: 12, paddingLeft: 16, borderLeftWidth: 4, borderLeftColor: "#3b82f6", backgroundColor: "#eff6ff", borderRadius: 4, paddingVertical: 12, paddingHorizontal: 16 }}
        >
          {children}
        </View>
      );
      break;
    }

    case "list": {
      const ordered = node.ordered || false;
      const start = node.start || 1;
      let counter = start;
      const listItems = node.children
        ?.filter((c) => c.type === "listItem")
        .map((item, idx) => {
          const bullet = ordered ? `${counter++}.` : "•";
          const itemChildren = item.children?.flatMap((c) => mdastNodeToPdfNodes(c, options, headingIds)) || [];
          return (
            <View key={`list-item-${idx}`} style={{ flexDirection: "row", marginBottom: 6 }}>
              <PdfText style={{ width: 20, textAlign: "right", paddingRight: 8, ...pdfTextBaseStyle }}>{bullet}</PdfText>
              <View style={{ flex: 1 }}>{itemChildren}</View>
            </View>
          );
        }) || [];
      nodes.push(...listItems);
      break;
    }

    case "table": {
      const rows: ReactNode[] = [];
      let isHeader = true;
      for (const row of node.children || []) {
        if (row.type === "tableRow") {
          const cells: ReactNode[] = [];
          let cellIndex = 0;
          for (const cell of row.children || []) {
            if (cell.type === "tableCell") {
              const cellChildren = inlineChildrenToPdfNodes(cell.children || []);
              cells.push(
                <View
                  key={`cell-${cellIndex}`}
                  style={{
                    flex: 1,
                    padding: 8,
                    fontSize: 9,
                    borderRightWidth: cellIndex < (row.children?.length ?? 1) - 1 ? 1 : 0,
                    borderRightColor: "#e5e7eb",
                    borderBottomWidth: 1,
                    borderBottomColor: "#e5e7eb",
                    backgroundColor: isHeader ? "#f9fafb" : "transparent",
                    fontWeight: isHeader ? "bold" : "normal",
                    color: isHeader ? "#1a1a2e" : "#1f2937",
                  }}
                >
                  {cellChildren}
                </View>
              );
              cellIndex++;
            }
          }
          rows.push(
            <View key={`row-${rows.length}`} style={{ flexDirection: "row" }}>
              {cells}
            </View>
          );
          isHeader = false;
        }
      }
      nodes.push(
        <View key={`table-${Math.random()}`} style={{ marginBottom: 16, borderWidth: 1, borderColor: "#d1d5db", overflow: "hidden" }}>
          {rows}
        </View>
      );
      break;
    }

    case "thematicBreak": {
      nodes.push(
        <View key={`hr-${Math.random()}`} style={{ marginVertical: 24, borderBottomWidth: 1, borderBottomColor: "#e0e0e0", borderBottomStyle: "dashed" }} />
      );
      break;
    }

    case "code": {
      nodes.push(
        <View key={`code-${Math.random()}`} style={{ marginBottom: 16, padding: 16, backgroundColor: "#1e1e1e", borderRadius: 4, fontFamily: "Courier", fontSize: 9, lineHeight: 1.5, color: "#d4d4d4" }}>
          <PdfText>{node.value ?? ""}</PdfText>
        </View>
      );
      break;
    }

    default:
      if (node.children) {
        for (const child of node.children) {
          nodes.push(...mdastNodeToPdfNodes(child, options, headingIds));
        }
      }
      break;
  }

  return nodes;
}

function extractHeadings(markdown: string): Map<string, string> {
  const headingIds = new Map<string, string>();
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;
  let firstH1Found = false;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    let text = match[2].trim();
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");

    const explicitIdMatch = text.match(/\s*\{#([^}]+)\}\s*$/);
    let id: string;
    if (explicitIdMatch) {
      id = explicitIdMatch[1];
      text = text.replace(/\s*\{#[^}]+\}\s*$/, "").trim();
    } else {
      id = text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .trim();
    }

    if (level === 1 && !firstH1Found) {
      firstH1Found = true;
      continue;
    }

    const tocHeadingText = "Inhaltsverzeichnis";
    if (text.toLowerCase() === tocHeadingText.toLowerCase()) continue;

    headingIds.set(text, id);
  }

  return headingIds;
}

export function markdownToPdfNodes(markdown: string, options: MarkdownToPdfOptions): ReactNode[] {
  const headingIds = extractHeadings(markdown);

  const processor = unified().use(remarkParse).use(remarkGfm);
  const ast = processor.parse(markdown) as Root;

  const nodes: ReactNode[] = [];
  for (const child of ast.children) {
    nodes.push(...mdastNodeToPdfNodes(child as MdastNode, options, headingIds));
  }

  return nodes;
}

export { extractHeadings };