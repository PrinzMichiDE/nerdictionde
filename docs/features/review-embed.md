# Feature Spec: Review-Embed für externe Sites

## 1. Problem und Nutzen

**Problem:** Nutzer und Partner-Websites können Reviews, Listen oder Serien von Nerdiction.de nicht einfach in ihre eigenen Seiten einbetten. Es fehlt ein standardisierter Embed-Code (wie YouTube, Twitter, GitHub Gists), der Distribution, Backlinks und Markenbekanntheit generiert.

**Nutzen:**
- **Distribution:** Reviews/Listen/Serien werden auf Blogs, Foren, News-Seiten, Reddit, Discord eingebettet → neuer Traffic
- **Backlinks:** Jeder Embed enthält Link zurück zur Original-Seite → SEO-Vorteil
- **Markenbekanntheit:** Nerdiction-Branding auf externen Sites
- **Nutzer-Comfort:** Ein-Klick-Kopieren des Embed-Codes, keine technische Hürde
- **Partner-Integration:** Affiliate-Partner, Publisher, Entwickler können Reviews direkt einbetten

**Zielgruppe:** Endnutzer (Teilen auf eigenem Blog/Forum), Partner-Websites, Content-Creator, Publisher/Entwickler

---

## 2. User Stories und Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien |
|----|------------|-------------------|
| US1 | Als Nutzer möchte ich einen Embed-Code für ein Review kopieren, um es in meinem Blog einzubetten. | - "Einbetten"-Button auf `/reviews/[slug]` öffnet Modal mit Embed-Code<br>- Code: `<script src=".../embed.js"></script><div data-nerdiction-embed="review" data-slug="..."></div>`<br>- Copy-to-Clipboard mit Toast-Bestätigung<br>- Preview im Modal zeigt gerenderten Embed |
| US2 | Als Nutzer möchte ich einen Embed-Code für eine Liste kopieren. | - "Einbetten"-Button auf `/listen/[slug]` (neben Share)<br>- `data-nerdiction-embed="collection"` + `data-slug` |
| US3 | Als Nutzer möchte ich einen Embed-Code für eine Serie kopieren. | - "Einbetten"-Button auf `/serien/[slug]`<br>- `data-nerdiction-embed="series"` + `data-slug` |
| US4 | Als externe Site möchte ich den Embed via Script-Tag laden und er rendert sich selbst. | - `/embed.js` liefert minimiertes JS (~5-10 KB gzipped)<br>- Findet alle `[data-nerdiction-embed]` und ersetzt sie durch Shadow-DOM Widget<br>- Keine CSS-Konflikte (Shadow DOM + CSS-Variablen)<br>- Responsive (passt Container-Breite)<br>- Themeable via `data-theme="light|dark|auto"` |
| US5 | Als externe Site möchte ich No-Cookie/Privacy-Friendly Embeds. | - Keine Cookies gesetzt<br>- Kein Tracking ohne Consent<br>- `data-consent="false"` deaktiviert Analytics-Pings |
| US6 | Als Admin möchte ich Embeds deaktivieren können. | - Feature-Flag `FEATURE_REVIEW_EMBED` (Default: `true`)<br>- Bei `false`: 404 auf `/api/embed/*` und `/embed.js` |
| US7 | Als Entwickler möchte ich CSP-kompatible Embeds. | - `script-src 'self' https://nerdiction.de` + `'unsafe-inline'` nur für Inline-Styles im Shadow DOM<br>- Keine `eval()` oder `new Function()`<br>- Styles via `CSSStyleSheet` in Shadow DOM |

---

## 3. Scope und Nicht-Scope

**In Scope (MVP):**
- Embed-Endpunkte: `/api/embed/review/[slug]`, `/api/embed/collection/[slug]`, `/api/embed/series/[slug]`
- Embed-Script: `/embed.js` (statisch serviert, via Next.js `public/` oder API Route)
- Widget-React-App: Rendert Review/Collection/Series Card im Shadow DOM
- Embed-Modal auf Detailseiten (Review, Listen, Serie) mit Copy-to-Clipboard + Preview
- Theme-Support: `light`, `dark`, `auto` (via `prefers-color-scheme`)
- Responsive Design (Container-Query oder Width-Observer)
- Feature-Flag Gate
- CSP-kompatibel, No-Cookie

**Nicht-Scope (später):**
- Embed für Profile (`/u/[username]`)
- Embed für News (`/news/[slug]`)
- oEmbed-Endpunkt (`/api/oembed`)
- AMP-Version
- Server-seitiges Rendering des Embed-HTML (nur Client-seitig via JS)
- A/B-Testing verschiedener Widget-Layouts
- Analytics-Dashboard für Embed-Performance

---

## 4. Randfälle, Fehlerfälle, Berechtigungen, Nebenläufigkeit

| Fall | Verhalten |
|------|-----------|
| Review/Liste/Serie nicht gefunden | 404 JSON: `{ error: "not_found", message: "Review nicht gefunden" }` |
| Review/Liste/Serie privat/gelöscht | 403 JSON: `{ error: "forbidden", message: "Nicht öffentlich" }` |
| Feature-Flag deaktiviert | 404 auf allen Embed-Endpunkten + `/embed.js` |
| Externe Site blockiert Scripts | Fallback: `<noscript>` mit Link zur Original-Seite |
| Container zu schmal (< 280px) | Compact-Mode: nur Titel, Score, Link |
| Container sehr breit (> 800px) | Max-Width 600px, zentriert |
| Gleichzeitige Embeds auf einer Seite | Jeder Embed isoliert via Shadow DOM, gemeinsame Script-Instanz |
| Theme-Wechsel auf Host-Seite | `data-theme="auto"` reagiert auf `prefers-color-scheme` Change Event |
| Embed in Iframe (z.B. AMP) | Funktioniert, aber Shadow DOM Isolation bleibt |
| Rate-Limiting | `/api/embed/*`: 100 req/min/IP (generös, da meist gecacht) |
| CORS | `Access-Control-Allow-Origin: *` für Embed-Endpunkte |

---

## 5. Auswirkungen auf bestehende Features

| Feature | Auswirkung |
|---------|------------|
| Review-Detail (`/reviews/[slug]`) | Neuer "Einbetten"-Button in `ReviewActions` (neben Share) |
| Listen-Detail (`/listen/[slug]`) | Neuer "Einbetten"-Button |
| Serien-Detail (`/serien/[slug]`) | Neuer "Einbetten"-Button |
| Feature-Flags | Neuer Flag `FEATURE_REVIEW_EMBED` in `lib/feature-flags.ts` + `.env.example` |
| Meta-Tags | Keine Änderung (Embed nutzt eigene API) |
| Search/SEO | Keine direkte Auswirkung, aber Backlinks durch Embeds |

---

## 6. Datenmodell und Migrationen

**Keine neuen Prisma Models.** Embed nutzt bestehende Models:
- `Review` (via `slug`)
- `ReviewCollection` (via `slug`)
- `ReviewSeries` (via `slug`)

**Keine Migration nötig.** Additives Feature.

**Neue Feature-Flags:**
```typescript
// lib/feature-flags.ts
FEATURE_REVIEW_EMBED: true // Default true
```

**Environment Variable:**
```env
# .env.example
FEATURE_REVIEW_EMBED=true
```

---

## 7. API-Änderungen

### 7.1 Embed Data API (JSON)

```
GET /api/embed/review/[slug]
GET /api/embed/collection/[slug]
GET /api/embed/series/[slug]
```

**Response (Review):**
```json
{
  "type": "review",
  "slug": "eldring-ring-review",
  "title": "Elden Ring – Review",
  "excerpt": "FromSoftware's Meisterwerk...",
  "score": 9.5,
  "scoreLabel": "Meisterwerk",
  "category": "game",
  "categoryLabel": "Games",
  "coverImage": "https://.../cover.jpg",
  "coverAlt": "Elden Ring Cover",
  "author": { "username": "max", "displayName": "Max Mustermann", "avatar": "https://..." },
  "publishedAt": "2024-03-15T10:00:00Z",
  "url": "https://nerdiction.de/reviews/eldring-ring-review",
  "pros": ["Offene Welt", "Combat", "Atmosphäre"],
  "cons": ["Technische Macken", "Wiederholungen"],
  "specs": { "Developer": "FromSoftware", "Publisher": "Bandai Namco", "Platforms": ["PC", "PS5", "Xbox Series"] }
}
```

**Response (Collection):**
```json
{
  "type": "collection",
  "slug": "beste-rpgs-2024",
  "title": "Beste RPGs 2024",
  "description": "Unsere Top 10...",
  "itemCount": 10,
  "owner": { "username": "max", "displayName": "Max Mustermann", "avatar": "https://..." },
  "coverImage": "https://.../cover.jpg",
  "createdAt": "2024-01-15T10:00:00Z",
  "url": "https://nerdiction.de/listen/beste-rpgs-2024",
  "items": [
    { "position": 1, "review": { "slug": "...", "title": "...", "score": 9.5, "coverImage": "..." } },
    ...
  ]
}
```

**Response (Series):**
```json
{
  "type": "series",
  "slug": "elden-ring-dlc-reviews",
  "title": "Elden Ring: Alle DLC-Reviews",
  "description": "Base Game + Shadow of the Erdtree",
  "partCount": 2,
  "owner": { "username": "max", "displayName": "Max Mustermann", "avatar": "https://..." },
  "coverImage": "https://.../cover.jpg",
  "createdAt": "2024-06-15T10:00:00Z",
  "url": "https://nerdiction.de/serien/elden-ring-dlc-reviews",
  "parts": [
    { "order": 1, "review": { "slug": "...", "title": "Elden Ring – Review", "score": 9.5 } },
    { "order": 2, "review": { "slug": "...", "title": "Shadow of the Erdtree – Review", "score": 9.0 } }
  ]
}
```

### 7.2 Embed Script Endpoint

```
GET /embed.js
```

- Serviert minimiertes JavaScript (~5-10 KB gzipped)
- Cache-Control: `public, max-age=31536000, immutable` (Versionierung via Query-Param `?v=...`)
- Findet alle `[data-nerdiction-embed]` Elemente
- Für jedes: Fetch an `/api/embed/{type}/{slug}` → Rendert Widget in Shadow DOM

---

## 8. UI/UX-Ablauf

### 8.1 Embed-Modal (auf Detailseiten)

**Trigger:** Klick auf "Einbetten"-Button (Icon: `Code2` von lucide-react) in `ReviewActions` / Listen-Actions / Series-Actions

**Modal-Inhalt:**
1. **Preview-Bereich** (oben): Live-Render des Embeds in `<div style="width: 100%; max-width: 600px;">` mit echtem `/embed.js` (via dynamic import)
2. **Code-Bereich** (unten): `<pre><code>` mit Embed-HTML, Syntax-Highlighting (optional)
3. **Copy-Button:** Kopiert Code in Clipboard, Toast "Embed-Code kopiert!"
4. **Optionen** (Accordion "Erweitert"):
   - Theme: `auto` / `light` / `dark` (Radio-Buttons) → aktualisiert Preview + Code
   - Consent: Checkbox "Analytics deaktivieren" → fügt `data-consent="false"` hinzu
   - Compact: Checkbox "Kompakt-Modus" → fügt `data-compact="true"` hinzu

**Barrierefreiheit:**
- Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="embed-modal-title"`
- Focus-Trap im Modal
- Escape schließt Modal
- Copy-Button: `aria-label="Embed-Code in Zwischenablage kopieren"`

### 8.2 Embed-Widget (auf externer Site)

**HTML-Snippet:**
```html
<script async src="https://nerdiction.de/embed.js"></script>
<div data-nerdiction-embed="review" data-slug="elden-ring-review" data-theme="auto"></div>
```

**Attribute:**
| Attribut | Werte | Default | Beschreibung |
|----------|-------|---------|--------------|
| `data-nerdiction-embed` | `review` \| `collection` \| `series` | (erforderlich) | Content-Type |
| `data-slug` | string | (erforderlich) | Slug des Contents |
| `data-theme` | `auto` \| `light` \| `dark` | `auto` | Theme-Modus |
| `data-consent` | `true` \| `false` | `true` | Analytics-Consent |
| `data-compact` | `true` \| `false` | `false` | Kompakt-Darstellung |

**Widget-Zustände:**
1. **Loading:** Skeleton (Shimmer) in Container-Größe
2. **Success:** Gerenderte Card (Review/Collection/Series)
3. **Error:** Fallback-Link "Auf nerdiction.de ansehen" + Fehlermeldung
4. **Not Found/Private:** "Inhalt nicht verfügbar" + Link

**Widget-Layout (Review):**
```
┌─────────────────────────────────────┐
│ [Cover]  Titel                      │
│         Score Badge (9.5)           │
│         Kategorie-Chip              │
│         Excerpt (2 Zeilen, clamp)   │
│         Pros/Cons (je 2, kompakt)   │
│         ─────────────────────────   │
│         Von @autor · Datum          │
│         [Auf nerdiction.de lesen]   │
└─────────────────────────────────────┘
```

**Widget-Layout (Collection/Series):** Ähnlich, aber mit Item-Count/Part-Count und ersten 3 Items als Mini-Cards.

---

## 9. Sicherheit, Datenschutz, Performance

**Sicherheit:**
- **CSP:** Embed-Script lädt nur von `self`, Styles inline im Shadow DOM (kein `style-src` nötig)
- **XSS:** Alle User-Daten via `textContent` oder `setAttribute`, keine `innerHTML` mit User-Input
- **Clickjacking:** `X-Frame-Options: SAMEORIGIN` auf Embed-Seiten (nicht nötig, da Script-basiert)
- **Rate-Limit:** 100 req/min/IP auf `/api/embed/*`

**Datenschutz:**
- **No-Cookie:** Embed setzt keine Cookies
- **No-Tracking by Default:** `data-consent="false"` → keine Analytics-Pings
- **Referrer-Policy:** `strict-origin-when-cross-origin` auf Embed-API
- **Keine IP-Logs** für Embed-Requests (oder nur aggregiert)

**Performance:**
- **Script-Größe:** < 10 KB gzipped (React + Widget-Code, tree-shaken)
- **Caching:** `/embed.js` long-term cached (1 Jahr, versioniert)
- **API-Caching:** `unstable_cache` 5 Min auf Embed-Endpunkte + Tag-Invaliderung (`embed:{type}:{slug}`)
- **Lazy-Load:** `async` Script + IntersectionObserver für Embed-Container (optional)
- **Shadow DOM:** Keine Style-Leaks, keine Reflows auf Host-Seite
- **Critical CSS:** Inline im Shadow DOM, keine externen CSS-Requests

---

## 10. Teststrategie

### Unit-Tests
- `tests/lib/embed-schema.test.ts`: Zod-Schemas für Embed-Response (Review, Collection, Series)
- `tests/lib/embed-data.test.ts`: Server-Logic `getEmbedData(type, slug)` — 404, 403, Success, Cache-Tags
- `tests/lib/embed-script.test.ts`: Script-Generierung, Attribute-Parsing, Theme-Handling

### Integration-Tests
- `tests/api/embed/review.test.ts`: GET `/api/embed/review/[slug]` — Auth nicht nötig, Feature-Flag, 404, 403, Success
- `tests/api/embed/collection.test.ts`: Analog
- `tests/api/embed/series.test.ts`: Analog
- `tests/api/embed/script.test.ts`: GET `/embed.js` — Content-Type, Cache-Header, Script-Inhalt

### E2E-Tests (Playwright via e2e)
- Embed-Modal auf Review-Detail öffnet, Preview rendert, Copy funktioniert
- Embed-Modal auf Listen-Detail
- Embed-Modal auf Serien-Detail
- Theme-Wechsel in Modal aktualisiert Preview + Code
- Externe Test-Seite lädt `/embed.js` und rendert Widget korrekt
- Compact-Mode bei schmalem Container
- Error-State bei 404/403

### Manuelle Tests
- Embed in lokaler HTML-Datei testen (file://)
- Embed in CodePen/JSFiddle testen
- CSP-Test: `script-src 'self' https://localhost:3000`
- Mobile Viewport (320px, 375px, 768px)
- Dark/Light/System-Theme auf Host-Seite

---

## 11. Rollout-Plan

1. **Feature-Flag Default: `true`** — Sofort aktiv für alle
2. **Phase 1 (MVP):** Review-Embed only (API + Script + Modal + Widget)
3. **Phase 2:** Collection-Embed + Series-Embed (API-Erweiterung, Widget-Types)
4. **Phase 3:** oEmbed-Endpunkt (für WordPress, Notion, etc. Auto-Embed)
5. **Monitoring:** Embed-Requests loggen (nicht Analytics), Error-Rate < 1%

**Rollback:** Feature-Flag auf `false` → 404 auf allen Embed-Endpunkten, `/embed.js` liefert 404.

---

## 12. Review-Checkliste (F6)

- [ ] Alle Akzeptanzkriterien der Spec erfüllt und getestet
- [ ] Randfälle behandelt: 404, 403, Feature-Flag off, privat Content
- [ ] Eingaben validiert (Slug-Format, Type-Enum), keine Secrets im Code
- [ ] Performance: Script < 10 KB gz, API cached 5 Min, Shadow DOM Isolation
- [ ] Keine Migrationen nötig (bestehende Models)
- [ ] Abwärtskompatibilität: Keine Breaking Changes
- [ ] UI: Modal zugänglich (ARIA, Focus-Trap, Keyboard), Preview funktional
- [ ] Widget: Responsive, Themeable, No-Cookie, CSP-kompatibel
- [ ] Security: XSS-Schutz, Rate-Limit, CORS, Referrer-Policy