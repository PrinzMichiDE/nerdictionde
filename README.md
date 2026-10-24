This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Docker

The production image is built and published by the `Docker Image` workflow
([`.github/workflows/docker-publish.yml`](.github/workflows/docker-publish.yml)).
It uses the multi-stage [`Dockerfile`](Dockerfile) and stores the image in the
GitHub Container Registry (GHCR), so no extra secrets are needed.

### Docker Compose (App + PostgreSQL)

[`docker-compose.yml`](docker-compose.yml) startet die veröffentlichte App zusammen
mit einer PostgreSQL-Datenbank:

```bash
# 0. Konfiguration anlegen
cp .env.example .env   # Werte eintragen, mindestens JWT_SECRET, ENCRYPTION_KEY, ADMIN_TOKEN

# 1. Datenbank starten
docker compose up -d db

# 2. Schema einspielen (läuft vom Host gegen die Compose-Datenbank)
DATABASE_URL="postgresql://nerdiction:nerdiction@localhost:5432/nerdiction?schema=public" \
  npx prisma migrate deploy

# 3. App starten
docker compose up -d
```

Die App läuft danach auf `http://localhost:3000`. Das Image bringt keinen
Prisma-CLI mit, deshalb der Migrationsschritt vom Host. Zugangsdaten und
Datenbankname lassen sich über `POSTGRES_USER`, `POSTGRES_PASSWORD` und
`POSTGRES_DB` überschreiben; die App bekommt die passende `DATABASE_URL`
automatisch. Alle übrigen Variablen kommen aus `.env`.

### Pull and run

```bash
docker pull ghcr.io/prinzmichide/nerdictionde:latest

docker run -d --name nerdiction \
  -p 3000:3000 \
  --env-file .env \
  ghcr.io/prinzmichide/nerdictionde:latest
```

The container listens on port `3000`, runs as the non-root user `nextjs`, and
exposes a liveness check at `GET /api/health`.

### Published tags

| Trigger | Tags |
| --- | --- |
| Push to `main` | `latest`, `main`, `sha-<commit>` |
| Git tag `v1.2.3` | `1.2.3`, `1.2`, `sha-<commit>` |
| Pull request | image is built but not pushed |
| Manual (`workflow_dispatch`) | same as push, platforms selectable |

### Build-time variables

`NEXT_PUBLIC_*` values are inlined into the client bundle during `next build`,
so they must be present at build time. The workflow reads them from repository
variables (Settings → Secrets and variables → Actions → Variables):

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

All other variables (database, API keys, `JWT_SECRET`, …) are read at runtime
and are passed to the container via `--env-file` or your orchestrator.

### Build locally

```bash
docker build -t nerdictionde:local .
docker run --env-file .env -p 3000:3000 nerdictionde:local
```

## Projektstruktur

Die Anwendung ist eine Next.js 16-App mit App Router, React 19, TypeScript, Tailwind CSS 4 und shadcn/ui. Die Daten werden mit Prisma und PostgreSQL verwaltet.

### Wichtigste Verzeichnisse

| Verzeichnis | Inhalt |
|-------------|--------|
| `src/app` | App-Router-Seiten und API-Routen |
| `src/components` | React-Komponenten (shadcn/ui unter `components/ui`) |
| `src/lib` | Prisma-Client, Hilfsfunktionen, API-Schemas |
| `prisma` | Datenmodell (`schema.prisma`) und Migrationen |
| `tests` | Unit-Tests mit Vitest |
| `scripts` | Hilfsskripte (z. B. `verify.sh`) |
| `docs` | Projektdokumentation (PROGRESS, ROADMAP, DECISIONS, Feature-Specs) |

### Datenmodell (Auszug)

Kernmodelle in `prisma/schema.prisma`:

- **Review** – Produkttests (Games, Filme, Serien, Hardware) mit Score, Pros/Cons, Kommentaren, Bewertungen, Lesezeichen
- **Comment** – Kommentare zu Reviews, optional als Antwort auf einen anderen Kommentar (`parentId`)
- **UserRating** – Nutzerbewertungen (0–10) zu Reviews
- **Bookmark** – Gespeicherte Reviews pro Nutzer
- **NewsletterSubscription** – Newsletter-Abonnements mit Double-Optin (`confirmationToken`, `isActive`)
- **Deal** / **PriceHistory** – Angebote und Preisverlauf zu Reviews
- **NewsArticle** – KI-generierte Newsbeiträge aus RSS-Feeds
- **TwitchUser** und zugehörige Modelle – Streaming-Tools für Twitch
- **UserProfile** – Öffentliche Nutzerprofile (Bio, Avatar, Sichtbarkeit, Follower/Following-Counts)
- **Follow** – Follow-Beziehungen zwischen Nutzern
- **Notification** – Benachrichtigungen (Follows, später Kommentare, Reviews, Mentions)
- **ReviewCollection** – Kuratierte Listen von Reviews (Titel, Beschreibung, Sichtbarkeit, Owner, Item-Count, Version für optimistisches Locking, Soft-Delete)
- **CollectionItem** – Einträge in einer Liste (Review-Referenz, Position, Hinzugefügt-Am)
- **ReviewReaction** – Emoji-Reaktionen auf Reviews (THUMBS_UP, HEART, PARTY, THINKING, CRY, ANGRY) mit Zählern pro Emoji, Unique-Constraint pro User+Review
- **ReadingHistory** – Leseverlauf pro Nutzer (Review-Referenz, Progress 0–100%, Scroll-Tiefe, Verweildauer, letztes Lesedatum), Opt-in via `readingHistoryEnabled` auf TwitchUser

## Entwicklung

### Erste Schritte

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen anlegen
cp .env.example .env
# Mindestens DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY, ADMIN_TOKEN eintragen

# 3. Datenbank starten (z. B. mit Docker Compose)
docker compose up -d db

# 4. Prisma-Client generieren und Migrationen anwenden
npx prisma generate
npx prisma migrate dev

# 5. Entwicklungsserver starten
npm run dev
```

Die App läuft dann auf `http://localhost:3000`.

### Verfügbare npm-Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run dev` | Entwicklungsserver (Webpack) |
| `npm run build` | Produktions-Build (Prisma generate + Next.js Build) |
| `npm run start` | Produktionsserver |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript-Typprüfung |
| `npm run verify` | Build + Typprüfung + Lint + Tests |
| `npm test` | Unit-Tests mit Vitest |
| `npm run test:e2e` | E2E-Tests |

### Qualitätsschranken

Vor jedem Commit wird über einen Pre-Commit-Hook Format, Lint und ein Secret-Scan geprüft. Die CI (GitHub Actions) führt bei jedem Push auf `main` und `auto/dev` das `verify`-Skript aus (Build, Typprüfung, Lint, Tests).

### Datenbank-Migrationen

```bash
# Neue Migration erstellen
npx prisma migrate dev --name <name>

# Migrationen auf eine bestehende Datenbank anwenden
npx prisma migrate deploy

# Prisma Studio öffnen (Datenbank im Browser)
npx prisma studio
```

Migrationen sind reversibel. Destruktive Änderungen (z. B. Spalten löschen) werden nur mit entsprechender Dokumentation und Rückführungs-Schritt durchgeführt.

## Umgebungsvariablen

Wichtige Variablen (aus `.env`):

- `DATABASE_URL` – Verbindung zur PostgreSQL-Datenbank
- `JWT_SECRET` – Schlüssel für JWT-Token
- `ENCRYPTION_KEY` – Schlüssel für Verschlüsselung
- `ADMIN_TOKEN` – Token für Admin-Authentifizierung
- `NEXT_PUBLIC_BASE_URL` – Basis-URL der App (Build-Zeit)
- `NEXT_PUBLIC_SITE_URL` – Öffentliche URL der Seite (Build-Zeit)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` – VAPID-Schlüssel für Push-Benachrichtigungen
- `FEATURE_REVIEW_REACTIONS` – Emoji-Reaktionen auf Reviews aktivieren (Default: `true`, auf `false` setzen zum Deaktivieren)
- `FEATURE_REVIEW_COLLECTIONS` – Review Collections aktivieren (Default: `true`, auf `false` setzen zum Deaktivieren)
- `FEATURE_ADVANCED_SEARCH_FILTERS` – Erweiterte Suchfilter (Release-Datum, Preis, Plattform, Video, Deal, Developer/Publisher) aktivieren (Default: `true`, auf `false` setzen zum Deaktivieren)
- `FEATURE_READING_HISTORY` – Leseverlauf aktivieren (Default: `false`, Opt-in via Einstellungen; auf `true` setzen für globale Aktivierung)

Alle weiteren Variablen (API-Keys für IGDB, TMDB, Steam, OpenAI, Tavily usw.) werden zur Laufzeit gelesen.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
