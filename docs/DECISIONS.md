# DECISIONS.md — Entscheidungsprotokoll

| Datum | Frage | Optionen | Entscheidung | Begründung |
|-------|-------|----------|--------------|------------|
| 2026-10-23 | Arbeitsbranch für autonome Entwicklung | direkt auf `main`, separater Branch `auto/dev` | `auto/dev` | AGENTS.md Push-Protokoll verlangt `auto/dev`; uncommitete Änderungen auf `main` bleiben unangetastet |
| 2026-10-23 | Fehlende `docs/` (PROGRESS, ROADMAP, DECISIONS) | nicht anlegen, erst Code | jetzt anlegen | Laut Hauptschleife ist PROGRESS.md das erste zu lesende Dokument; ROADMAP.md fehlt komplett |
| 2026-10-23 | PDF-Export für Reviews: Server-seitig vs Client-seitig | `@react-pdf/renderer` (Server), `jsPDF`+`html2canvas` (Client), Puppeteer (Headless) | `@react-pdf/renderer` | React-PDF passt zur Codebase (React/TSX), funktioniert auf Vercel/Serverless ohne Headless-Browser, deterministisches Layout, Streaming-Support via `renderToBuffer` |
| 2026-10-23 | Middleware vs Proxy in Next.js 16 | `src/middleware.ts`, `src/proxy.ts` | `src/middleware.ts` (Migration) | Next.js 16 deprecated `middleware` zugunsten von `proxy`; Migration nötig für Build-Erfolg. `verifySession` nutzt Node-APIs (Edge Runtime Warnungen), aber Build läuft durch. |
