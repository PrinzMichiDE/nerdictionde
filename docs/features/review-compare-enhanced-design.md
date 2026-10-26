# Design & Plan: Review-Vergleich erweitern

## 1. Architektur-Übersicht

**Ansatz:** Erweiterung der bestehenden Server Component `/reviews/vergleichen/page.tsx`. Keine neuen API-Routes, keine neuen Datenbank-Modelle. Nutzt bestehende Prisma-Relationen direkt in der Server Component.

**Datenfluss:**
```
Request (GET /reviews/vergleichen?ids=slug1,slug2,slug3)
    ↓
parseCompareIds() → string[] (max 3, validiert, dedupliziert)
    ↓
fetchReviewsBySlugs(slugs) → ReviewShape[] (parallel, cached)
    ↓
Server Component rendert HTML (SSR)
    ↓
Client Components für Interaktivität (Gallery, Video, Chart, Share)
    ↓
Response (HTML + Hydration)
```

**Caching:**
- `fetchReviewBySlug` → `unstable_cache` 60s, Tag `review:{slug}`
- `fetchReviewsBySlugs` → `unstable_cache` 60s, Tag `reviews:compare`
- Invaliderung: `revalidateTag('review:' + slug)` bei Review-Update/Delete

**Feature-Flag:** `FEATURE_REVIEW_COMPARE_ENHANCED` (Default: `true`)

## 2. Bestehende Wiederverwendung

| Komponente / Modul | Wiederverwendung |
|--------------------|------------------|
| `fetchReviewBySlug` | Erweitern (neue Select-Felder) |
| `ScoreBlock` | Unverändert |
| `ProsCons` | Unverändert |
| `SpecTable` | Unverändert (neue Daten) |
| `ScoreCompare` | Erweitern (Array von Scores) |
| `getCategoryStyle`, `getVerdict` | Unverändert |
| `prisma` Client | Unverändert |
| Tailwind / shadcn/ui Styles | Unverändert |

## 3. Neue Module & Komponenten

### 3.1 Lib / Utilities (`src/lib/review-compare.ts`)
```typescript
// Parsing & Validierung
export function parseCompareIds(idsParam: string | null, aParam: string | null, bParam: string | null): string[]
export function validateSlug(slug: string): boolean

// Specs Union
export function getSpecsUnion(reviews: ReviewShape[]): SpecRow[][]

// Preisverlauf Formatierung
export function formatPriceHistoryForDisplay(history: PriceHistory[]): PricePoint[]

// YouTube ID Extraktion
export function extractYouTubeId(input: string): string | null
```

### 3.2 Types (`src/lib/review-compare-types.ts`)
```typescript
interface ReviewShape {
  // ... bestehende Felder
  specs: JsonValue | null
  metadata: JsonValue | null
  priceHistory: PriceHistory[]
  deals: Deal[]
  youtubeVideos: string[]
}

interface SpecRow { label: string; value: string }
interface PricePoint { date: Date; price: number; source: string }
```

### 3.3 Client Components (`src/components/reviews/compare/`)
| Komponente | Zweck | Props |
|------------|-------|-------|
| `ReviewCompareGallery` | Bilder horizontal scrollbar, Lightbox | `images: string[]`, `title: string` |
| `ReviewCompareVideos` | YouTube Player lazy-loaded | `videoIds: string[]` |
| `ReviewComparePriceChart` | SVG-Liniendiagramm oder Liste | `priceHistory: PricePoint[]`, `deals: Deal[]` |
| `ReviewCompareSpecsTable` | SpecTable Wrapper mit Union-Keys | `reviews: ReviewShape[]` |
| `ReviewCompareScoreCompare` | Erweitertes ScoreCompare für 2–3 Reviews | `scores: number[]`, `labels: string[]` |
| `ReviewCompareShareButton` | Web Share API + Clipboard | `url: string` |
| `ReviewCompareTabs` | Tab-Navigation für Sections | `activeTab`, `onChange` |

### 3.4 Server Component Integration
- `page.tsx` importiert neue Client Components dynamisch (`dynamic(() => import(...), { ssr: false })`)
- Tabs State via `useState` in Client Wrapper oder URL-Hash

## 4. Arbeitspakete (PKG-1 bis PKG-10)

### PKG-1: Types & Utilities (`src/lib/review-compare-types.ts`, `src/lib/review-compare.ts`)
- [ ] `ReviewShape` um `specs`, `metadata`, `priceHistory`, `deals`, `youtubeVideos` erweitern
- [ ] `parseCompareIds`: `ids` Parameter (Komma-getrennt), Fallback `a`/`b`, Validierung, Max 3, Dedupe
- [ ] `getSpecsUnion`: Union aller Spec-Keys aus `review.specs` + relevante `metadata` Keys
- [ ] `formatPriceHistoryForDisplay`: Letzte 5 Einträge, sortiert nach Datum
- [ ] `extractYouTubeId`: Extrahiert Video-ID aus `youtube.com/watch?v=ID`, `youtu.be/ID`, oder purer ID
- [ ] Unit-Tests für alle Utils

### PKG-2: Erweitertes Data Fetching (`src/app/reviews/vergleichen/page.tsx` – `fetchReviewBySlug`)
- [ ] `select` um `specs`, `metadata`, `priceHistory` (take 5, orderBy recordedAt desc), `deals` (where status=active, take 3), `youtubeVideos` erweitern
- [ ] `fetchReviewsBySlugs(slugs: string[])`: Parallel fetching mit `Promise.all`, Filter auf `status === 'published'`
- [ ] `unstable_cache` Tags: `review:${slug}` pro Review + `reviews:compare`
- [ ] Feature-Flag Check am Anfang der Page

### PKG-3: Client Components – Media (`src/components/reviews/compare/ReviewCompareGallery.tsx`, `ReviewCompareVideos.tsx`)
- [ ] `ReviewCompareGallery`: Horizontale Scroll-Liste (`overflow-x-auto`), Thumbnails, Klick → Lightbox (einfaches Modal mit `next/image` fill)
- [ ] `ReviewCompareVideos`: Array von YouTube IDs, `iframe` mit `loading="lazy"`, `IntersectionObserver` für echtes Lazy-Load (optional), max 2 pro Review
- [ ] Accessibility: `aria-label`, Keyboard-Navigation, `role="region"`
- [ ] Reduced Motion: Keine Auto-Play, keine Animationen bei `prefers-reduced-motion`

### PKG-4: Client Components – Specs & Preise (`ReviewCompareSpecsTable.tsx`, `ReviewComparePriceChart.tsx`)
- [ ] `ReviewCompareSpecsTable`: Nutzt `SpecTable`, bereitet Union-Daten auf (Array von SpecRow[] pro Review), leere Zellen als "–"
- [ ] `ReviewComparePriceChart`: SVG-Liniendiagramm (einfach, keine Lib) oder kompakte Liste (Datum, Preis, Quelle). Deals als Badges darunter.
- [ ] Responsive: Tabelle horizontal scrollbar (`overflow-x-auto`), Chart Container `max-h-64`

### PKG-5: Client Components – ScoreCompare & Share (`ReviewCompareScoreCompare.tsx`, `ReviewCompareShareButton.tsx`)
- [ ] `ReviewCompareScoreCompare`: Erweitert `ScoreCompare` für Array von Reviews. Zeigt alle Scores nebeneinander + Durchschnitt der verglichenen Reviews. Bei 2 Reviews: wie bisher + Durchschnitt. Bei 3: alle 3 + Durchschnitt.
- [ ] `ReviewCompareShareButton`: `navigator.share()` falls verfügbar, sonst `navigator.clipboard.writeText()`, Toast via `useToast` (bestehender Hook)

### PKG-6: Client Components – Tabs & Layout Wrapper (`ReviewCompareTabs.tsx`, `ReviewCompareCard.tsx`)
- [ ] `ReviewCompareTabs`: 4 Tabs (Übersicht, Specs, Preise, Medien), State in URL-Hash (`#overview`, `#specs`, `#prices`, `#media`) für Deep-Linking
- [ ] `ReviewCompareCard`: Wrapper pro Review im Grid, rendert Tabs-Inhalte
- [ ] Grid-Layout: CSS Grid `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))` → 1/2/3 Spalten responsiv

### PKG-7: Server Component Integration (`page.tsx` Haupt-Datei)
- [ ] Import aller Client Components (dynamic imports für Code-Splitting)
- [ ] Feature-Flag Check → bei `false` Fallback auf alte Logik (oder 404)
- [ ] URL-Parameter Parsing: `ids` priorisiert, Fallback `a`/`b`
- [ ] Meta-Daten dynamisch: `title`, `description`, `openGraph` basierend auf Reviews
- [ ] Struktur: Header → Grid (ReviewCompareCard[]) → ScoreCompare → Footer
- [ ] Single-Review-View: Bestehende Logik beibehalten

### PKG-8: Styling & Polish
- [ ] Tailwind Classes für neue Komponenten (konsistent mit Design-System)
- [ ] Dark Mode Support (alle Komponenten)
- [ ] Focus-Visible Styles für Tabs, Gallery, Share-Button
- [ ] Loading Skeletons für Client Components (wenn Hydration verzögert)
- [ ] Tooltip für lange Spec-Keys (`title` Attribut oder custom Tooltip)

### PKG-9: Tests
- [ ] Unit Tests: `tests/lib/review-compare.test.ts` (alle Utils)
- [ ] Integration Tests: `tests/app/reviews/vergleichen.test.ts` (Page Rendering, Parameter, Edge Cases)
- [ ] Component Tests: `tests/components/reviews/compare/*.test.tsx` (Gallery, Videos, PriceChart, SpecsTable, ScoreCompare, ShareButton, Tabs)
- [ ] Mindestens 80% Coverage für neue Logik

### PKG-10: Dokumentation & Feature-Flag
- [ ] `CHANGELOG.md`: Eintrag unter "Added"
- [ ] `README.md`: Kurzbeschreibung Vergleichsseite
- [ ] `.env.example`: `FEATURE_REVIEW_COMPARE_ENHANCED=true`
- [ ] `ROADMAP.md`: Status auf "erledigt" setzen
- [ ] `PROGRESS.md`: Zusammenfassung eintragen
- [ ] Spec Review-Sektion (F6) in `docs/features/review-compare-enhanced.md` ausfüllen

## 5. Cache-Strategie Details

```typescript
// In fetchReviewBySlug
const cachedFetch = unstable_cache(
  async (slug: string) => prisma.review.findUnique({...}),
  ['review', slug],
  { tags: [`review:${slug}`], revalidate: 60 }
)

// In fetchReviewsBySlugs
const cachedFetchAll = unstable_cache(
  async (slugs: string[]) => Promise.all(slugs.map(s => fetchReviewBySlug(s))),
  ['reviews-compare', ...slugs.sort()],
  { tags: ['reviews:compare', ...slugs.map(s => `review:${s}`)], revalidate: 60 }
)
```

**Invaliderung** (in Review-Update/Delete API Routes):
```typescript
revalidateTag(`review:${slug}`)
revalidateTag('reviews:compare')
```

## 6. Accessibility Checkliste

- [ ] Semantisches HTML: `<section aria-labelledby="compare-heading">`, `<article>` pro Review
- [ ] Tabs: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `id`/`aria-labelledby`
- [ ] Gallery: `role="list"`, `role="listitem"`, Lightbox: `role="dialog"`, `aria-modal="true"`, `aria-label`
- [ ] Video: `title` Attribut auf iframe, `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`
- [ ] Share-Button: `aria-label="Vergleich teilen"`
- [ ] ScoreCompare: Tabellarische Daten → `<table>` mit `<th scope="col">`
- [ ] Farbkontrast: Mindestens 4.5:1 (Tailwind Defaults)
- [ ] Reduced Motion: `@media (prefers-reduced-motion: reduce)` → Animationen deaktivieren
- [ ] Fokus-Reihenfolge: Header → Tab-Liste → Tab-Panel → ScoreCompare → Footer

## 7. Abhängigkeiten

**Keine neuen npm-Packages.** Alles mit Bordmitteln:
- SVG für PriceChart (keine Chart-Lib)
- Native `navigator.share` / `clipboard` API
- `next/image`, `next/link`
- Bestehende `useToast` Hook
- `lucide-react` Icons (bereits im Projekt)

## 8. Geschätzter Aufwand

| Paket | Aufwand |
|-------|---------|
| PKG-1: Types & Utils | ~1h |
| PKG-2: Data Fetching | ~0.5h |
| PKG-3: Media Components | ~1.5h |
| PKG-4: Specs & Price Components | ~1h |
| PKG-5: ScoreCompare & Share | ~0.5h |
| PKG-6: Tabs & Layout | ~1h |
| PKG-7: Integration | ~1h |
| PKG-8: Styling & Polish | ~0.5h |
| PKG-9: Tests | ~1.5h |
| PKG-10: Doku & Flag | ~0.5h |
| **Gesamt** | **~9h** |

## 9. Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| `specs` / `metadata` JSON Struktur inkonsistent | Mittel | Mittel | Defensive Coding: `typeof === 'object' && !== null`, Keys prüfen, Fallback "–" |
| YouTube-URLs in verschiedenen Formaten | Hoch | Niedrig | `extractYouTubeId` robust implementieren (Regex für alle gängigen Formate) |
| Performance bei 3 Reviews × viele Bilder/Videos | Niedrig | Mittel | Lazy-Load, max 5 Bilder/2 Videos, Code-Splitting via dynamic import |
| Bestehende Links (`a`/`b`) brechen | Niedrig | Hoch | Fallback-Logik in `parseCompareIds`, Tests für Backward Compat |
| Hydration Mismatch bei Client Components | Niedrig | Hoch | `suppressHydrationWarning` nur wo nötig, Server/Client Data konsistent halten |

## 10. Definition of Done (für dieses Feature)

- [ ] Spec vollständig (F2 ✅)
- [ ] Design dokumentiert (F3 ✅)
- [ ] Alle 10 Pakete implementiert & committed (F4)
- [ ] Unit + Integration + Component Tests grün (F5)
- [ ] Self-Review ohne offene Befunde (F6)
- [ ] `npm run verify` grün (Build, Typecheck, Lint, Tests) (F7)
- [ ] CHANGELOG, README, .env.example, ROADMAP, PROGRESS aktualisiert (F8)
- [ ] Feature-Flag dokumentiert, Default `true`
- [ ] Keine Secrets, keine `any`, keine neuen Warnungen
- [ ] Alles auf `auto/dev` gepusht (F9)

---

**Status:** F3 ✅ (Dieses Design), F4–F9 ⏳