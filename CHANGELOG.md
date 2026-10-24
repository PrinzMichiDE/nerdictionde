# Changelog

Alle Änderungen an Nerdiction.de werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantische Versionierung](https://semver.org/lang/de/v2.0.0.html).

## [Unreleased]

### Hinzugefügt

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
