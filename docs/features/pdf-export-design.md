# Feature-Design & Plan: Review als PDF exportieren

**Status:** Design (F3)
**Feature:** pdf-export
**Basiert auf:** `docs/features/pdf-export.md`

---

## 1. Technische Architektur

### 1.1 PDF-Generierung: `@react-pdf/renderer`

**Gründe:**
- Reine React-Komponenten (TypeScript, JSX), passt zur Codebase.
- Kein Headless Browser nötig (funktioniert auf Vercel/Serverless zuverlässig).
- Layout-Engine (Flexbox/Grid-ähnlich) für professionelle PDFs.
- Bilder via URL (Vercel Blob) – kein Embedding nötig.
- Server-seitig in API-Route nutzbar (`renderToStream` → Response).

**Alternative verworfen:** `jsPDF` + `html2canvas` (Client-seitig, unzuverlässig bei Markdown/Tabellen), Puppeteer (Cold Start, Memory, Vercel Limits).

### 1.2 API-Route Struktur

```
src/app/api/reviews/[slug]/pdf/route.ts
  → GET Handler
  → Prisma: findUnique (slug, status=published, include: tags, comments? nein)
  → PDF-Layout-Komponente (Server Component) rendern
  → renderToStream → Response (application/pdf)
```

### 1.3 PDF-Layout-Komponente

`src/components/reviews/ReviewPdfLayout.tsx` (Server Component, keine Client-Direktiven)

Props:
```typescript
interface ReviewPdfLayoutProps {
  review: Review & { tags: { tag: Tag }[] };
  isEn: boolean;
  siteUrl: string;
}
```

Struktur:
- `Document` → `Page` (multiple, auto-pagination)
- `View` (Flex-Container) für Sections
- `Text`, `Link`, `Image`, `Svg` (für Score-Ring)
- Styles via `StyleSheet.create` (React-PDF Stylesheet)

### 1.4 Markdown → React-PDF Mapping

Kein Markdown-Parser im PDF. Stattdessen: In `page.tsx` werden Headings bereits extrahiert (`extractHeadings`). Für PDF nutzen wir dieselben Daten:
- `review.content` (Markdown) → wir parsen nur die Struktur (Headings, Paragraphen, Listen, Tabellen, Bilder-Platzhalter `![[IMAGE_n]]`).
- Einfacher Parser: `remark-parse` → `mdast` → walk → React-PDF Nodes.
- Oder: `react-markdown` mit custom components, die React-PDF Nodes zurückgeben (funktioniert server-seitig).

**Entscheidung:** Eigenes kleines Mapping (`mdast` → React-PDF) für Kontrolle, keine zusätzlichen Dependencies außer `unist-util-visit` (bereits transitive via `remark-gfm`/`rehype`).

---

## 2. Betroffene Module & Dateien

### Neu:
1. `src/app/api/reviews/[slug]/pdf/route.ts` — API-Route
2. `src/components/reviews/ReviewPdfLayout.tsx` — PDF-Layout (React-PDF)
3. `src/lib/pdf/markdown-to-pdf.ts` — Markdown → React-PDF Nodes Mapping
4. `src/lib/pdf/styles.ts` — StyleSheet-Definitionen
5. `src/components/reviews/ReviewPdfDownload.tsx` — Client-Button (in ReviewActions integriert)

### Geändert:
6. `src/components/reviews/ReviewActions.tsx` — PDF-Button hinzufügen
7. `package.json` — Dependency `@react-pdf/renderer` hinzufügen

### Tests:
8. `tests/api/reviews/pdf-export.test.ts` — API Unit-Tests
9. `tests/components/reviews/ReviewPdfLayout.test.tsx` — Layout Smoke-Test

---

## 3. Arbeitspakete (3–10, einzeln lauffähig)

| # | Paket | Beschreibung | Abhängigkeit |
|---|-------|--------------|--------------|
| 1 | Dependency & Types | `@react-pdf/renderer` installieren, Types prüfen | — |
| 2 | PDF Styles & Utilities | `src/lib/pdf/styles.ts`, Helper-Funktionen (sanitizeFilename, formatDate) | 1 |
| 3 | Markdown → PDF Mapper | `src/lib/pdf/markdown-to-pdf.ts` (remark-parse, unist-util-visit) | 1 |
| 4 | PDF Layout Komponente | `src/components/reviews/ReviewPdfLayout.tsx` (Deckblatt, TOC, Content, Footer) | 2, 3 |
| 5 | API Route | `src/app/api/reviews/[slug]/pdf/route.ts` (Prisma, renderToStream, Headers) | 4 |
| 6 | Client Button & Integration | `ReviewPdfDownload.tsx`, Einbau in `ReviewActions.tsx` | 5 |
| 7 | Unit Tests API | `tests/api/reviews/pdf-export.test.ts` | 5 |
| 8 | Unit Tests Layout | `tests/components/reviews/ReviewPdfLayout.test.tsx` | 4 |
| 9 | Manuelle Verifikation | Dev-Server, 3 Reviews (Game, Movie, Hardware) testen | 6 |
| 10 | Review & Verify | Self-Review (F6), `npm run verify` (F7) | 7, 8, 9 |

---

## 4. Datenfluss

```
User klickt "Als PDF speichern"
    ↓
ReviewActions.handlePdfExport()
    ↓
fetch(`/api/reviews/${slug}/pdf?lang=${lang}`)
    ↓
API Route (GET)
    → prisma.review.findUnique({ where: { slug, status: "published" }, include: { tags: { include: { tag: true } } } })
    → ReviewPdfLayout({ review, isEn, siteUrl })
    → renderToStream(pdfDocument)
    → Response: application/pdf, Content-Disposition: attachment
    ↓
Client: blob() → createObjectURL → <a download> → click() → revokeObjectURL()
    ↓
PDF im Downloads-Ordner
```

---

## 5. Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| `@react-pdf/renderer` rendert Markdown-Tabellen schlecht | Mittel | Mittel | Tabellen als einfache Text-Darstellung (Rows → Text zeilenweise), oder `Table`/`TableRow`/`TableCell` nutzen (-supported) |
| Bilder (Vercel Blob) laden im PDF nicht (CORS/Private) | Niedrig | Hoch | Blob-URLs sind öffentlich; Fallback: Platzhalter-Text "[Bild]" |
| Vercel Function Timeout (10s) bei großen Reviews | Niedrig | Mittel | `renderToStream` ist streaming; Content-Length Header setzen; Timeout in `vercel.json` prüfen |
| Font-Lizenz / Embedding | Niedrig | Niedrig | Standard-Fonts (Helvetica, Times-Roman, Courier) nutzen – lizenzfrei, eingebettet |
| Deutsche Umlaute / Sonderzeichen im PDF | Niedrig | Niedrig | Standard-Fonts unterstützen Latin-1; Test mit echten Reviews |

---

## 6. Acceptance-Criteria Mapping (zu Spec)

| Spec AK | Implementiert in Paket |
|---------|------------------------|
| US-1: Button in ReviewActions | 6 |
| US-2: PDF-Inhalt (Titel, Score, Pros/Cons, Content, Bilder, Specs, Episodes) | 4 |
| US-2: Keine Navigation/Sidebar/Kommentare | 4 (Layout nur Review) |
| US-2: DE/EN Sprache | 4, 5 (`lang` Query-Param) |
| US-3: Ladezustand, Download, Dateiname, Fehler-Toast | 6 |
| US-4: Öffentlich, Draft → 404 | 5 |
| Barrierefreiheit (aria-label, aria-busy) | 6 |
| Performance < 10s, Caching | 5 |

---

## 7. Nächste Schritte

→ Paket 1: Dependency installieren (`npm install @react-pdf/renderer`)
→ Dann Paket 2–6 nacheinander (Code), 7–8 (Tests), 9–10 (Verify)