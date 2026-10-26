# Feature-Spezifikation: Social Sharing & Viral Loops

## 1. Problem und Nutzen

**Problem:** Nutzer teilen Reviews, Listen und Serien kaum, weil:
- Keine One-Click Share-Buttons für relevante Plattformen (Twitter/X, Bluesky, Mastodon, Reddit, Discord)
- OG/Twitter Cards unvollständig oder fehlen
- Keine Share-Statistiken (wie oft wurde geteilt?)
- Share-URLs nicht getrackt (kein UTM, keine Attribution)

**Nutzen:**
- Erhöhter Traffic durch virales Teilen (organische Reichweite)
- Markenbekanntheit durch konsistente Share-Previews
- Messbarkeit: Welche Inhalte werden wie oft wo geteilt?
- Nutzerbindung: Einfaches Teilen = mehr Interaktion
- SEO: Mehr Backlinks, Social Signals

**Zielgruppe:** Alle Nutzer (Leser, Autoren), indirekt: neue Besucher über Shares

---

## 2. User Stories und Akzeptanzkriterien

### US1: One-Click Share auf Review-Detailseiten
**Als** Leser **möchte ich** einen Review mit einem Klick auf Twitter/X, Bluesky, Mastodon, Reddit, Discord teilen **damit** ich meine Meinung schnell verbreiten kann.

**Akzeptanzkriterien:**
- [ ] Share-Buttons für: Twitter/X, Bluesky, Mastodon, Reddit, Discord, Link kopieren
- [ ] Buttons direkt unter Review-Header (neben Reaktionen) + am Ende des Reviews
- [ ] Vorbelegter Text: Titel + Kurz-URL + Hashtags (#Nerdiction #Gaming #Review)
- [ ] Öffnet in neuem Tab/Fenster (nicht Popup-Blocker)
- [ ] Link-Kopie: Toast-Bestätigung "Link kopiert", Clipboard API + Fallback

### US2: One-Click Share auf Listen-Detailseiten (`/listen/[slug]`)
**Als** Nutzer **möchte ich** eine kuratierte Liste teilen **damit** andere sie entdecken.

**Akzeptanzkriterien:**
- [ ] Gleiche Plattformen wie US1
- [ ] Vorbelegter Text: Listen-Titel + "Schau dir meine Liste an" + Kurz-URL
- [ ] Buttons im Listen-Header (neben Follow-Button)

### US3: One-Click Share auf Serien-Detailseiten (`/serien/[slug]`)
**Als** Nutzer **möchte ich** eine Review-Serie teilen **damit** andere die Serie lesen.

**Akzeptanzkriterien:**
- [ ] Gleiche Plattformen wie US1
- [ ] Vorbelegter Text: Serientitel + "Teil X von Y" + Kurz-URL
- [ ] Buttons im Serien-Header

### US4: One-Click Share auf Nutzer-Profilen (`/u/[username]`)
**Als** Nutzer **möchte ich** mein Profil teilen **damit** andere mir folgen.

**Akzeptanzkriterien:**
- [ ] Gleiche Plattformen wie US1
- [ ] Vorbelegter Text: "Folge mir auf Nerdiction" + Profil-URL
- [ ] Buttons im Profil-Header

### US5: Optimierte OG / Twitter Cards für alle teilbaren Seiten
**Als** System **muss ich** korrekte Meta-Tags rendern **damit** Share-Previews auf allen Plattformen gut aussehen.

**Akzeptanzkriterien:**
- [ ] Review: `og:title` = Review-Titel, `og:description` = Excerpt (160 chars), `og:image` = Hero-Bild, `og:type` = article, `article:author`, `article:published_time`, `article:tag` (Kategorie, Tags)
- [ ] Liste: `og:title` = Listen-Titel, `og:description` = Beschreibung, `og:image` = erstes Review-Bild oder Platzhalter, `og:type` = website
- [ ] Serie: `og:title` = Serientitel, `og:description` = Beschreibung, `og:image` = Hero, `og:type` = article
- [ ] Profil: `og:title` = Username, `og:description` = Bio, `og:image` = Avatar, `og:type` = profile
- [ ] Twitter Cards: `summary_large_image` für Reviews/Listen/Serien, `summary` für Profile
- [ ] `twitter:site` = @nerdiction_de, `twitter:creator` = Autor-Handle (falls bekannt)

### US6: Share-Statistiken (Tracking)
**Als** Redaktion **möchte ich** sehen, wie oft Inhalte geteilt wurden **damit** ich virale Inhalte identifiziere.

**Akzeptanzkriterien:**
- [ ] Prisma Model `ShareEvent`: `id`, `contentType` (REVIEW|COLLECTION|SERIES|PROFILE), `contentId`, `platform` (TWITTER|BLUESKY|MASTODON|REDDIT|DISCORD|COPY_LINK), `userId` (nullable), `createdAt`
- [ ] Inkrementeller Counter pro Plattform auf Content-Entity (`shareCountTwitter`, `shareCountBluesky`, ... oder JSON `shareCounts`)
- [ ] API: `POST /api/share/track` (Client-seitig onClick, fire-and-forget)
- [ ] Admin-Dashboard: Top geteilte Inhalte (später, nicht MVP)
- [ ] Feature-Flag `FEATURE_SHARE_TRACKING` (Default: `true`)

### US7: Share-Button Komponente (Wiederverwendbar)
**Als** Entwickler **möchte ich** eine zentrale `ShareButtons` Komponente **damit** ich sie konsistent überall einbaue.

**Akzeptanzkriterien:**
- [ ] Props: `contentType`, `contentId`, `title`, `description`, `url`, `image`, `platforms[]` (optional, Default: alle)
- [ ] Varianten: `inline` (nebeneinander), `dropdown` (Platz sparend), `minimal` (nur Icons)
- [ ] SSR-fähig (keine Client-only Logik im Render)
- [ ] Accessibility: `aria-label` pro Button, Keyboard-Navigation, Fokus-Management
- [ ] Dark Mode Support via CSS-Variablen

---

## 3. Scope und Nicht-Scope

**In Scope:**
- Share-Buttons für 6 Plattformen (Twitter/X, Bluesky, Mastodon, Reddit, Discord, Copy Link)
- OG/Twitter Card Meta-Tags für Reviews, Listen, Serien, Profile
- Share-Tracking (DB + API)
- Wiederverwendbare `ShareButtons` Komponente
- Integration in bestehende Seiten (Review, Liste, Serie, Profil)
- Feature-Flag `FEATURE_SOCIAL_SHARING` (Default: `true`)

**Nicht-Scope (später):**
- WhatsApp / Telegram / Email Share (native Apps)
- UTM-Parameter automatisch anhängen
- Share-Analytics Dashboard (Admin)
- A/B-Tests für Share-Text-Varianten
- Native Web Share API Level 2 (Files, Multiple)
- QR-Code für Mobile-Desktop Sharing

---

## 4. Randfälle, Fehlerfälle, Leere Zustände

| Situation | Verhalten |
|-----------|-----------|
| Plattform-URL zu lang (Twitter 280 chars) | Text kürzen, URL priorisieren, "…" anhängen |
| Kein Hero-Bild vorhanden | Fallback: Default-OG-Image (`/og-default.png`) |
| Nutzer nicht eingeloggt (Share-Tracking) | `userId = null`, Event trotzdem tracken |
| Clipboard API verweigert | Fallback: `prompt()` mit "Drücke Strg+C", Toast "Manuell kopieren" |
| Pop-up-Blocker verhindert Fenster | `rel="noopener noreferrer"`, `_blank`, Toast "Erlaube Pop-ups für nerdiction.de" |
| Mastodon-Instance unbekannt | Eingabe-Feld für Instance-Domain, Default: `mastodon.social` |
| Reddit: Subreddit unbekannt | Kein Subreddit vorselektieren, Nutzer wählt auf Reddit |

---

## 5. Auswirkungen auf bestehende Features

| Feature | Auswirkung |
|---------|------------|
| Review-Detail (`/reviews/[slug]`) | Share-Buttons hinzufügen, Meta-Tags erweitern |
| Listen-Detail (`/listen/[slug]`) | Share-Buttons hinzufügen, Meta-Tags erweitern |
| Serien-Detail (`/serien/[slug]`) | Share-Buttons hinzufügen, Meta-Tags erweitern |
| Profil (`/u/[username]`) | Share-Buttons hinzufügen, Meta-Tags erweitern |
| `ReviewReactions` Komponente | Share-Buttons daneben platzieren (Desktop) / darunter (Mobile) |
| `CollectionShareButton` | Ersetzen durch neue `ShareButtons` Komponente |
| `SeriesShareButton` | Ersetzen durch neue `ShareButtons` Komponente |
| `ReviewCompareShareButton` | Ersetzen durch neue `ShareButtons` Komponente |
| SEO / `generateMetadata` | OG/Twitter Tags zentralisieren in `lib/share-meta.ts` |

**Abwärtskompatibilität:** Vollständig. Bestehende Share-Buttons werden ersetzt, nicht gebrochen.

---

## 6. Datenmodell und Migrationen

### Prisma Schema Erweiterungen

```prisma
model ShareEvent {
  id           String       @id @default(cuid())
  contentType  ShareContentType
  contentId    String
  platform     SharePlatform
  userId       String?      @map("user_id")
  createdAt    DateTime     @default(now()) @map("created_at")

  @@index([contentType, contentId])
  @@index([userId])
  @@index([createdAt])
  @@map("share_events")
}

enum ShareContentType {
  REVIEW
  COLLECTION
  SERIES
  PROFILE
}

enum SharePlatform {
  TWITTER
  BLUESKY
  MASTODON
  REDDIT
  DISCORD
  COPY_LINK
}

// Denormalisierte Counter auf Content-Entities (optional, für Performance)
model Review {
  // ... existing
  shareCounts Json? @default("{}") @map("share_counts") // { "twitter": 5, "bluesky": 3, ... }
}

model ReviewCollection {
  // ... existing
  shareCounts Json? @default("{}") @map("share_counts")
}

model ReviewSeries {
  // ... existing
  shareCounts Json? @default("{}") @map("share_counts")
}

model TwitchUser {
  // ... existing
  shareCounts Json? @default("{}") @map("share_counts")
}
```

**Migration:** `20261025_add_share_tracking` (reversibel: Tabellen/Spalten droppen)

---

## 7. API-Änderungen

### POST `/api/share/track`
- Body: `{ contentType: "REVIEW"|"COLLECTION"|"SERIES"|"PROFILE", contentId: string, platform: "TWITTER"|"BLUESKY"|"MASTODON"|"REDDIT"|"DISCORD"|"COPY_LINK" }`
- Auth: Optional (Cookie-Session), `userId` aus Session falls eingeloggt
- Response: `{ success: true }` (fire-and-forget, 202 Accepted)
- Rate-Limit: 30 req/min pro IP (verhindert Spam)

### GET `/api/share/stats/[contentType]/[contentId]` (Admin, später)
- Response: `{ total: number, byPlatform: Record<SharePlatform, number>, timeline: { date: string, count: number }[] }`

---

## 8. UI/UX-Ablauf

### Share-Button Interaktion
1. Nutzer klickt Share-Button (z.B. Twitter)
2. `onClick` → `window.open(shareUrl, '_blank', 'noopener,noreferrer')`
3. Parallel: `fetch('/api/share/track', { method: 'POST', body: JSON.stringify({...}), keepalive: true })`
4. Bei Copy-Link: `navigator.clipboard.writeText(url)` → Toast "Link kopiert"

### Meta-Tags Generierung (Server Component)
```tsx
// lib/share-meta.ts
export function generateShareMetadata(params: {
  contentType: 'review' | 'collection' | 'series' | 'profile';
  title: string;
  description: string;
  image?: string;
  url: string;
  author?: string;
  publishedAt?: Date;
  tags?: string[];
}): Metadata {
  // Returns Metadata object for generateMetadata()
}
```

### Lade-/Fehler-/Erfolgszustände
- Buttons: Sofort interaktiv (kein Loading), Tracking asynchron
- Copy-Link: Toast "Link kopiert" (grün) / "Fehler: Manuell kopieren" (rot)
- Meta-Tags: SSR, keine Client-seitigen Zustände

### Barrierefreiheit
- Buttons: `<button>` mit `aria-label="Auf Twitter teilen"` etc.
- Icon + Screen-Reader-Text (nicht nur Icon)
- Fokus-Ring sichtbar (`focus-visible:ring-2`)
- Reduced Motion: Keine Animationen auf Buttons
- Kontrast: WCAG AA für Button-Farben (Icon + Background)

---

## 9. Sicherheit und Performance

**Sicherheit:**
- `share/track` API: Rate-Limit, Input-Validierung (Zod), keine PII außer `userId` (Hash)
- Share-URLs: Keine sensiblen Parameter, nur öffentliche IDs
- `rel="noopener noreferrer"` auf allen externen Links
- CSP: `connect-src` für Share-Tracking-Endpunkt erlauben

**Performance:**
- Share-Buttons: Client Component, aber minimal (kein Heavy JS)
- Meta-Tags: SSR via `generateMetadata`, gecacht via `unstable_cache` (5 Min)
- Share-Events: Batch-Insert via `prisma.shareEvent.createMany` (alle 100 Events oder 30s)
- `shareCounts` JSON: Inkrementell via `$set`/`$increment` in Prisma (später optimieren)

---

## 10. Teststrategie

### Unit-Tests (`tests/lib/share.test.ts`)
- Share-URL-Generierung pro Plattform (Twitter, Bluesky, Mastodon, Reddit, Discord, Copy)
- Text-Kürzung bei Längenlimit
- Meta-Tags-Generierung pro Content-Type
- Fallback-Bilder bei fehlendem Hero

### Integration-Tests (`tests/api/share.track.test.ts`)
- POST `/api/share/track` mit validen Daten → 202
- POST `/api/share/track` ohne Auth → 202 (userId null)
- POST `/api/share/track` ungültige Platform → 400
- Rate-Limit überschritten → 429
- Counter-Inkrement auf Content-Entity prüfen

### E2E-Tests (Playwright)
- Review-Detail: Share-Buttons sichtbar, Klick öffnet korrekte URL
- Meta-Tags im HTML prüfen (og:title, twitter:card, etc.)
- Copy-Link: Clipboard-Toast erscheint
- Mastodon: Instance-Auswahl funktioniert
- Dark Mode: Buttons korrekt gestyled

---

## 11. Rollout-Plan

1. **Feature-Flag:** `FEATURE_SOCIAL_SHARING` (Default: `true`), `FEATURE_SHARE_TRACKING` (Default: `true`)
2. **Phase 1:** `ShareButtons` Komponente + Share-URL-Logik + Unit-Tests
3. **Phase 2:** Meta-Tags (`lib/share-meta.ts`) + Integration in Review/Listen/Serien/Profil
3. **Phase 3:** Share-Tracking API + DB Migration + Counter
4. **Phase 4:** Bestehende Share-Buttons ersetzen (ReviewReactions, Collections, Series, Compare)
5. **Phase 5:** E2E-Tests, Production Rollout (Flags on), Monitoring

---

## 12. Review-Checkliste (F6)

- [ ] Alle User Stories haben messbare Akzeptanzkriterien
- [ ] Randfälle und Fehlerpfade dokumentiert (Mastodon Instance, Clipboard Fallback, URL-Länge)
- [ ] Migration reversibel (ShareEvent droppbar, shareCounts Spalten droppbar)
- [ ] Keine Breaking Changes für bestehende Reviews/Listen/Serien/Profile
- [ ] OG/Twitter Tags vollständig für alle 4 Content-Types
- [ ] Barrierefreiheit: Labels, ARIA, Fokus, Reduced Motion, Kontrast
- [ ] Performance: Caching, Batch-Inserts, keine N+1
- [ ] Security: Rate-Limit, Validierung, noopener, CSP
- [ ] Teststrategie: Unit, Integration, E2E definiert
- [ ] Bestehende Share-Komponenten konsolidiert (ReviewReactions, CollectionShareButton, SeriesShareButton, ReviewCompareShareButton)