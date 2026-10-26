# Feature Spec: Review-Vergleich erweitern

## 1. Problem und Nutzen

**Problem:** Die bestehende Vergleichsseite `/reviews/vergleichen` zeigt nur grundlegende Informationen (Bild, Score, Pros/Cons, Release-Datum, Kategorie). Für Kaufentscheidungen fehlen entscheidende Details: technische Spezifikationen, Preisverlauf, Screenshots/Video-Material, und der Vergleich ist auf 2 Reviews beschränkt.

**Nutzen:**
- Nutzer können bis zu 3 Reviews gleichzeitig vergleichen (bisher 2)
- Technische Specs nebeneinander (CPU/GPU-Anforderungen, Speicher, etc.)
- Preisverlauf und aktuelle Deals direkt im Vergleich
- Screenshots und YouTube-Videos pro Review
- URL teilbar (`?ids=slug1,slug2,slug3`) für einfache Weitergabe
- Bessere Kaufentscheidung durch vollständigen Überblick

**Zielgruppe:** Endnutzer, die Kaufentscheidungen treffen (Spiele, Hardware, Filme/Serien)

## 2. User Stories & Akzeptanzkriterien

### US1: Bis zu 3 Reviews vergleichen
- **Als** Nutzer **möchte ich** bis zu 3 Reviews per URL auswählen (`/reviews/vergleichen?ids=slug1,slug2,slug3`)
- **Damit** ich mehrere Produkte parallel bewerten kann
- **AK1:** URL-Parameter `ids` akzeptiert 1–3 kommagetrennte Slugs
- **AK2:** Bei 1 Review: Hinweis "Füge weitere hinzu" (wie bisher)
- **AK3:** Bei 2–3 Reviews: Seitenvergleich in Grid (1 Spalte mobile, 2 Spalten tablet, 3 Spalten desktop)
- **AK4:** Ungültige/nicht existierende Slugs werden ignoriert (nicht 404, nur Warnung im Log)
- **AK5:** Duplikate in `ids` werden entfernt
- **AK6:** Maximale 3 Reviews — weitere werden abgeschnitten mit Toast-Hinweis

### US2: Technische Spezifikationen vergleichen
- **Als** Nutzer **möchte ich** die `specs` (JSON) und relevante `metadata` (Developer, Publisher, Genres, Plattformen, Modi) nebeneinander sehen
- **Damit** ich technische Unterschiede auf einen Blick erkenne
- **AK1:** Specs-Tabelle pro Review (Key-Value aus `review.specs` JSON)
- **AK2:** Metadaten: Developer, Publisher, Genres, Plattformen, Spielmodi (aus `review.metadata`)
- **AK3:** Fehlende Specs: "–" anzeigen, keine leere Tabelle
- **AK4:** Nur Keys anzeigen, die in mindestens einem der verglichenen Reviews vorkommen (Union der Keys)
- **AK5:** Responsiv: Tabelle horizontal scrollbar auf Mobile

### US3: Preisverlauf & Deals vergleichen
- **Als** Nutzer **möchte ich** den Preisverlauf (Letzte 5 Einträge) und aktuelle Deals sehen
- **Damit** ich den besten Preis finde
- **AK1:** Preisverlauf: Liniendiagramm (SVG/Canvas) oder kompakte Liste der letzten 5 Einträge (Datum, Preis, Quelle)
- **AK2:** Aktuelle Deals: Badge mit Rabatt, Preis, Quelle (mydealz, Steam, etc.), Link
- **AK3:** Kein Preisverlauf/Deals: "Keine Preisdaten" anzeigen
- **AK4:** Daten aus `review.priceHistory` (nach `recordedAt` desc, limit 5) und `review.deals` (status=active)

### US4: Screenshots & Video vergleichen
- **Als** Nutzer **möchte ich** Screenshots (Bilder) und YouTube-Videos pro Review sehen
- **Damit** ich visuellen Eindruck gewinne
- **AK1:** Bilder-Gallery: `review.images` als horizontale Scroll-Liste (Thumbnail → Lightbox auf Klick)
- **AK2:** YouTube-Videos: `review.youtubeVideos` als eingebettete Player (lazy-load, `iframe` mit `loading="lazy"`)
- **AK3:** Keine Bilder/Videos: Platzhalter "Keine Medien"
- **AK4:** Max 5 Bilder, max 2 Videos pro Review im Vergleich (Performance)

### US5: Bestehende Vergleichs-Elemente bleiben erhalten
- **Als** Nutzer **erwarte ich** dass Score, Pros/Cons, Release-Datum, Kategorie, ScoreCompare weiterhin funktionieren
- **Damit** kein Regression entsteht
- **AK1:** ScoreBlock, ProsCons, Kategorie-Chip, Release-Datum wie bisher
- **AK2:** ScoreCompare unten: jetzt Vergleich aller 2–3 Reviews (nicht nur Review 0 vs Kategorie-Durchschnitt)
- **AK3:** Bei 3 Reviews: ScoreCompare zeigt alle 3 Scores + Durchschnitt der 3

### US6: Barrierefreiheit & SEO
- **AK1:** Semantisches HTML (`<section>`, `<article>`, `<table>`, `<figure>`)
- **AK2:** ARIA-Labels für interaktive Elemente (Gallery, Video-Player)
- **AK3:** Fokus-Reihenfolge logisch (Tab-Navigation durch Reviews)
- **AK4:** Reduced Motion: Animationen deaktiviert bei `prefers-reduced-motion`
- **AK5:** Meta-Tags: `title`, `description` dynamisch basierend auf Reviews
- **AK6:** Open Graph / Twitter Card mit erstem Review-Bild

### US7: Share-Funktion
- **Als** Nutzer **möchte ich** den Vergleich teilen (Web Share API + Clipboard Fallback)
- **Damit** ich ihn anderen schicken kann
- **AK1:** Share-Button in Header (neben "Zurück")
- **AK2:** Teilt aktuelle URL (`window.location.href`)
- **AK3:** Toast-Bestätigung "Link kopiert" / "Geteilt"

## 3. Scope & Nicht-Scope

### In Scope
- Erweiterung der bestehenden `/reviews/vergleichen` Seite (Server Component)
- Client Components für interaktive Teile (Gallery, Video-Player, Preisverlauf-Chart, Share-Button)
- URL-Parameter `ids` statt `a`/`b` (Backward Compatibility: `a`/`b` weiter unterstützen)
- Specs/Metadaten-Tabelle, Preisverlauf, Deals, Bilder-Gallery, Video-Player
- ScoreCompare für 2–3 Reviews
- Share-Button
- Unit/Integration-Tests

### Out of Scope
- Neue Datenbank-Modelle / Migrationen
- Neue API-Routes (nutzt bestehende Prisma-Relationen via Server Component)
- Benutzerdefinierte Vergleichs-Listen (später: "Mein Vergleich speichern")
- Export als PDF/Bild
- Echtzeit-Preis-Updates (WebSocket)
- Vergleich über Kategorien hinweg mit Normalisierung (bleibt kategoriespezifisch)

## 4. Randfälle, Fehlerfälle, Leere Zustände, Berechtigungen, Nebenläufigkeit

| Fall | Verhalten |
|------|-----------|
| Kein `ids` Parameter & kein `a`/`b` | 404 (wie bisher) |
| Alle Slugs ungültig | 404 |
| 1 gültiger Slug | Single-View mit "Weitere hinzufügen"-Hinweis |
| 2–3 gültige Slugs | Vergleichsansicht |
| >3 Slugs | Erste 3 nehmen, Toast "Maximal 3 Reviews vergleichbar" |
| Review nicht `published` | Ausblenden (wie `fetchReviewBySlug` nur published?) — **Prüfen:** aktuelle Query filtert nicht nach Status → **Entscheidung:** nur `published` Reviews laden |
| `specs` / `metadata` null | "Keine technischen Daten" anzeigen |
| `priceHistory` leer | "Kein Preisverlauf" |
| `deals` leer / alle expired | "Keine aktuellen Deals" |
| `images` / `youtubeVideos` leer | "Keine Medien" |
| Gleichzeitige Bearbeitung (Review wird gelöscht) | Prisma wirft Fehler → `notFound()` |
| Sehr lange Spec-Keys | Tabellen-Header: `text-wrap: balance`, `max-w-[200px]`, Tooltip auf Hover |

## 5. Auswirkungen auf bestehende Features & Abwärtskompatibilität

- **Bestandteil:** `/reviews/vergleichen` Seite wird erweitert, nicht ersetzt
- **URL-Migration:** `?a=slug1&b=slug2` → weiterhin unterstützt, intern auf `ids` gemappt
- **Bestehende Links** funktionieren weiter
- **Keine Breaking Changes** an API oder Datenmodell
- **Feature-Flag:** `FEATURE_REVIEW_COMPARE_ENHANCED` (Default: `true`) — kann bei Problemen deaktiviert werden

## 6. Datenmodell & Migrationen

**Keine Migration nötig.** Nutzt bestehende Felder:
- `Review.specs` (Json?) — technische Specs
- `Review.metadata` (Json?) — Developer, Publisher, Genres, Plattformen, Modi
- `Review.priceHistory` (Relation) — Preisverlauf
- `Review.deals` (Relation) — aktuelle Deals
- `Review.images` (String[]) — Screenshots
- `Review.youtubeVideos` (String[]) — YouTube IDs/URLs
- `Review.pros` / `Review.cons` — Pros & Cons
- `Review.score` — Score
- `Review.releaseDate` — Release-Datum
- `Review.category` — Kategorie

**Query-Erweiterung in `fetchReviewBySlug`:**
```typescript
select: {
  // ... bestehende Felder
  specs: true,
  metadata: true,
  priceHistory: { orderBy: { recordedAt: 'desc' }, take: 5 },
  deals: { where: { status: 'active' }, take: 3 },
  youtubeVideos: true,
}
```

## 7. API-Änderungen

**Keine neuen API-Routes.** Die Seite ist eine Server Component, die direkt Prisma nutzt.
- Bestehende `fetchReviewBySlug` wird erweitert (siehe oben)
- Falls Client-seitige Interaktion nötig (z.B. Video-Player lazy-load): Client Components

## 8. UI/UX-Ablauf

### Seite `/reviews/vergleichen`
1. **Header:** Titel "Reviews vergleichen", Back-Link, Share-Button
2. **Bei 0 Reviews:** 404
3. **Bei 1 Review:** Card mit Hinweis "Füge weitere hinzu" + Link zu Review-Detail
4. **Bei 2–3 Reviews:** Grid-Vergleich
   - **Pro Review Card:**
     - Hero-Bild (erstes `images` oder Platzhalter) mit Score-Badge
     - Titel (Link zu Review), Kategorie-Chip
     - Release-Datum + Score
     - **Tabs / Akkordeon-Bereiche (Progressive Disclosure):**
       - **Übersicht** (Default): Pros/Cons (wie bisher)
       - **Specs:** SpecTable (Union der Keys aller Reviews)
       - **Preise:** Preisverlauf (Liste/Chart) + Deals
       - **Medien:** Bilder-Gallery + YouTube-Player
   - **Unten (vollbreit):** ScoreCompare für alle 2–3 Reviews
5. **Footer:** Links zu den Reviews

### Responsive Breakpoints
- Mobile (< 640px): 1 Spalte, horizontal scrollbare Tabellen, Gallery swipe
- Tablet (640–1024px): 2 Spalten
- Desktop (> 1024px): 3 Spalten (bei 3 Reviews), 2 Spalten (bei 2 Reviews)

### Loading & Error States
- **Initial Load:** Server Component → sofort SSR, kein Skeleton nötig
- **Client Components (Gallery, Video, Chart):** Skeleton während Hydration
- **Fehler bei Review-Load:** `notFound()` → 404 Page

## 9. Sicherheit

- **Eingabevalidierung:** `ids` Parameter → Array von Strings, max 3, Slug-Format validieren (`^[a-z0-9-]+$`)
- **Keine SQL-Injection:** Prisma ORM
- **Keine XSS:** React Escaping, YouTube-URLs validieren (nur `youtube.com/watch?v=` oder Video-ID)
- **Autorisierung:** Öffentliche Seite, nur `published` Reviews
- **Rate-Limiting:** Nicht nötig (Server Component, gecacht)

## 10. Performance-Erwartung

- **TTFB:** < 200ms (Server Component, `unstable_cache` 60s)
- **Cache:** `unstable_cache` für `fetchReviewBySlug` mit Tag `review:{slug}` + `reviews:compare`
- **Invaliderung:** Bei Review-Update/Delete → `revalidateTag('review:' + slug)`
- **Bundle Size:** Client Components lazy-loaded (`dynamic import`), nur bei 2–3 Reviews geladen
- **Bilder:** `next/image` mit `unoptimized` für externe URLs, `sizes` korrekt setzen
- **Videos:** `loading="lazy"` auf iframe, nur bei Intersection Observer laden

## 11. Teststrategie

### Unit Tests (`tests/lib/review-compare.test.ts`)
- `parseCompareIds(ids: string)`: Parsing, Validierung, Duplikat-Entfernung, Max-3-Logik
- `unionSpecKeys(reviews: ReviewShape[])`: Union der Spec-Keys
- `formatPriceHistory(history: PriceHistory[])`: Formatierung für Anzeige
- `extractYouTubeId(url: string)`: Video-ID Extraktion aus URL/ID

### Integration Tests (`tests/api/reviews/compare.test.ts`)
- GET `/reviews/vergleichen?ids=slug1,slug2` → 200, HTML enthält beide Titel
- GET `/reviews/vergleichen?a=slug1&b=slug2` → 200 (Backward Compat)
- GET `/reviews/vergleichen?ids=slug1,slug2,slug3,slug4` → 200, nur 3 Reviews
- GET `/reviews/vergleichen?ids=invalid` → 404
- GET `/reviews/vergleichen?ids=draft-slug` → 404 (nur published)
- Specs/Metadata/Preise/Medien im HTML vorhanden

### E2E Tests (später, wenn e2e läuft)
- Vergleich von 3 Reviews lädt vollständig
- Tabs/Akkordeon funktionieren
- Share-Button kopiert URL
- Responsive Layout bricht nicht

## 12. Rollout-Plan

1. **F4:** Implementierung in Paketen (Data Fetching → UI Components → Integration)
2. **F5:** Tests schreiben & grün
3. **F6:** Self-Review
4. **F7:** `npm run verify` grün
5. **F8:** CHANGELOG, README, `.env.example` (Feature-Flag), ROADMAP aktualisieren
6. **F9:** Done

**Feature-Flag:** `FEATURE_REVIEW_COMPARE_ENHANCED=true` in `.env.example`

## 13. Review-Checkliste (F6)

- [x] Alle 7 User Stories implementiert & getestet
- [x] Backward Compatibility: `a`/`b` Parameter funktionieren
- [x] Specs/Metadata Union-Tabelle korrekt
- [x] Preisverlauf & Deals angezeigt
- [x] Bilder-Gallery & Video-Player funktional
- [x] ScoreCompare für 2–3 Reviews
- [x] Share-Button funktioniert
- [x] Barrierefreiheit: Tastatur, Screenreader, Reduced Motion
- [x] SEO: Meta-Tags, OG Tags dynamisch
- [x] Performance: Cache, Lazy-Load, Bundle
- [x] Keine Secrets, keine `any`, Lint/Typecheck grün
- [x] Migration nicht nötig (Bestandteil bestätigt)

---

**Status:** F1–F9 ✅ (Alle Phasen abgeschlossen)