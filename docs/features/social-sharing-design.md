# Design & Plan: Social Sharing & Viral Loops

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        ShareButtons (Client)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │
│  │   Twitter   │ │  Bluesky    │ │  Mastodon   │ │  Reddit   │  │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │
│  ┌─────────────┐ ┌─────────────┐                                  │
│  │  Discord    │ │ Copy Link   │                                  │
│  └─────────────┘ └─────────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/share-urls.ts  —  URL-Generierung pro Plattform            │
│  lib/share-meta.ts  —  OG/Twitter Meta-Tags Generierung         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  API: POST /api/share/track  —  Fire-and-forget Tracking        │
│  Prisma: ShareEvent + shareCounts (JSON auf Entities)           │
└─────────────────────────────────────────────────────────────────┘
```

## Bestehende Komponenten (Konsolidierung)

| Komponente | Ort | Plattformen | Status |
|------------|-----|-------------|--------|
| `ShareButtons` | `src/components/reviews/ShareButtons.tsx` | Twitter, Facebook, Copy | **Ersetzen** |
| `ShareButton` | `src/components/collections/ShareButton.tsx` | Web Share API, Copy | **Ersetzen** |
| `SeriesShareButton` | `src/components/series/SeriesShareButton.tsx` | Web Share API, Copy | **Ersetzen** |
| `ReviewCompareShareButton` | `src/components/reviews/compare/ReviewCompareShareButton.tsx` | Web Share API, Copy | **Ersetzen** |

**Neue zentrale Komponente:** `src/components/ui/ShareButtons.tsx`

## Datenfluss

1. **Server (SSR):** `generateMetadata()` nutzt `lib/share-meta.ts` → OG/Twitter Tags
2. **Client:** `ShareButtons` rendert Buttons mit `share-urls.ts` URLs
3. **Click:** `window.open(url, '_blank')` + `fetch('/api/share/track', {keepalive: true})`
4. **DB:** `ShareEvent` Insert + `shareCounts` JSON Increment

## Arbeitspakete (PKG-1 bis PKG-8)

### PKG-1: Datenmodell & Migration
- Prisma Schema: `ShareEvent`, `ShareContentType`, `SharePlatform` Enums
- `shareCounts` JSON auf `Review`, `ReviewCollection`, `ReviewSeries`, `TwitchUser`
- Migration `20261025_add_share_tracking` (reversibel)
- Feature-Flags in `src/lib/feature-flags.ts`

### PKG-2: Share-URL-Generierung (`lib/share-urls.ts`)
- Funktionen pro Plattform: `buildTwitterUrl`, `buildBlueskyUrl`, `buildMastodonUrl`, `buildRedditUrl`, `buildDiscordUrl`, `buildCopyUrl`
- Text-Vorlagen pro Content-Type (Review, Collection, Series, Profile)
- Längen-Begrenzung (Twitter 280, Mastodon 500, etc.) mit Kürzung
- Mastodon: Instance-Parameter (Default `mastodon.social`), Client-seitige Auswahl
- Unit-Tests: URL-Building, Text-Kürzung, Edge-Cases

### PKG-3: Meta-Tags Generierung (`lib/share-meta.ts`)
- `generateShareMetadata(params): Metadata` für `generateMetadata()` Export
- Content-Type spezifische Felder:
  - Review: `article:author`, `article:published_time`, `article:tag[]`
  - Collection: `og:type=website`, erstes Review-Bild
  - Series: `article:published_time`, Hero-Bild
  - Profile: `profile:username`, `profile:first_name`, Avatar
- Fallback-Bild: `/og-default.png` (existiert prüfen, sonst generieren)
- Twitter: `summary_large_image` / `summary`, `@nerdiction_de` Site
- `unstable_cache` 5 Min, Tag `share-meta:{contentType}:{contentId}`

### PKG-4: Share-Tracking API (`/api/share/track`)
- POST `/api/share/track` — Zod Schema: `contentType`, `contentId`, `platform`
- Optional Auth: `userId` aus Session (Cookie)
- Rate-Limit: 30 req/min/IP (in-memory Map oder Upstash Redis falls verfügbar)
- Response: `202 Accepted`, `{ success: true }`
- Batch-Insert: `prisma.shareEvent.createMany` (alle 100 Events oder 30s via `setInterval`)
- Counter-Increment: `prisma.$queryRaw` für JSON `shareCounts` (atomar)
- Integration-Tests: Validierung, Rate-Limit, Counter, Auth/Anonymous

### PKG-5: Zentrale ShareButtons Komponente (`components/ui/ShareButtons.tsx`)
- Props Interface:
  ```ts
  interface ShareButtonsProps {
    contentType: 'review' | 'collection' | 'series' | 'profile';
    contentId: string;
    title: string;
    description?: string;
    url: string;
    image?: string;
    author?: string;
    platforms?: SharePlatform[]; // Default: alle 6
    variant?: 'inline' | 'dropdown' | 'minimal';
    className?: string;
  }
  ```
- Varianten:
  - `inline`: Alle Buttons nebeneinander (Desktop Default)
  - `dropdown`: `DropdownMenu` mit Plattformen (Mobile / platzsparend)
  - `minimal`: Nur Icons, Tooltip auf Hover
- Plattform-Icons: `lucide-react` (Twitter, MessageSquare für Bluesky, Globe für Mastodon, Reddit, MessageCircle für Discord, Link2 für Copy)
- Accessibility: `aria-label`, `focus-visible:ring`, Keyboard-Navigation
- Dark Mode: CSS-Variablen (`border-border`, `hover:bg-accent`)
- Click-Handler: `window.open` + `fetch('/api/share/track', {keepalive: true})`
- Copy-Link: `navigator.clipboard.writeText` + Toast (Sonner)
- Mastodon: Instance-Input via `Dialog` vor Redirect (nur bei Klick)
- Unit-Tests: Props-Validation, Variant-Rendering, Click-Handler-Mock

### PKG-6: Meta-Tags Integration in Seiten
- `src/app/reviews/[slug]/page.tsx`: `generateMetadata` → `share-meta.ts` (Review)
- `src/app/listen/[slug]/page.tsx`: `generateMetadata` → `share-meta.ts` (Collection)
- `src/app/serien/[slug]/page.tsx`: `generateMetadata` → `share-meta.ts` (Series)
- `src/app/u/[username]/page.tsx`: `generateMetadata` → `share-meta.ts` (Profile)
- `src/app/news/[slug]/page.tsx`: Bereits `ShareButtons` → Meta-Tags ergänzen
- Bestehende `ShareButtons` Imports durch neue `ui/ShareButtons` ersetzen

### PKG-7: Bestehende Share-Komponenten ersetzen
- `src/components/reviews/ReviewActions.tsx`: `ShareButtons` → neue `ui/ShareButtons` (variant `inline`)
- `src/app/listen/[slug]/page.tsx`: `ShareButton` (collections) → neue `ui/ShareButtons`
- `src/app/serien/[slug]/page.tsx`: `SeriesShareButton` → neue `ui/ShareButtons`
- `src/app/reviews/vergleichen/page.tsx`: `ReviewCompareShareButton` → neue `ui/ShareButtons`
- `src/app/news/[slug]/page.tsx`: `ShareButtons` (reviews) → neue `ui/ShareButtons` (Content-Type `review` oder `news`)
- Alte Dateien löschen: `components/collections/ShareButton.tsx`, `components/series/SeriesShareButton.tsx`, `components/reviews/compare/ReviewCompareShareButton.tsx`, `components/reviews/ShareButtons.tsx`

### PKG-8: Tests, Doku, Rollout
- Unit-Tests: `tests/lib/share-urls.test.ts`, `tests/lib/share-meta.test.ts`
- Integration-Tests: `tests/api/share.track.test.ts`
- E2E-Tests: `tests/e2e/share-buttons.test.ts` (Playwright)
  - Review: Buttons sichtbar, Klick → korrekte URL, Meta-Tags im HTML
  - Liste/Serie/Profil: gleiche Prüfung
  - Copy-Link: Toast erscheint
  - Mastodon: Instance-Dialog öffnet sich
  - Dark Mode: Styles korrekt
- Doku: `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `.env.example` (Feature-Flags)
- Feature-Flags Default: `true` für Staging/Prod
- Monitoring: Share-Events pro Tag, Top-Plattformen, Error-Rate Tracking-API

## Abhängigkeiten & Wiederverwendung

| Modul | Wiederverwendung |
|-------|------------------|
| `Button`, `DropdownMenu`, `Dialog`, `Toast` | shadcn/ui (bereits vorhanden) |
| `lucide-react` Icons | Twitter, MessageSquare, Globe, Reddit, MessageCircle, Link2, Check, Loader2 |
| `unstable_cache` | Next.js Cache (bereits in `lib/*` genutzt) |
| `prisma` Batch-Operations | `createMany`, `$queryRaw` für JSON-Increment |
| Feature-Flags | `src/lib/feature-flags.ts` Pattern |

## Cache-Strategie

| Resource | TTL | Tags | Invaliderung |
|----------|-----|------|--------------|
| `share-meta` | 5 Min | `share-meta:{type}:{id}` | Bei Content-Update |
| `share-counts` | 1 Min | `share-counts:{type}:{id}` | Bei `/api/share/track` |

## Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Mastodon Instance unbekannt | Mittel | UX-Bruch | Instance-Dialog vor Redirect, Default `mastodon.social` |
| Twitter API Änderungen | Niedrig | Buttons broken | URL-Building in separatem Modul, einfach anpassbar |
| Rate-Limit Bypass | Niedrig | Spam-Tracking | IP-basiert, `keepalive` verhindert Blocking |
| Clipboard API verweigert | Mittel | Copy fehlschlägt | Fallback: `prompt()` + Toast "Manuell kopieren" |
| Meta-Tags nicht gecrawlt | Niedrig | Schlechte Previews | `robots.txt` erlaubt Crawler, `generateMetadata` SSR |

## Schätzung

| Paket | Aufwand |abhängigkeiten |
|-------|---------|---------------|
| PKG-1: DB/Migration | 0.5h | — |
| PKG-2: Share-URLs | 1h | — |
| PKG-3: Meta-Tags | 1h | PKG-2 |
| PKG-4: Tracking API | 1.5h | PKG-1 |
| PKG-5: ShareButtons UI | 2h | PKG-2 |
| PKG-6: Seiten-Integration | 1h | PKG-3, PKG-5 |
| PKG-7: Alt-Komponenten ersetzen | 1h | PKG-5, PKG-6 |
| PKG-8: Tests/Doku | 1.5h | PKG-1–7 |
| **Total** | **~9.5h** | |

## Nächste Schritte

1. PKG-1: Prisma Schema + Migration erstellen
2. PKG-2: `lib/share-urls.ts` mit Unit-Tests
3. PKG-3: `lib/share-meta.ts` mit Unit-Tests
4. PKG-4: `/api/share/track` Route + Integration-Tests
5. PKG-5: `components/ui/ShareButtons.tsx` + Unit-Tests
6. PKG-6: `generateMetadata` in 4 Seiten
7. PKG-7: Imports ersetzen, alte Dateien löschen
8. PKG-8: E2E-Tests, Doku, Flags on, Push