# ROADMAP.md — Nerdiction.de

Status-Legend: `offen` | `in Arbeit` | `erledigt` | `blockiert`

## Priorisierung (aus AGENTS.md)

Stabilität > Features > Optik. Nach jeweils 2 erledigten Aufgaben vom Typ A/B/C folgt ein neues Feature (D), sofern die Roadmap Features enthält.

## Typ A — Kaputtes reparieren (Build, Tests, Bugs, Security, Regressionen)

- [x] `scripts/verify.sh` anlegen: Build + Type-Check + Lint + Tests (`npm run verify`)
- [x] CI-Workflow (`.github/workflows/ci.yml`) anlegen, der `verify` bei jedem Push läuft
- [x] Pre-Commit-Hook (`.husky/pre-commit`): Format + Lint + Secret-Scan
- [x] `type-check` auf `main` grün
- [x] `build` auf `main` grün
- [x] Kritische Lint-Bugs behoben: React-Hooks-Verstöße (setState in useEffect), `no-empty-object-type`, `react/no-unescaped-entities`, `@next/next/no-html-link-for-pages`, `react-hooks/purity` (Math.random im Render), `react-hooks/immutability` (Mutation im Render)
- [x] `no-explicit-any` Bereinigung: ~150/216 behoben (scripts, admin components, API routes, lib files: igdb, tmdb, tavily, review-generation, job-status, job-resume)
- [x] **Letzte 3 React-Hooks-Errors behoben** (`TableOfContents.tsx`, `YouTubeEmbed.tsx`, `SupportTopBanner.tsx`) — redundante `setState` in `useEffect` durch Lazy Initializer ersetzt
- [x] **Test-Infrastruktur & Type-Check Reparaturen**: OpenAI Client für Browser-Tests freigegeben, 6 Test-Dateien von `no-explicit-any` bereinigt, Mock-Typen korrigiert, alle 636 Tests grün
- [x] **`no-explicit-any` Bereinigung in Quelldateien abgeschlossen**: src/lib/qa.ts, src/lib/recommendations-candidates.ts, src/app/api/user/hardware-profile/route.ts — alle Type-Check Errors behoben, 31 verbleibende Errors nur in externen Skills/Admin (nicht blockierend)

## Typ B — Lücken schließen (Tests, Doku, Fehlerbehandlung)

- [x] `docs/PROGRESS.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md` angelegt
- [x] Unit-Tests für vorhandene Logik (review-category, date-utils, tag-generation, seo, newsletter-API)
- [x] README erweitern um Datenmodell, Environment-Variablen, Migrationshinweise
- [x] Changelog (`CHANGELOG.md`) anlegen und pflegen (SemVer)

## Typ C — Refactoring (wartbarkeitsverbessernd)

- (noch keine Kandidaten)

## Typ D — Neue Features (Review-Plattform für Endnutzer)

- [x] Related Reviews auf Review-Detailseiten (bereits vorhanden)
- [x] Benutzer-Bewertungen (bereits vorhanden)
- [x] Lesezeichen/Bookmarks (bereits vorhanden)
- [x] Newsletter Double-Optin + Bestätigungsseite (`/newsletter/confirm`) ← erledigt
- [x] Deals / Preisverlauf-Widget auf Review-Detailseiten ← erledigt
- [x] Barrierefreiheits-Verbesserungen Review-Detailseite (Fokus, ARIA) ← erledigt
- [x] **Kommentar-Antworten (verschachtelte Kommentare) auf Reviews** ← erledigt
- [x] **Kommentar-Voting (Up/Down auf Kommentare)** ← erledigt
- [x] Review als PDF exportieren (`/api/reviews/[slug]/pdf`, `ReviewPdfDownload`, `ReviewPdfLayout`, `markdown-to-pdf`) ← erledigt
- [x] **Full-Text Search mit Relevanz-Ranking** (`/suche`, Highlights, Filter, Pagination) — Spec: `docs/features/search-relevance.md` ← erledigt
- [x] **Öffentliche Nutzerprofile & Follow-System** (`/u/[username]`, Follow, Feed, Notifications) — Spec: `docs/features/public-user-profiles.md` ← **erledigt**
- [x] **Review Collections / Kuratierte Listen** (`/listen`, `/listen/[slug]`, Erstellung, Drag-and-Drop, Teilen, Profil-Tab) — Spec: `docs/features/review-collections.md` ← **erledigt**

### Neue Kandidaten (auto-generiert 2026-10-24)

- [x] **Review Reactions (Emoji-Reaktionen)** — GitHub-Style Reaktionen (👍 ❤️ 🎉 🤔 😢 😡) auf Reviews; Anzeige der Zähler, eigene Reaktion togglebar; Persistenz pro User (TwitchUser), Aggregation auf Review. Hoher Nutzen (Engagement, schnelles Feedback), niedriger Aufwand (1 Model, 1 API, UI-Komponente), kein Schema-Breaking. **← erledigt (F1–F9 ✅)**
- [x] **Erweiterte Suchfilter** — Release-Datum-Range, Preis-Range, Plattform (PC/PS5/Xbox/Switch), "Nur mit Video", "Nur mit Deal", Developer/Publisher. Mittlerer Nutzen (Präzision), niedriger Aufwand (UI + API-Parameter, bestehende Search-Relevanz nutzen). **← erledigt (F1–F9 ✅)**
- [x] **Leseverlauf / Reading History** — Automatisches Tracking gelesener Reviews (Scroll-Tiefe > 50% + Verweildauer > 30s), `/verlauf` Seite, Basis für Personalisierung. Hoher Nutzen (Rückkehr, Personalisierung), mittlerer Aufwand (Model, Middleware/Client-Tracking, API, UI), Datenschutz beachten (Opt-out). **← erledigt (F1–F11 ✅)**
- [x] **Kategorie-Abos / Category Subscriptions** — User abonniert Kategorien (Games, Hardware, Movies, Series), Benachrichtigung bei neuen Reviews (In-App, E-Mail via Cron). Hoher Nutzen (Retention, Traffic), mittlerer Aufwand (Model, Trigger bei Review-Veröffentlichung, Notification-Prefs, UI in Einstellungen). **← erledigt (F1–F9 ✅)**
- [x] **Review-Vergleich erweitern** — `/reviews/vergleichen` existiert; Side-by-Side: Specs, Pros/Cons, Score, Preisverlauf, Screenshots; URL-teilarbeit (`?ids=slug1,slug2,slug3`). Mittlerer Nutzen (Kaufentscheidung), mittlerer Aufwand (UI, State, Sharing). **← erledigt (F1–F9 ✅)**
- [x] **Community Q&A auf Reviews** — Fragen & Antworten pro Review (StackOverflow-light), Upvote/Downvote, Akzeptierte Antwort, Benachrichtigung Autor. Hoher Nutzen (Community, SEO durch UGC), mittlerer Aufwand (Models, Threading, Moderation, UI). **← erledigt (F1–F12 ✅)**
- [x] **Review Collections Follow** — Nicht nur User folgen, sondern Listen folgen; Feed zeigt neue Items folgter Listen; Benachrichtigung bei Änderungen. Mittlerer Nutzen (Entdeckung), niedriger Aufwand (bestehende Follow/Notification-Infrastruktur wiederverwenden). **← erledigt (F1–F13 ✅)**
- [x] **Personalisierte Empfehlungen** — "Für dich empfohlen" auf Startseite/Reviews basierend auf Ratings, Bookmarks, Follows, Leseverlauf, Kategorien. Sehr hoher Nutzen (Retention, Entdeckung), hoher Aufwand (ML/Heuristik, Caching, A/B-Testbarkeit). **← erledigt (F1–F12 ✅)**
- [x] **Hardware-Kompatibilitäts-Check** — User hinterlegt PC-Specs (CPU, GPU, RAM); Review zeigt "Läuft auf deinem System" Badge + geschätzte FPS. Hoher Nutzen (Kaufentscheidung Hardware), hoher Aufwand (Specs-Parsing, Benchmark-DB, User-Profil-Erweiterung). **← erledigt (F1–F9 ✅)**
- [x] **Review-Serien / Multi-Part Reviews** — Zusammengehörige Reviews (Base Game + DLCs, Staffel-Reviews), Navigation zwischen Teilen, gemeinsamer Score. Mittlerer Nutzen (Struktur), mittlerer Aufwand (Model-Erweiterung, UI). **← erledigt (F1–F9 ✅)**

### Neue Kandidaten (auto-generiert 2026-10-25 — Roadmap leer, neu generiert)

- [x] **Review-Template-System** — Vordefinierte Review-Strukturen (Pro/Contra, Score-Kategorien, Checkliste) für Autoren; Konsistenz, schnellere Erstellung, SEO-Vorteil durch strukturierte Daten. Hoher Nutzen (Qualität, Effizienz), mittlerer Aufwand (Editor-Erweiterung, Templates als JSON, Validierung). **← erledigt (F1–F12 ✅)**
- [ ] **Social Sharing & Viral Loops** — One-Click Share für Reviews/Listen/Serien (Twitter/X, Bluesky, Mastodon, Reddit, Discord, Link-Kopie); OG/Twitter Cards optimieren; Share-Statistiken. Hoher Nutzen (Traffic, Markenbekanntheit), niedriger Aufwand (bestehende Share-Buttons erweitern, Meta-Tags).
- [ ] **Review-Serien für Nutzer (nicht nur Admin)** — Nutzer können eigene Serien erstellen (z.B. "Meine Top 10 RPGs 2024"), öffentlich/privat, kollaborativ. Hoher Nutzen (Community, UGC), mittlerer Aufwand (bestehende Series-Model wiederverwenden, UI für Erstellung).
- [ ] **Erweiterte Benachrichtigungs-Präferenzen** — Granulare Einstellungen pro Kategorie/Typ (Push, E-Mail, In-App, Digest), Frequenz (sofort, täglich, wöchentlich), Stumm-Schaltung pro Objekt. Hoher Nutzen (Retention, Kontrolle), mittlerer Aufwand (Prefs-Model, Digest-Cron, UI).
- [ ] **Review-Embed für externe Sites** — Einbettbarer Widget-Code (`<script>` + `<div>`) für Reviews/Listen/Serien; Responsive, Themeable, No-Cookie. Hoher Nutzen (Distribution, Backlinks), mittlerer Aufwand (neuer Endpunkt, Widget-React-App, CSP).
- [ ] **Dark Mode System-Präferenz Sync** — Automatische Erkennung (`prefers-color-scheme`), Sync mit User-Setting, keine Flash-of-wrong-theme. Mittlerer Nutzen (UX), niedriger Aufwand (Cookie/LocalStorage, Script im `<head>`).
- [ ] **Barrierefreiheits-Audit & Zertifizierung** — Vollständiger axe-core CI, WCAG 2.1 AA Checkliste, Screenreader-Tests, Tastatur-Navigation aller Flows. Hoher Nutzen (Inklusion, Legal), hoher Aufwand (Audit, Fixes, Regression-Tests).
- [ ] **Performance-Budget & Lighthouse CI** — Budgets für JS/CSS/Images/Fonts, PR-Gate bei Regression, Core Web Vitals Monitoring. Hoher Nutzen (UX, SEO, Conversion), mittlerer Aufwand (CI-Integration, Budgets definieren).

## Typ E — Performance, UX, Developer Experience

- [ ] `no-explicit-any` Warnings in Quelldateien inkrementell bereinigen (verbleibende ~39)
- [ ] Bundle-Size-Analyse & Code-Splitting-Optimierung (Dynamic Imports für schwere Komponenten)
- [ ] Image-Optimierung: AVIF-Support, Blur-Placeholders für alle Review-Bilder
- [ ] `unstable_cache` TTL-Tuning & Cache-Invaliderung bei Mutations (Revalidation-Strategie)
- [ ] Accessibility-Audit gesamt (axe-core CI, Fokus-Management, Color-Contrast)
- [ ] Performance-Budget in CI (Lighthouse CI, Core Web Vitals Schwellenwerte)

## Aktuelles Feature

**Review-Template-System** — **F1 ✅, F2 ✅, F3 ✅, F4 (PKG-1 ✅, PKG-2 ✅, PKG-3 ✅, PKG-4 ✅, PKG-5 ✅, PKG-6 ✅, PKG-7 ✅, PKG-8 ✅, PKG-9 ✅, PKG-10 ✅, PKG-11 ✅, PKG-12 ✅)**. Nächster Schritt: Hauptschleife für nächstes Feature.

## Nächster Schritt

Hauptschleife: Nächstes Feature aus Roadmap wählen (z. B. Social Sharing & Viral Loops, Review-Serien für Nutzer, Erweiterte Benachrichtigungs-Präferenzen, etc.).