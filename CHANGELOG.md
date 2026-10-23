# Changelog

Alle Änderungen an Nerdiction.de werden hier dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantische Versionierung](https://semver.org/lang/de/v2.0.0.html).

## [Unreleased]

### Hinzugefügt

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
