# Changelog

Alle Änderungen an Nerdiction.de werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantische Versionierung](https://semver.org/lang/de/v2.0.0.html).

## [Unreleased]

### Hinzugefügt

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

### Intern

- Prisma-Migration `20261023120000_add_newsletter_double_optin` (rueckaertwaertszugaenglich)

## [0.1.0] - 2026-10-15

### Hinzugefügt

- Erste öffentliche Version von Nerdiction.de
- Review-Plattform für Games, Filme, Serien, Hardware
- News-System mit RSS-Synchronisation
- Forum mit Kommentaren und Moderation
- Twitch-Streaming-Tools (Overlays, Befehle, Spenden, etc.)
- Newsletter-Anmeldung (Single-Optin)
