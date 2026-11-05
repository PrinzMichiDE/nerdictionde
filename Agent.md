# Agent.md — UI/UX-Pflicht-Skills (Nerdiction.de)

Diese Datei definiert die verpflichtenden UI/UX-Skills für alle Coding-Agents
in diesem Repository. Sie ergänzt `AGENTS.md`; bei Konflikten gilt `AGENTS.md`
(insbesondere: deutsches/europäisches Recht, Sicherheit/DSGVO,
Bestehendes Designsystem schlägt Hallmark-Themes, Ponytail kürzt nie
Validierung/Security/Accessibility).

## Recherche (Stand: 2026-05, skills.sh / GitHub)

Ausgewählt wurden Skills mit hoher Verbreitung, klarer Quelle und direktem
Nutzen für den Stack dieses Projekts (Next.js 16 App Router, React 19,
TypeScript, Tailwind CSS 4, shadcn/ui `new-york`, CSS-Variablen in
`src/app/globals.css`, deutsche UI-Texte, Dark Mode).

| Skill | Quelle | Warum Pflicht | Install (falls lokal fehlt) |
| --- | --- | --- | --- |
| `web-design-guidelines` | `vercel-labs/agent-skills` (Vercel, ~828k Installs) | Prüft UI-Code gegen aktuelle Web-Interface-Guidelines (Accessibility, UX, Performance, Best Practices). Liefert fundierte Review-Findings statt Bauchgefühl. | `npx skills add vercel-labs/agent-skills --skill web-design-guidelines` |
| `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill` (~436k Installs) | Durchsuchbare UI/UX-Design-Intelligenz: Styles, Paletten, Typografie, UX-Regeln, Charts, stack-spezifische Umsetzung. Nutzt das bestehende Designsystem als Randbedingung, nicht als Ersatz. | `npx skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max` |
| `frontend-design` | `anthropics/skills` (Anthropic, ~882k Installs) | Gibt neuen/geänderten Oberflächen eine bewusste, nicht-generische visuelle Richtung (Typografie, Komposition, Motion, Zurückhaltung) — ohne das Nerdiction-Designsystem zu brechen. | `npx skills add anthropics/skills --skill frontend-design` |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` (~874k Installs) | 70 Regeln für React/Next.js-Performance und Korrektheit (Waterfalls, Bundle, Server/Client Data Fetching, Re-Renders, Rendering, JS). Direkt relevant für App Router + React 19. | `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices` |
| `vercel-composition-patterns` | `vercel-labs/agent-skills` (~439k Installs) | Skalierbare Komponentenarchitektur (Compound Components, State-Lifting, explizite Varianten, React-19-APIs). Verhindert Boolean-Prop-Wucher in shadcn/React-Komponenten. | `npx skills add vercel-labs/agent-skills --skill vercel-composition-patterns` |

Quellen: [skills.sh/design](https://skills.sh/topic/design), [vercel-labs/agent-skills](https://skills.sh/vercel-labs/agent-skills), [ui-ux-pro-max](https://skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max), [frontend-design](https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md), [Vercel Agent Resources](https://vercel.com/docs/agent-resources/skills).

## Pflichtregel

Bei **jeder** Aufgabe mit UI/UX-Bezug müssen diese Skills verwendet werden:

- **UI bauen/ändern** (Seiten, Komponenten, Layout, States, Navigation, Formulare, Charts, Responsive, Dark Mode): `frontend-design` + `vercel-composition-patterns` + `vercel-react-best-practices`; bei Designentscheidungen zusätzlich `ui-ux-pro-max`.
- **UI prüfen/reviewen/auditieren** (Accessibility, Usability, visuelle Qualität, Performance im Frontend): `web-design-guidelines` + `ui-ux-pro-max`; bei React/Next.js-Code zusätzlich `vercel-react-best-practices`.
- **Neue eigenständige Marketing-/Sonderseiten**: zusätzlich `hallmark` gemäß `AGENTS.md` Regel 3. Innerhalb der App bleibt das bestehende Designsystem führend.

## Projektspezifische Leitplanken

- Designsystem respektieren: Tokens aus `src/app/globals.css`, shadcn/ui aus
  `src/components/ui`, `Public Sans`/`Libre Bodoni`, `.dark`-Modus, bestehende
  Muster. Keine fremden Themes über bestehende App-Flächen legen.
- Accessibility ist Pflicht, kein Nice-to-have (Kontrast, Fokus, Tastatur,
  Labels, semantisches HTML, Reduced Motion). `web-design-guidelines` und
  `ui-ux-pro-max` priorisieren a11y — Befunde nicht ignorieren.
- Deutsche UI-Texte bleiben deutsch und folgen `humanizer`/AGENTS-Regel 2.
- Kein generischer „AI-Slop“: keine erfundenen Inhalte, keine dekorativen
  Muster ohne Informationswert, keine sinnlosen Animationen.
- `ponytail` bleibt Default für Code: kleinste vollständige Lösung, keine
  unnötigen Abstraktionen/Dependencies.
- UI-Änderungen nicht blind melden: prüfen (Dev-Server/`e2e`, sobald vorhanden)
  und am Antwortende nennen, was nicht geprüft wurde.

## Pflege

- Neue/ersetzte UI/UX-Skills nur mit kurzer Begründung (Quelle, Fit für Stack,
  Mehrwert) in diese Datei aufnehmen.
- Install-Status in `.agents/skills/` und `skills-lock.json` prüfen; fehlt ein
  Pflicht-Skill lokal, Installation vorschlagen oder `npx skills add ...`
  ausführen, wenn der Nutzer es will. Keine stillen Fremdinstallationen ohne
  Kontext.
