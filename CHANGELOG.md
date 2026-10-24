# Changelog

Alle Änderungen an Nerdiction.de werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantische Versionierung](https://semver.org/lang/de/v2.0.0.html).

## [Unreleased]

### Hinzugefügt

- **Community Q&A auf Reviews**: Fragen & Antworten pro Review (StackOverflow-light Pattern) unter `/reviews/[slug]`; Fragen erstellen/bearbeiten/löschen (Owner), Antworten erstellen/bearbeiten/löschen (Owner); Upvote/Downvote auf Fragen & Antworten (optimistische UI, Selbst-Vote-Schutz); Antwort als "Lösung" akzeptieren (nur Fragesteller); Benachrichtigungen für Review-Autor bei neuer Frage, Fragesteller bei neuer Antwort, Answer-Autor bei Akzeptanz; Feature-Flag `FEATURE_COMMUNITY_QA`; `unstable_cache` 60s + Tag-Invaliderung; Prisma Models `ReviewQA`, `QAAnswer`, `QAVote` + Enum `QAStatus`; reversible Migration; Unit- & Integration-Tests (35 API + 25 Unit Tests)

- **Review-Serien / Multi-Part Reviews**: Kuratierte Review-Serien für Franchises, DLC-Reihen, Staffeln etc. über `/serien` (Übersicht mit Suche, Sortierung, Pagination) und `/serien/[slug]` (Detail mit allen Teilen, Scores, Release-Daten, Share-Button, SEO/OG-Tags); Admin-UI unter `/admin/serien` für CRUD + Drag-and-Drop-Reorder; Review-Detail-Integration: "Teil X von Y" Badge mit Tooltip-Navigation; Review-Card-Erweiterung: Serien-Badge; Such-API-Erweiterung: `series` Feld in Response; Admin-API Routes: `GET/POST/PATCH/DELETE /api/admin/serien`, `POST /api/admin/serien/[slug]/reorder`, `POST/DELETE /api/admin/serien/[slug]/items`; Feature-Flag `FEATURE_REVIEW_SERIES`; `unstable_cache` 60s/30s + Tag-Invaliderung; Prisma Models `ReviewSeries` + `ReviewSeriesItem` + Denormalisierung `Review.seriesId/seriesOrder`; reversible Migration; Unit- & Integration-Tests
- **Review-Vergleich erweitern**: Bis zu drei Reviews parallel vergleichen via `/reviews/vergleichen?ids=slug1,slug2,slug3`; Tabs für Übersicht (Pros/Cons), Specs (technische Daten aus `specs`/`metadata` JSON), Preise (Preisverlauf mit SVG-Diagramm + aktuelle Deals), Medien (Screenshots Gallery mit Lightbox, YouTube-Videos); erweiterte ScoreCompare-Komponente für 2–3 Reviews mit Durchschnitt; Share-Button (Web Share API + Clipboard Fallback); backward-kompatibel zu `?a=slug1&b=slug2`; `unstable_cache` 60s; Feature-Flag `FEATURE_REVIEW_COMPARE_ENHANCED`; Barrierefreiheit (ARIA Tabs, Keyboard-Navigation, Reduced Motion); keine neue Migration nötig (nutzt bestehende Review-Felder)

- **Kategorie-Abos / Category Subscriptions**: Nutzer können Kategorien (Games, Hardware, Movies, Series) abonnieren/abbestellen via `/einstellungen/kategorien` (Toggle-Switches, optimistische UI, Toast-Bestätigungen); abonnierte Kategorien als Chips auf Startseite (`HomeSubscribedCategoryChips`) und öffentlichem Profil (`PublicProfile`) mit Links zu `/suche?category=GAMES`; In-App-Benachrichtigungen bei neu veröffentlichten Reviews in abonnierten Kategorien (Notification Type `category_new_review`, Dedupe via `uniqueKey`, Batch-Insert mit `skipDuplicates`); Feature-Flag `FEATURE_CATEGORY_SUBSCRIPTIONS`; `unstable_cache` 60s für User-Subscriptions & Category-Subscribers + Tag-Invaliderung bei Mutationen; API Routes `GET/POST/DELETE /api/me/categories/subscriptions` + `GET /api/me/categories/subscriptions/[category]`; Kategorie-Mapping Review.category (String: "game"/"hardware"/"amazon"/"movie"/"series") → ReviewCategory Enum (GAMES/HARDWARE/MOVIES/SERIES) mit "amazon" → HARDWARE; 36 Tests (Unit, Integration)

- **Review Collections Follow**: Listen folgen/entfolgen (`/api/listen/[slug]/follow`); Follower-Count auf Listen-Detail (SSR); Gefolgte Listen verwalten in `/einstellungen/listen` (Tab "Gefolgt", Cursor-Pagination, Unfollow); Feed-Integration: neue Items gefolzter Listen in `/feed` (Parameter `includeCollections`); Benachrichtigungen bei neuen Items in gefolgten Listen (In-App, Type `COLLECTION_ITEM_ADDED`); Owner-Modal mit Follower-Liste (Avatar, Name, Profil-Link, Pagination); Items zu Listen hinzufügen/entfernen via `/api/listen/[slug]/items` (Owner only, Max 100, Published-Check, Duplikat-Schutz); Feature-Flag `FEATURE_COLLECTIONS_FOLLOW`; `unstable_cache` 30s/60s + Tag-Invaliderung
- **Leseverlauf / Reading History**: Automatisches Tracking gelesener Reviews (Scroll-Tiefe ≥50% ODER Verweildauer ≥30s); persönliche Verlaufsseite `/verlauf` mit SSR, Pagination, Delete/Leeren-Funktionen; Lesefortschritts-Badge auf Review-Detailseiten (SSR + Client-Hydration); Datenschutz-Toggle in `/einstellungen` (Opt-in, Default aus); Feature-Flag `FEATURE_READING_HISTORY`; Retention 180 Tage; `unstable_cache` 30s + Tag-Invaliderung; Debounced Client-Tracking (10s) mit IntersectionObserver + Visibility API
- **Erweiterte Suchfilter**: Release-Datum-Range (`releaseDateFrom`/`releaseDateTo`), Preis-Range (`minPrice`/`maxPrice` via PriceHistory/Deals/Hardware MSRP), Plattform-Multi-Select (PC, PS5, PS4, Xbox Series, Xbox One, Switch) via Metadata/JSON & Hardware-Type, "Nur mit Video" (`hasVideo`), "Nur mit Deal" (`hasDeal`), Developer/Publisher-Suche (ILIKE auf JSON Metadata); progressive Disclosure UI ("Weitere Filter" einklappbar); Feature-Flag `FEATURE_ADVANCED_SEARCH_FILTERS`; URL-shareable Parameter; kombinierbar mit bestehenden Filtern (Kategorie, Score, Tags, Sortierung)
- **Review Reactions (Emoji-Reaktionen)**: GitHub-Style Reaktionen (👍 ❤️ 🎉 🤔 😢 😡) auf Reviews; Anzeige der Zähler pro Emoji + Gesamtzahl; eigene Reaktion wird hervorgehoben (Toggle via Klick); optimistische UI mit sofortigem Feedback & Rollback bei Fehler; server-seitige Aggregation via Prisma `groupBy`; `unstable_cache` 60s + Tag-Invaliderung; Feature-Flag `FEATURE_REVIEW_REACTIONS`; Einbindung in Review-Detailseite (SSR für initiale Zähler, Client-Hydration für eigene Reaktion) und Review-Cards (Top-Reaktion als Badge)
- **Review Collections / Kuratierte Listen**: Öffentliche Listen-Übersicht `/listen` mit Filter (Suche, Sortierung) und Pagination; Listen-Detailseiten `/listen/[slug]` mit SEO-optimiertem SSR, Review-Karten im Grid, Pagination, Owner-Mode (Reviews hinzufügen/entfernen, Drag-and-Drop-Reorder, Metadaten bearbeiten); Eigene Listen-Verwaltung `/einstellungen/listen`; Profil-Tab "Listen" auf `/u/[username]` für öffentliche Listen anderer Nutzer; Share-Button (Web Share API + Clipboard Fallback + Toast); Open Graph & Twitter Card Tags auf Listen-Detailseiten; Soft-Delete mit `deletedAt`; Max 100 Items pro Liste; Cursor-Pagination; `unstable_cache` (Listen-Übersicht 60s, Detail 30s)
- **Öffentliche Nutzerprofile & Follow-System**: Profilseiten `/u/[username]` mit Bio, Avatar, Stats, öffentlichen Bewertungen/Bookmarks (Tabs, Pagination); Follow/Unfollow-Buttons mit optimistischer UI; Follower/Following-Listen; Aktivitäts-Feed `/feed` mit Bewertungen und Bookmarks gefolgter Nutzer; Benachrichtigungs-System (Header-Glocke mit Badge, Dropdown, `/benachrichtigungen` Seite, Filter ungelesen/alle, Als-gelesen-markieren); Profil-Einstellungen `/einstellungen/profil` (Bio max 500 Zeichen, Sichtbarkeits-Toggles für Profil/Bewertungen/Bookmarks)
- Full-Text Search mit Relevanz-Ranking: Dedizierte Suchseite `/suche`, API `/api/reviews/search` mit Relevanz-Sortierung (Titel > Tags > Inhalt), Highlighting von Suchbegriffen, Filter (Kategorie, Score, Tags), Pagination, URL-shareable Parameter, Empty-State mit Vorschlägen
- Review als PDF exportieren: `/api/reviews/[slug]/pdf` Endpoint, `ReviewPdfDownload` Button, `ReviewPdfLayout` mit Deckblatt, Inhaltsverzeichnis, Metadaten, Markdown-Rendering, Hardwarespecs, `markdown-to-pdf` Konverter
- Kommentar-Voting (Up/Down) auf Review-Kommentaren: `score` auf `Comment`, Voting-Buttons, Score-Anzeige, eigene Stimme
- Kommentar-Antworten (verschachtelte Kommentare) auf Reviews: `parentId` auf `Comment`, "Antworten"-Button, Antwortformular, eingerückte Kinder-Kommentare
- Newsletter Double-Optin mit Bestätigungsseite (`/newsletter/confirm/[token]`) und Abmeldeseite (`/newsletter/unsubscribe/[token]`)
- Deals- und Preisverlauf-Widget auf Review-Detailseiten (`/api/reviews/[id]/deals`, `/api/reviews/[id]/price-history`, `DealsWidget`)
- Unit-Test-Framework Vitest (`npm test`, `vitest.config.ts`)
- Zentrale Qualitätsschranke `scripts/verify.sh` (`npm run verify`) mit Build, Type-Check, Lint und Tests
- CI-Workflow (`.github/workflows/ci.yml`) bei jedem Push auf `main` und `auto/dev`
- Pre-Commit-Hook (`.husky/pre-commit`): Format, Lint, Secret-Scan
- Projektdokumentation unter `docs/` (PROGRESS, ROADMAP, DECISIONS, Feature-Spezifikationen)

### Geändert

- `NewsletterSubscription`: `isActive`-Standard auf `false` (erst nach Double-Optin aktiv), neue Felder `confirmationToken` und `confirmedAt`
- `POST /api/newsletter/subscribe`: legt inaktives Abonnement mit Bestätigungstoken an
- `TwitchUser`: neues Feld `readingHistoryEnabled` (Default `false`) für Opt-in-Status

### Intern

- Prisma-Migration `20261023120000_add_newsletter_double_optin` (rueckaertwaertszugaenglich)
- Prisma-Migration `20261024_add_reading_history` (reading_history Model + readingHistoryEnabled auf TwitchUser)

## [0.1.0] - 2026-10-15

### Hinzugefügt

- Erste öffentliche Version von Nerdiction.de
- Review-Plattform für Games, Filme, Serien, Hardware
- News-System mit RSS-Synchronisation
- Forum mit Kommentaren und Moderation
- Twitch-Streaming-Tools (Overlays, Befehle, Spenden, etc.)
- Newsletter-Anmeldung (Single-Optin)
