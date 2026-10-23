import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Link,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { Review } from "@prisma/client";
import { pdfStyles, getScoreColor, getVerdictLabel, sanitizeFilename } from "@/lib/pdf/styles";
import { markdownToPdfNodes } from "@/lib/pdf/markdown-to-pdf";

// Standard fonts (Helvetica, Times-Roman, Courier) are built-in and don't need registration
Font.register({ family: "Helvetica", src: "Helvetica" });
Font.register({ family: "Times-Roman", src: "Times-Roman" });
Font.register({ family: "Courier", src: "Courier" });

interface ReviewPdfLayoutProps {
  review: Review & {
    tags?: { tag: { name: string } }[];
  };
  isEn: boolean;
  siteUrl: string;
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = size / 2 - 4;
  const color = getScoreColor(score);

  // Show the score number in a styled circle
  return (
    <View style={{ width: size, height: size, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: size / 2, borderWidth: 8, borderColor: "#e5e7eb" }}>
      <View style={{ position: "absolute", top: -8, left: -8, right: -8, bottom: -8, borderRadius: size / 2 + 8, borderWidth: 8, borderColor: color, borderStyle: "dashed" }} />
      <Text style={{ fontSize: size * 0.28, fontWeight: "bold", color, fontFamily: "Helvetica" }}>
        {score}
      </Text>
    </View>
  );
}

interface CoverPageProps {
  review: ReviewPdfLayoutProps["review"];
  isEn: boolean;
}

function CoverPage({ review, isEn }: CoverPageProps) {
  const title = isEn && review.title_en ? review.title_en : review.title;
  const categoryLabel = review.category.charAt(0).toUpperCase() + review.category.slice(1);
  const verdictPhrase = getVerdictLabel(review.score, isEn);
  const pros = isEn && review.pros_en?.length > 0 ? review.pros_en : review.pros;
  const cons = isEn && review.cons_en?.length > 0 ? review.cons_en : review.cons;

  return (
    <View style={pdfStyles.cover}>
      <View style={pdfStyles.coverScoreWrapper}>
        <ScoreRing score={review.score} size={80} />
      </View>
      <Text style={pdfStyles.coverCategory}>{categoryLabel}</Text>
      <Text style={pdfStyles.coverTitle}>{title}</Text>
      <Text style={pdfStyles.coverVerdict}>
        {isEn
          ? `${title} is ${verdictPhrase} and receives ${review.score} out of 100 points.`
          : `${title} ist ${verdictPhrase} und erhält ${review.score} von 100 Punkten.`}
      </Text>

      <View style={pdfStyles.prosCons}>
        <View style={pdfStyles.prosConsColumn}>
          <Text style={[pdfStyles.prosConsTitle, pdfStyles.prosTitle]}>{isEn ? "PROS" : "VORTEILE"}</Text>
          {pros.map((pro, i) => (
            <Text key={i} style={pdfStyles.prosConsItem}>
              <Text style={pdfStyles.prosConsBullet}>• </Text>
              {pro}
            </Text>
          ))}
        </View>
        <View style={pdfStyles.prosConsColumn}>
          <Text style={[pdfStyles.prosConsTitle, pdfStyles.consTitle]}>{isEn ? "CONS" : "NACHTEILE"}</Text>
          {cons.map((con, i) => (
            <Text key={i} style={pdfStyles.prosConsItem}>
              <Text style={pdfStyles.prosConsBullet}>• </Text>
              {con}
            </Text>
          ))}
        </View>
      </View>

      <Text style={pdfStyles.coverMeta}>
        {isEn ? "Published on" : "Veröffentlicht am"} {new Date(review.createdAt).toLocaleDateString("de-DE")} ·{" "}
        {isEn ? "Updated on" : "Aktualisiert am"} {new Date(review.updatedAt).toLocaleDateString("de-DE")}
      </Text>
    </View>
  );
}

function TableOfContents({ isEn, headings }: { isEn: boolean; headings: Array<{ level: number; text: string; id: string }> }) {
  if (headings.length === 0) return null;

  return (
    <View style={pdfStyles.toc}>
      <Text style={pdfStyles.tocTitle}>{isEn ? "Table of Contents" : "Inhaltsverzeichnis"}</Text>
      {headings.map((heading, index) => (
        <View key={index} style={pdfStyles.tocItem}>
          <View style={heading.level === 1 ? pdfStyles.tocItemLevel1 : pdfStyles.tocItemLevel2}>
            <Text>{heading.text}</Text>
          </View>
          <View style={pdfStyles.tocDots} />
          <Text style={pdfStyles.tocPage}>{index + 2}</Text>
        </View>
      ))}
    </View>
  );
}

function PublicationInfo({ review, isEn }: { review: ReviewPdfLayoutProps["review"]; isEn: boolean }) {
  const categoryLabel = review.category.charAt(0).toUpperCase() + review.category.slice(1);

  return (
    <View style={pdfStyles.infoBox}>
      <Text style={pdfStyles.infoBoxTitle}>{isEn ? "PUBLICATION INFO" : "VERÖFFENTLICHUNGSINFO"}</Text>
      <View style={pdfStyles.infoRow}>
        <Text style={pdfStyles.infoLabel}>{isEn ? "Category" : "Kategorie"}</Text>
        <Text style={pdfStyles.infoValue}>{categoryLabel}</Text>
      </View>
      {review.releaseDate && (
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>{isEn ? "Release Date" : "Erscheinungsdatum"}</Text>
          <Text style={pdfStyles.infoValue}>{new Date(review.releaseDate).toLocaleDateString("de-DE")}</Text>
        </View>
      )}
      <View style={pdfStyles.infoRow}>
        <Text style={pdfStyles.infoLabel}>{isEn ? "Published" : "Veröffentlicht am"}</Text>
        <Text style={pdfStyles.infoValue}>{new Date(review.createdAt).toLocaleDateString("de-DE")}</Text>
      </View>
      <View style={pdfStyles.infoRow}>
        <Text style={pdfStyles.infoLabel}>{isEn ? "Last Updated" : "Letzte Aktualisierung"}</Text>
        <Text style={pdfStyles.infoValue}>{new Date(review.updatedAt).toLocaleDateString("de-DE")}</Text>
      </View>
      {review.tags && review.tags.length > 0 && (
        <>
          <Text style={pdfStyles.infoLabel}>{isEn ? "Tags" : "Tags"}</Text>
          <View style={pdfStyles.tagsContainer}>
            {review.tags.map((t) => (
              <Text key={t.tag.name} style={pdfStyles.tag}>
                {t.tag.name}
              </Text>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function HardwareSpecs({ review, isEn }: { review: ReviewPdfLayoutProps["review"]; isEn: boolean }) {
  const specs = review.specs as Record<string, Record<string, string | undefined> | null> | null;
  if (!specs || review.category !== "game") return null;

  return (
    <View style={pdfStyles.section}>
      <Text style={pdfStyles.specsSectionTitle}>{isEn ? "System Requirements" : "Systemanforderungen"}</Text>
      {["minimum", "recommended"].map((type) => (
        <View key={type} style={pdfStyles.specsTable}>
          <Text style={pdfStyles.specsSectionTitle}>
            {isEn ? (type === "minimum" ? "Minimum" : "Recommended") : (type === "minimum" ? "Minimum" : "Empfohlen")}
          </Text>
          {[
            { label: "OS", value: specs[type]?.os ?? "N/A" },
            { label: "CPU", value: specs[type]?.cpu ?? "N/A" },
            { label: "RAM", value: specs[type]?.ram ?? "N/A" },
            { label: "GPU", value: specs[type]?.gpu ?? "N/A" },
            { label: "Storage", value: specs[type]?.storage ?? "N/A" },
          ].map((spec, i) => (
            <View key={i} style={pdfStyles.specsRow}>
              <Text style={pdfStyles.specsLabel}>{spec.label}</Text>
              <Text style={pdfStyles.specsValue}>{spec.value}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function EpisodeRatings() {
  return null;
}

function ReviewPdfContent({ review, isEn, siteUrl }: ReviewPdfLayoutProps) {
  const content = isEn && review.content_en ? review.content_en : review.content;
  const headings = extractHeadings(content || "");

  const pdfNodes = markdownToPdfNodes(content || "", {
    reviewImages: review.images || [],
    isEn,
  });

  return (
    <>
      <CoverPage review={review} isEn={isEn} />
      <TableOfContents isEn={isEn} headings={headings} />
      <PublicationInfo review={review} isEn={isEn} />
      <View style={pdfStyles.section}>{pdfNodes}</View>
      <HardwareSpecs review={review} isEn={isEn} />
      <EpisodeRatings />
    </>
  );
}

function extractHeadings(markdown: string): Array<{ level: number; text: string; id: string }> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; id: string }> = [];
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

    headings.push({ level, text, id });
  }

  return headings;
}

function Footer({ pageNumber, totalPages, review, isEn, siteUrl }: {
  pageNumber: number;
  totalPages: number;
  review: ReviewPdfLayoutProps["review"];
  isEn: boolean;
  siteUrl: string;
}) {
  const canonicalUrl = `${siteUrl}/reviews/${review.slug}`;
  const dateStr = new Date().toLocaleDateString("de-DE");

  return (
    <View style={pdfStyles.footer}>
      <View style={pdfStyles.footerLeft}>
        <Text>{isEn ? "Generated by" : "Erstellt von"} Nerdiction.de am {dateStr}</Text>
      </View>
      <View style={pdfStyles.footerCenter}>
        <Text>{pageNumber} / {totalPages}</Text>
      </View>
      <View style={pdfStyles.footerRight}>
        <Link href={canonicalUrl} style={{ color: "#9ca3af", fontSize: 8, textDecoration: "none" }}>
          {canonicalUrl}
        </Link>
      </View>
    </View>
  );
}

export function ReviewPdfDocument({ review, isEn, siteUrl }: ReviewPdfLayoutProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <ReviewPdfContent review={review} isEn={isEn} siteUrl={siteUrl} />
        <Footer
          pageNumber={1}
          totalPages={1}
          review={review}
          isEn={isEn}
          siteUrl={siteUrl}
        />
      </Page>
    </Document>
  );
}

// Helper to render PDF to buffer (for API route)
export async function renderReviewPdfToBuffer(review: ReviewPdfLayoutProps["review"], isEn: boolean, siteUrl: string): Promise<Buffer> {
  const doc = React.createElement(ReviewPdfDocument, { review, isEn, siteUrl }) as React.ReactElement<any>;
  const buffer = await renderToBuffer(doc);
  return buffer;
}

export { sanitizeFilename };