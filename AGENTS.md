# AGENTS.md — Nerdiction.de

Regeln für Coding-Agents in diesem Repository. Sie gelten zusätzlich zu den
installierten Skills unter `.agents/skills/` und haben Vorrang vor deren
Standardverhalten, wenn beide dasselbe regeln.

## Projekt

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui
  (`new-york`, CSS-Variablen in `src/app/globals.css`), Prisma + PostgreSQL.
- Inhalte (Reviews, News, Forum) sind deutschsprachig. UI-Texte ebenfalls.
- Befehle: `npm run dev` (Webpack), `npm run lint`, `npm run type-check`,
  `npm run build`. Vor „fertig" mindestens `npm run type-check` laufen lassen.
- Bestehende uncommittete Änderungen nicht überschreiben oder zurücksetzen.

## Installierte Skills

| Skill | Quelle | Einsatz |
| --- | --- | --- |
| `ponytail` | DietrichGebert/ponytail | Immer bei Code: schreiben, fixen, refaktorieren, Dependencies |
| `ponytail-review` | DietrichGebert/ponytail | Review eines Diffs, Commits oder PRs |
| `ponytail-audit` | DietrichGebert/ponytail | Ganzen Repo auf Bugs, Security, Bloat prüfen |
| `ponytail-debt` | DietrichGebert/ponytail | `shortcut:`-Kommentare als Debt-Ledger |
| `humanizer` | blader/humanizer | Jede Prosa, die Nutzer zu sehen bekommen |
| `hallmark` | nutlope/hallmark | Neue Seiten/Designs, `redesign`/`audit` nur auf Zuruf |
| `e2e` | tester-army/e2e | Browser-/E2E-Tests und UI-Verifikation |
| `migrate-to-e2e` | tester-army/e2e | Bestehende Playwright/Cypress-Suite portieren |
| `create-verification-skill` | tester-army/e2e | Projektlokalen `verify-<app>`-Skill erzeugen |
| `scrapling-official` | D4Vinci/Scrapling | Scraping/Crawling mit Python |

Aktualisieren: `npx skills update` (Versionen stehen in `skills-lock.json`).

## Regel 1 — Ponytail ist der Default für Code

- Jede Code-Änderung folgt `ponytail` auf Stufe `full`, ohne dass der Nutzer
  es erwähnen muss. Kein Ankündigen, kein Modus-Banner.
- Vor dem Schreiben: betroffene Stellen lesen (Caller, Tests, Config, Exporte).
- Reihenfolge: braucht es das? → schon im Repo? → Standardbibliothek/
  Plattform? → vorhandene Dependency? → eine Zeile? → minimaler Code.
- Keine neue Dependency für wenige Zeilen. Keine Abstraktion, Option oder
  „für später"-Code, die niemand verlangt hat. Löschen schlägt Hinzufügen.
- Bestehende Struktur, Komponenten und Konventionen des Repos verwenden.
- Nicht wegkürzen: Validierung an Trust-Boundaries, Fehlerbehandlung gegen
  Datenverlust, Security, Accessibility, Tests für nicht-triviale Logik.
- Bewusste Abkürzung mit bekannter Grenze: `shortcut: <Grenze>, <wann upgraden>`.
- Am Ende jeder Antwort ein bis zwei Zeilen: was ausgelassen/was nicht geprüft
  wurde und welches Risiko besteht.
- „stop ponytail" oder „normal mode" hebt die Regel bis auf Weiteres auf.

## Regel 2 — Humanizer für jede Prosa

- Gilt für alles, was veröffentlicht wird: UI-Copy, Fehlermeldungen, News- und
  Review-Texte, `README`, Docs, E-Mails, Commit-Messages mit Fließtext.
- Auch für deutsche Texte: keine „nicht X, sondern Y"-Konstruktionen, keine
  Ein-Satz-Pointe am Absatzende, kein „Im Kern geht es um …", keine
  Dreierketten als Rhythmus, keine Gedankenstriche als Allzweck-Verbinder,
  keine Floskeln („nahtlos", „umielfend", „beleuchten", „spannend").
- Fakten, Zahlen, Namen und Links bleiben unverändert. Nichts erfinden; fehlt
  eine Information, nachfragen statt füllen.
- Code, Frontmatter, Daten und Link-Ziele nicht anfassen, wenn nur Prosa
  überarbeitet wird.
- Prompts für generierte Inhalte (`src/lib/review-generation.ts`,
  `src/lib/news-generation.ts`) bekommen dieselben Anti-Tells als Anweisung,
  wenn du sie änderst.

## Regel 3 — Hallmark für neue Seiten und Designs

- Neue eigenständige Seiten, Landingpages, Marketing-/Sonderseiten: `hallmark`
  nutzen, inklusive Gates und `sloplint`-Check.
- Innerhalb der bestehenden App gilt das vorhandene Designsystem: Tokens aus
  `src/app/globals.css`, shadcn-Komponenten aus `src/components/ui`,
  `Public Sans`/`Libre Bodoni`, Dark Mode über `.dark`. Kein Hallmark-Theme
  über bestehende Seiten legen.
- Bestehendes Design nur ändern, wenn der Nutzer es nennt:
  `/hallmark redesign <pfad>` oder `/hallmark audit <pfad>`.
- Die Hallmark-Floor-Regeln (Kontrast, Fokus, Reduced Motion, kein erfundener
  Inhalt, funktionierendes Mobile-Layout) gelten auch ohne vollen Skill.

## Regel 4 — e2e für UI-Verifikation

- UI-Änderungen nicht „blind" als fertig melden: Dev-Server starten und den
  Flow prüfen, bevor du Erfolg behauptest.
- `e2e` einsetzen, sobald das Projekt eine `e2e.config.ts` hat, wenn der Nutzer
  E2E-/Browser-Tests verlangt, oder wenn ein UI-Bug nur im Browser sichtbar
  wird. Setup dann über die Skill-Referenz `references/setup.md`
  (`npx e2e init`, Web-Engine), nicht frei improvisiert.
- Das Projekt hat aktuell keine e2e-Abhängigkeit. Ohne Auftrag keine
  Testinfrastruktur installieren; stattdessen den vorhandenen Weg nutzen und
  die Lücke nennen.
- Bestehende Playwright-/Cypress-Suiten nur mit `migrate-to-e2e` portieren,
  sliceweise und mit `MIGRATION.md`.

## Regel 5 — Scrapling nur für echte Scraping-Aufgaben

- Dieses Repo ist TypeScript; Scrapling braucht Python 3.10+ und
  `pip install "scrapling[fetchers]"` plus `scrapling install` für Browser.
- Einzelne Seiten lieber mit den vorhandenen HTTP-/Fetch-Tools lesen. Erst bei
  wiederkehrendem Crawling, JS-Rendering oder Bot-Schutz ein Python-Skript
  unter `scripts/` schreiben.
- CLI-Aufrufe immer mit `--ai-targeted` (Prompt-Injection-Schutz).
- `robots.txt`, Nutzungsbedingungen und Rate-Limits respektieren; keine
  Umgehung von Bezahlschranken oder Logins.

## Konflikte

1. Sicherheit, Datenschutz und Gesetze schlagen alles andere.
2. Explizite Nutzeranweisung schlägt Skill-Defaults.
3. Bestehendes Designsystem schlägt Hallmark-Themes.
4. Ponytail kürzt Code, nie Validierung, Security oder Accessibility.
