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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
