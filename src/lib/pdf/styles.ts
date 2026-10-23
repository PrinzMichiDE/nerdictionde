import { StyleSheet } from "@react-pdf/renderer";

export const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.6,
    color: "#1a1a2e",
    backgroundColor: "#ffffff",
  },

  // Deckblatt / Header
  cover: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: "#e0e0e0",
  },
  coverTitle: {
    fontFamily: "Times-Roman",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#1a1a2e",
  },
  coverCategory: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#ffffff",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 16,
  },
  coverScoreWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  coverScoreRing: {
    width: 80,
    height: 80,
  },
  coverScoreLabel: {
    fontFamily: "Times-Roman",
    fontSize: 14,
    color: "#6b7280",
  },
  coverVerdict: {
    fontFamily: "Times-Roman",
    fontSize: 16,
    textAlign: "center",
    color: "#374151",
    marginBottom: 8,
    lineHeight: 1.5,
  },
  coverMeta: {
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "center",
  },

  // Pros & Cons
  prosCons: {
    flexDirection: "row",
    gap: 24,
    marginTop: 24,
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  prosConsColumn: {
    flex: 1,
  },
  prosConsTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  prosTitle: {
    color: "#059669",
  },
  consTitle: {
    color: "#dc2626",
  },
  prosConsItem: {
    fontSize: 10,
    lineHeight: 1.8,
    paddingLeft: 12,
    position: "relative",
  },
  prosConsBullet: {
    position: "absolute",
    left: 0,
  },

  // Inhaltsverzeichnis
  toc: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tocTitle: {
    fontFamily: "Times-Roman",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1a1a2e",
  },
  tocItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    fontSize: 11,
    color: "#374151",
  },
  tocItemLevel1: {
    fontWeight: "bold",
  },
  tocItemLevel2: {
    paddingLeft: 20,
    fontWeight: "normal",
  },
  tocDots: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    borderBottomStyle: "dotted",
    marginHorizontal: 8,
    marginBottom: 2,
  },
  tocPage: {
    fontWeight: "bold",
    color: "#1a1a2e",
  },

  // Content / Body
  section: {
    marginBottom: 24,
  },
  heading1: {
    fontFamily: "Times-Roman",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
    color: "#1a1a2e",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 4,
  },
  heading2: {
    fontFamily: "Times-Roman",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#1f2937",
  },
  heading3: {
    fontFamily: "Times-Roman",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#374151",
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
    hyphens: "auto",
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  link: {
    color: "#3b82f6",
    textDecoration: "underline",
  },

  // Lists
  list: {
    marginBottom: 10,
    paddingLeft: 20,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  listBullet: {
    width: 16,
    textAlign: "right",
    paddingRight: 8,
  },
  listItemText: {
    flex: 1,
  },

  // Tables
  table: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderRow: {
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  tableHeaderCell: {
    fontWeight: "bold",
    backgroundColor: "#f9fafb",
    color: "#1a1a2e",
  },

  // Images
  imageWrapper: {
    marginBottom: 16,
    alignItems: "center",
  },
  image: {
    maxWidth: "100%",
    height: "auto",
  },
  imageCaption: {
    fontSize: 9,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },

  // Hardware Specs / Key-Value
  specsTable: {
    marginBottom: 16,
  },
  specsRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
  },
  specsLabel: {
    width: "35%",
    fontWeight: "bold",
    fontSize: 10,
    color: "#374151",
    paddingRight: 12,
  },
  specsValue: {
    flex: 1,
    fontSize: 10,
    color: "#1f2937",
  },
  specsSectionTitle: {
    fontFamily: "Times-Roman",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#1a1a2e",
  },

  // Episode Ratings
  episodeList: {
    marginBottom: 16,
  },
  episodeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  episodeTitle: {
    fontSize: 10,
    color: "#374151",
  },
  episodeScore: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a1a2e",
  },

  // Footer (on every page)
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 0.5,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
  },
  footerLeft: {},
  footerCenter: {
    textAlign: "center",
  },
  footerRight: {
    textAlign: "right",
  },

  // Publication Info Box
  infoBox: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoBoxTitle: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#6b7280",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1a1a2e",
    textAlign: "right",
  },

  // Tags
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tag: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#3b82f6",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
});

export function getScoreColor(score: number): string {
  if (score >= 90) return "#7c3aed"; // purple
  if (score >= 80) return "#2563eb"; // blue
  if (score >= 70) return "#059669"; // green
  if (score >= 50) return "#d97706"; // amber
  return "#dc2626"; // red
}

export function getVerdictLabel(score: number, isEn: boolean): string {
  if (score >= 90) return isEn ? "Phenomenal" : "Phänomenal";
  if (score >= 80) return isEn ? "Excellent" : "Hervorragend";
  if (score >= 70) return isEn ? "Good" : "Gut";
  if (score >= 50) return isEn ? "Satisfactory" : "Befriedigend";
  return isEn ? "Poor" : "Mangelhaft";
}

export function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to dashes
    .replace(/-+/g, "-") // Collapse dashes
    .replace(/^-|-$/g, "") // Trim dashes
    .toLowerCase()
    .substring(0, 100);
}