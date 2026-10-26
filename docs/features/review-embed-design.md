# Design & Plan: Review-Embed für externe Sites

## 1. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNE SITE                                 │
│  <script async src="https://nerdiction.de/embed.js"></script>      │
│  <div data-nerdiction-embed="review" data-slug="..."></div>        │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      NERDICTION.DE (Next.js)                        │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐   │
│  │  /embed.js      │    │  /api/embed/{type}/{slug}             │   │
│  │  (Static/Route) │    │  (Server Component / Route Handler)   │   │
│  └────────┬────────┘    └──────────────────┬──────────────────┘   │
│           │                                │                      │
│           │ Fetch JSON                     │                      │
│           ▼                                ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │           EMBED WIDGET (React App im Shadow DOM)            │ │
│  │  - Findet [data-nerdiction-embed] Elemente                  │ │
│  │  - Fetch Data API                                            │ │
│  │  - Rendert Review/Collection/Series Card                    │ │
│  │  - Shadow DOM Isolation (Styles, DOM)                       │ │
│  │  - Responsive (ResizeObserver)                              │ │
│  │  - Theme: auto/light/dark (CSS-Variablen + media query)     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

**Komponenten:**
1. **Embed Data API** (`/api/embed/[type]/[slug]`) — Liefert JSON-Daten für Widget
2. **Embed Script** (`/embed.js`) — Client-seitiger Loader + Widget-Renderer
3. **Embed Widget** (React) — Shadow DOM Component für Review/Collection/Series
4. **Embed Modal** (Next.js UI) — Auf Detailseiten: Preview + Copy-to-Clipboard

---

## 2. Bestehende Wiederverwendbare Elemente

| Element | Wiederverwendung |
|---------|-----------------|
| `lib/feature-flags.ts` | `FEATURE_REVIEW_EMBED` Flag hinzufügen |
| `lib/api-response.ts` | `successResponse`, `errorResponse` für Embed-API |
| `lib/unstable-cache` | 5 Min Cache auf Embed-Endpunkte + Tag `embed:{type}:{slug}` |
| `components/ui/*` | shadcn/ui: `Dialog`, `Button`, `Tabs`, `RadioGroup`, `Switch`, `Toast` |
| `hooks/use-toast.ts` | Toast für Copy-Bestätigung |
| `lib/prisma.ts` | Prisma Client für DB-Queries |
| `components/reviews/ReviewCard.tsx` | Design-Inspiration für Widget-Layout |
| `components/collections/CollectionCard.tsx` | Design-Inspiration |
| `components/series/SeriesCard.tsx` | Design-Inspiration |

**Keine neuen Dependencies.** React 19, lucide-react, Tailwind 4 bereits vorhanden.

---

## 3. Datenfluss

### 3.1 Embed Data API (`/api/embed/[type]/[slug]`)

```
Request → Feature-Flag Check → Prisma Query → Transform → JSON Response
                    ↓
              Cache Check (unstable_cache 5min, Tag: embed:{type}:{slug})
                    ↓
              Cache Miss → DB Query → Cache Set → Response
```

**Prisma Queries:**
- **Review:** `prisma.review.findUnique({ where: { slug }, include: { author: true, tags: true, specs: true, metadata: true, priceHistory: true, deals: true, images: true, youtubeVideos: true } })`
- **Collection:** `prisma.reviewCollection.findUnique({ where: { slug }, include: { owner: true, items: { include: { review: true }, orderBy: { position: 'asc' }, take: 50 } } })`
- **Series:** `prisma.reviewSeries.findUnique({ where: { slug }, include: { owner: true, items: { include: { review: true }, orderBy: { order: 'asc' } } } })`

**Filter:** Nur `status: 'PUBLISHED'` (Review), `deletedAt: null` (Collection/Series), `visibility: 'PUBLIC'` (Series)

### 3.2 Embed Script (`/embed.js`)

```
1. Script lädt (async)
2. DOMContentLoaded → init()
3. querySelectorAll('[data-nerdiction-embed]')
4. Für jedes Element:
   a. Attribute lesen (type, slug, theme, consent, compact)
   b. Fetch `/api/embed/{type}/{slug}`
   c. Shadow DOM an Element anhängen
   d. React Root in Shadow DOM erstellen
   e. Widget Component rendern (ReviewWidget / CollectionWidget / SeriesWidget)
   f. ResizeObserver für Responsive
   g. Theme-Listener (media query) für data-theme="auto"
```

### 3.3 Embed Modal (Detailseiten)

```
User Klick "Einbetten" → Dialog öffnet
    → State: activeTab (preview/code), theme, consent, compact
    → Preview: <EmbedPreview type={type} slug={slug} theme={theme} compact={compact} />
    → Code: generiert HTML-String aus State
    → Copy → Clipboard API → Toast
```

---

## 4. Arbeitspakete (PKG-1 bis PKG-8)

| Paket | Beschreibung | Aufwand | Abhängigkeiten |
|-------|--------------|---------|----------------|
| **PKG-1** | **Feature-Flag & Types** — `FEATURE_REVIEW_EMBED` in `lib/feature-flags.ts`, `.env.example`, Type-Exports (`EmbedType`, `EmbedTheme`, `EmbedData`, `EmbedWidgetProps`) | 0.5h | — |
| **PKG-2** | **Embed Data API** — 3 Route Handlers: `/api/embed/review/[slug]`, `/api/embed/collection/[slug]`, `/api/embed/series/[slug]` mit Feature-Flag, Cache, Error-Handling, Zod-Validierung | 2h | PKG-1 |
| **PKG-3** | **Embed Widget Core (React)** — `EmbedProvider` (Script-Entry), `EmbedWidget` (Dispatcher), `ReviewEmbedWidget`, `CollectionEmbedWidget`, `SeriesEmbedWidget`, Shadow DOM Setup, Theme-System, Responsive, Skeleton/Error States | 3h | PKG-1 |
| **PKG-4** | **Embed Script Build** — `/embed.js` als Next.js Route (`app/embed.js/route.ts`) oder `public/embed.js` via Build-Script, minimiert, versioniert, Cache-Headers | 1h | PKG-3 |
| **PKG-5** | **Embed Modal (UI)** — `EmbedModal` Component (Dialog), `EmbedPreview` (iframe-ähnlich via Shadow DOM oder direkter Widget-Render), `EmbedCodeBlock` (Syntax-Highlighting), Copy-to-Clipboard, Optionen (Theme, Consent, Compact) | 2h | PKG-1, PKG-3 |
| **PKG-6** | **Detailseiten Integration** — "Einbetten"-Button in `ReviewActions`, Listen-Detail, Series-Detail; Modal-State-Management | 1h | PKG-5 |
| **PKG-7** | **Tests** — Unit (Schema, Logic, Script), Integration (API Routes), E2E (Modal, Widget-Rendering, Externe-Seite-Simulation) | 2h | PKG-1–6 |
| **PKG-8** | **Doku & Verify** — CHANGELOG, README, ROADMAP, .env.example, PROGRESS.md, `npm run verify` | 0.5h | PKG-1–7 |

**Gesamt: ~12h**

---

## 5. Detaillierte technische Spezifikationen

### 5.1 Types (`src/types/embed.ts`)

```typescript
export type EmbedType = 'review' | 'collection' | 'series';
export type EmbedTheme = 'auto' | 'light' | 'dark';

export interface EmbedWidgetProps {
  type: EmbedType;
  slug: string;
  theme?: EmbedTheme;
  consent?: boolean;
  compact?: boolean;
}

export interface EmbedReviewData {
  type: 'review';
  slug: string;
  title: string;
  excerpt: string;
  score: number;
  scoreLabel: string;
  category: string;
  categoryLabel: string;
  coverImage: string | null;
  coverAlt: string | null;
  author: { username: string; displayName: string; avatar: string | null };
  publishedAt: string;
  url: string;
  pros: string[];
  cons: string[];
  specs: Record<string, string | string[]>;
}

export interface EmbedCollectionData {
  type: 'collection';
  slug: string;
  title: string;
  description: string;
  itemCount: number;
  owner: { username: string; displayName: string; avatar: string | null };
  coverImage: string | null;
  createdAt: string;
  url: string;
  items: Array<{ position: number; review: { slug: string; title: string; score: number; coverImage: string | null } }>;
}

export interface EmbedSeriesData {
  type: 'series';
  slug: string;
  title: string;
  description: string;
  partCount: number;
  owner: { username: string; displayName: string; avatar: string | null };
  coverImage: string | null;
  createdAt: string;
  url: string;
  parts: Array<{ order: number; review: { slug: string; title: string; score: number } }>;
}

export type EmbedData = EmbedReviewData | EmbedCollectionData | EmbedSeriesData;
```

### 5.2 Embed Data API Route Handler Pattern

```typescript
// app/api/embed/[type]/[slug]/route.ts
import { getServerSession } from 'next-auth'; // NICHT nötig - öffentliche API
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { isFeatureEnabled } from '@/lib/feature-flags';

const getCachedEmbedData = unstable_cache(
  async (type: EmbedType, slug: string) => {
    // Prisma Query basierend auf type
    // Return null wenn nicht gefunden/privat
  },
  ['embed'],
  { revalidate: 300, tags: (type, slug) => [`embed:${type}:${slug}`] }
);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  if (!isFeatureEnabled('FEATURE_REVIEW_EMBED')) {
    return errorResponse('Feature disabled', 404);
  }
  const { type, slug } = await params;
  if (!['review', 'collection', 'series'].includes(type)) {
    return errorResponse('Invalid type', 400);
  }
  const data = await getCachedEmbedData(type as EmbedType, slug);
  if (!data) return errorResponse('Not found', 404);
  return successResponse(data);
}
```

### 5.3 Embed Script (`app/embed.js/route.ts`)

```typescript
// Wird als statisches Asset serviert: /embed.js
// Build-Zeit: React App bündeln (esbuild/rollup) → minimieren → als Response
// Oder: Next.js `public/embed.js` via custom Build-Script

// Runtime-Logik (vereinfacht):
// 1. (function() { ... })()
// 2. class EmbedWidget { ... }
// 3. document.addEventListener('DOMContentLoaded', () => new EmbedWidget().init())
```

**Build-Approach:** Separater esbuild-Build für Widget-App → Output `public/embed.js` → Versionierung via `?v=HASH` in Modal-Code.

### 5.4 Widget Components (Shadow DOM)

```tsx
// components/embed/ReviewEmbedWidget.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

export function ReviewEmbedWidget({ data, theme, compact }: { data: EmbedReviewData; theme: EmbedTheme; compact: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;
    const shadow = hostRef.current.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.id = 'nerdiction-embed-root';
    shadow.appendChild(container);

    // Styles in Shadow DOM injecten
    const style = document.createElement('style');
    style.textContent = getEmbedStyles(theme, compact);
    shadow.appendChild(style);

    const root = createRoot(container);
    root.render(<ReviewWidgetInner data={data} compact={compact} />);
    setMounted(true);

    return () => { root.unmount(); shadow.innerHTML = ''; };
  }, [data, theme, compact]);

  return <div ref={hostRef} className="nerdiction-embed-host" />;
}

function ReviewWidgetInner({ data, compact }: { data: EmbedReviewData; compact: boolean }) {
  // Eigenes CSS via CSS-Modules oder Tailwind (aber im Shadow DOM!)
  // Nur textContent für User-Daten, keine innerHTML
}
```

**CSS im Shadow DOM:** Via `CSSStyleSheet` API oder `<style>` Element. Tailwind-Klassen funktionieren NICHT im Shadow DOM → Eigenes CSS (CSS-Variablen für Theming).

### 5.5 Embed Modal (`components/embed/EmbedModal.tsx`)

```tsx
'use client';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { CopyCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmbedModalProps {
  type: EmbedType;
  slug: string;
  title: string; // für Modal-Titel
}

export function EmbedModal({ type, slug, title }: EmbedModalProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [theme, setTheme] = useState<EmbedTheme>('auto');
  const [consent, setConsent] = useState(true);
  const [compact, setCompact] = useState(false);
  const { toast } = useToast();

  const embedCode = generateEmbedCode(type, slug, { theme, consent, compact });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    toast({ title: 'Kopiert!', description: 'Embed-Code in Zwischenablage.' });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Einbetten: ${title}`}>
          <Code2 className="mr-2 h-4 w-4" /> Einbetten
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Einbetten: {title}</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="preview">Vorschau</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <div className="border rounded p-4 min-h-[300px]">
              <EmbedPreview type={type} slug={slug} theme={theme} consent={consent} compact={compact} />
            </div>
          </TabsContent>
          <TabsContent value="code">
            <div className="flex items-center justify-between p-2 border-b">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="theme" value="auto" checked={theme === 'auto'} onChange={() => setTheme('auto')} /> Auto
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={() => setTheme('light')} /> Hell
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Dunkel
              </label>
            </div>
            <pre className="p-4 overflow-x-auto bg-muted/50 rounded"><code>{embedCode}</code></pre>
            <div className="flex justify-end gap-2 p-2 border-t">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <CopyCheck className="mr-2 h-4 w-4" /> Kopieren
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function generateEmbedCode(type: EmbedType, slug: string, opts: { theme: EmbedTheme; consent: boolean; compact: boolean }) {
  const attrs = [
    `data-nerdiction-embed="${type}"`,
    `data-slug="${slug}"`,
    `data-theme="${opts.theme}"`,
    opts.consent ? '' : 'data-consent="false"',
    opts.compact ? 'data-compact="true"' : '',
  ].filter(Boolean).join(' ');
  return `<script async src="https://nerdiction.de/embed.js"></script>\n<div ${attrs}></div>`;
}
```

### 5.6 Embed Preview Component

```tsx
// components/embed/EmbedPreview.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ReviewEmbedWidget, CollectionEmbedWidget, SeriesEmbedWidget } from './EmbedWidgets';

export function EmbedPreview({ type, slug, theme, consent, compact }: EmbedWidgetProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<EmbedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch(`/api/embed/${type}/${slug}`)
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(d => { if (mounted) { setData(d.data); setLoading(false); } })
      .catch(e => { if (mounted) { setError(e.message); setLoading(false); } });
    return () => { mounted = false; };
  }, [type, slug]);

  useEffect(() => {
    if (!hostRef.current || !data) return;
    const shadow = hostRef.current.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
    container.id = 'nerdiction-embed-preview-root';
    shadow.appendChild(container);
    const style = document.createElement('style');
    style.textContent = getEmbedStyles(theme, compact);
    shadow.appendChild(style);
    const root = createRoot(container);
    const Widget = type === 'review' ? ReviewEmbedWidget : type === 'collection' ? CollectionEmbedWidget : SeriesEmbedWidget;
    root.render(<Widget data={data} theme={theme} compact={compact} />);
    return () => { root.unmount(); shadow.innerHTML = ''; };
  }, [hostRef.current, data, theme, compact]);

  if (loading) return <EmbedSkeleton />;
  if (error) return <EmbedError message={error} />;
  if (!data) return null;
  return <div ref={hostRef} className="nerdiction-embed-host" style={{ width: '100%', maxWidth: '600px' }} />;
}
```

---

## 6. Cache-Strategie

| Endpunkt | TTL | Tags | Invaliderung |
|----------|-----|------|--------------|
| `/api/embed/review/[slug]` | 5 Min | `embed:review:{slug}` | Review-Update, Review-Delete |
| `/api/embed/collection/[slug]` | 5 Min | `embed:collection:{slug}` | Collection-Update, Item-Add/Remove |
| `/api/embed/series/[slug]` | 5 Min | `embed:series:{slug}` | Series-Update, Item-Reorder |
| `/embed.js` | 1 Jahr (immutable) | — | Build-Version ändert Query-Param `?v=HASH` |

---

## 7. Risiken und Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Shadow DOM Styles brechen auf Host-Seite | Niedrig | Mittel | Ausführliche Tests, CSS-Variablen, `!important` nur wo nötig |
| Script-Größe > 15 KB gzipped | Mittel | Hoch | Tree-shaking, nur nötige React-Features, `esbuild` mit `minify: true` |
| CSP-Probleme auf externen Sites | Mittel | Mittel | `script-src 'self' https://nerdiction.de`, keine inline Scripts im Widget |
| Theme-Flash bei `auto` | Niedrig | Niedrig | Initial-Theme via `prefers-color-scheme` Media Query im Shadow DOM |
| Memory-Leaks bei vielen Embeds | Niedrig | Mittel | Cleanup in `useEffect` Return, `root.unmount()`, Shadow DOM leeren |

---

## 8. Dateien-Übersicht (Neu/Geändert)

**Neu:**
- `src/types/embed.ts`
- `src/lib/embed-data.ts` (Server Logic: `getEmbedReviewData`, `getEmbedCollectionData`, `getEmbedSeriesData`)
- `src/lib/embed-schema.ts` (Zod Schemas für Response-Validierung)
- `src/app/api/embed/review/[slug]/route.ts`
- `src/app/api/embed/collection/[slug]/route.ts`
- `src/app/api/embed/series/[slug]/route.ts`
- `src/app/embed.js/route.ts` (oder Build-Script für `public/embed.js`)
- `src/components/embed/EmbedWidgets.tsx` (Review/Collection/Series Widget Inner Components)
- `src/components/embed/EmbedProvider.tsx` (Script Entry Point für `/embed.js`)
- `src/components/embed/EmbedModal.tsx`
- `src/components/embed/EmbedPreview.tsx`
- `src/components/embed/EmbedCodeBlock.tsx`
- `src/components/embed/EmbedSkeleton.tsx`
- `src/components/embed/EmbedError.tsx`
- `tests/lib/embed-schema.test.ts`
- `tests/lib/embed-data.test.ts`
- `tests/api/embed/review.test.ts`
- `tests/api/embed/collection.test.ts`
- `tests/api/embed/series.test.ts`
- `tests/api/embed/script.test.ts`
- `tests/embed.e2e.ts`

**Geändert:**
- `src/lib/feature-flags.ts` (FEATURE_REVIEW_EMBED)
- `.env.example`
- `src/components/reviews/ReviewActions.tsx` (Embed-Button)
- `src/app/listen/[slug]/page.tsx` (Embed-Button)
- `src/app/serien/[slug]/page.tsx` (Embed-Button) / `SeriesDetail.tsx`
- `docs/features/review-embed.md` (Spec)
- `docs/features/review-embed-design.md` (Dieses File)
- `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `PROGRESS.md`

---

## 9. Nächste Schritte

1. **PKG-1:** Feature-Flag & Types anlegen → Commit → Push
2. **PKG-2:** Embed Data API Routes → Commit → Push
3. **PKG-3:** Widget Core (React + Shadow DOM) → Commit → Push
4. **PKG-4:** Embed Script Build → Commit → Push
5. **PKG-5:** Embed Modal → Commit → Push
6. **PKG-6:** Detailseiten Integration → Commit → Push
7. **PKG-7:** Tests → Commit → Push
8. **PKG-8:** Doku & Verify → Commit → Push

Nach jedem Paket: `npm run verify` (Build + Type-Check + Lint + Tests) muss grün sein.