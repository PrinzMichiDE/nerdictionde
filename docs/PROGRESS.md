# PROGRESS.md — laufendes Gedächtnis der autonomen Entwicklung

## Stand (2026-10-23)

- Branch: `main`, uncommitete Änderungen aus vorheriger Session (Redesign-UI, News-Seite, Admin-Komponenten) bleiben unangetastet.
- `docs/` angelegt: PROGRESS.md, ROADMAP.md, DECISIONS.md.
- `type-check`: grün. `build`: grün (nach `prisma generate`; Windows-Dateilock einmalig bereinigt). `lint`: 246 vorbestehende `no-explicit-any`-Errors, nicht blockierend.
- `scripts/verify.sh`, `.github/workflows/ci.yml`, `.husky/pre-commit`, `npm run verify` angelegt.
- Aktuelles Feature: **Newsletter Double-Optin + Bestätigungsseite** (Phase F3 Design/Plan, F2 Spec geschrieben unter `docs/features/newsletter-double-optin.md`).

## Work-Pakete (F3, für Newsletter Double-Optin)

1. `docs(feature): design newsletter-double-optin` — Work-Pakete hier definieren
2. `feat(newsletter-double-optin): prisma migration` — confirmationToken, confirmedAt, isActive-Default
3. `feat(newsletter-double-optin): subscribe api` — Token generieren, isActive=false
4. `feat(newsletter-double-optin): confirm page` — `/newsletter/confirm/[token]`
5. `feat(newsletter-double-optin): unsubscribe page` — `/newsletter/unsubscribe/[token]`
6. `feat(newsletter-double-optin): newsletter signup ui` — Erfolgsmeldung anpassen
7. `test(newsletter-double-optin): unit tests` — API + Bestätigungs-Logik
8. `refactor(newsletter-double-optin): review findings` — Self-Review
9. `chore(newsletter-double-optin): verify` — Build/Lint/Typecheck/Tests
10. `docs(newsletter-double-optin): ...` — README, Changelog, Roadmap
11. `chore(newsletter-double-optin): done` — Abschluss

## Konventionen (aus AGENTS.md)

- Ponytail full bei Code, Humanizer bei Prosa, Hallmark nur bei neuen eigenständigen Seiten.
- Commits: Conventional Commits, auf `auto/dev`, kein Force-Push, kein `--force`.
- Vor jedem Commit: Diff auf Secrets prüfen.

## Nächster Schritt

F3-Work-Pakete in PROGRESS.md verfeinern, dann Paket 1 (Prisma-Migration) implementieren.
