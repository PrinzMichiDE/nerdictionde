# Feature-Specifikation: Review-Template-System

## 1. Problem und Nutzen

**Problem:** Autoren schreiben Reviews in freier Form ohne vorgegebene Struktur. Das führt zu:
- Inkonsistente Review-Qualität und -Vollständigkeit
- Fehlende wichtige Abschnitte (Pros/Cons, technische Details, Fazit)
- Schwierige Vergleichbarkeit zwischen Reviews
- Suboptimale SEO durch fehlende strukturierte Daten
- Höherer Aufwand für Autoren beim Schreiben

**Nutzen:**
- Konsistente, qualitativ hochwertige Reviews durch vorgegebene Struktur
- Schnellere Erstellung für Autoren (Leitfragen, Platzhalter)
- Bessere Vergleichbarkeit durch standardisierte Abschnitte
- Verbesserte SEO durch strukturierte Daten (Schema.org Review, ItemReviewed)
- Höhere Vollständigkeit (Pflichtfelder verhindern Lücken)
- Einfache Wartung und Erweiterung von Templates

**Zielgruppe:** Review-Autoren (Redaktion, eingeladene Experten), indirekt Leser (bessere Reviews)

---

## 2. User Stories und Akzeptanzkriterien

### US1: Template-Auswahl beim Review-Erstellen
**Als** Autor **möchte ich** beim Erstellen eines Reviews ein Template auswählen **damit** ich eine passende Struktur für meinen Review-Typ habe.

**Akzeptanzkriterien:**
- [ ] Bei „Neuer Review“ wird Template-Auswahl angezeigt (Dropdown/Radio)
- [ ] Mindestens 3 Templates verfügbar: „Standard-Game“, „Hardware“, „Movie/Series“
- [ ] Template-Voransicht vor Auswahl möglich
- [ ] Auswahl speichert Template-ID im Review-Draft
- [ ] Standard-Template vorbelegt (konfigurierbar)

### US2: Strukturierter Editor mit Template-Feldern
**Als** Autor **möchte ich** im Editor die Template-Felder als separate Abschnitte sehen **damit** ich keine wichtigen Inhalte vergesse.

**Akzeptanzkriterien:**
- [ ] Template definierte Abschnitte als eigene Editor-Bereiche (Tabs/Accordion)
- [ ] Jedes Feld: Label, Platzhalter, Hilfetext, Pflicht/Optional
- [ ] Pflichtfelder visuell markiert (Sternchen, Border)
- [ ] Validierung: Submit blockiert bei leeren Pflichtfeldern
- [ ] Freitext-Felder unterstützen Markdown (wie bisher)
- [ ] Vorhandener Content bei Template-Wechsel migriert (Best-Effort)

### US3: Template-Definition als JSON (Admin)
**Als** Admin **möchte ich** Templates als JSON-Dateien verwalten **damit** ich ohne Code-Änderungen Templates anpassen kann.

**Akzeptanzkriterien:**
- [ ] Templates liegen in `src/templates/reviews/` als `.json`
- [ ] Schema: `id`, `name`, `description`, `category`, `fields[]`, `default`
-   Feld-Schema: `id`, `type` (textarea|text|select|number|rating), `label`, `placeholder`, `helpText`, `required`, `options[]` (für select), `markdown` (boolean)
- [ ] Hot-Reload im Dev-Mode (Änderungen sofort sichtbar)
- [ ] Validierung beim Start (Schema-Check, keine Duplikate)

### US4: Template-Rendering im Frontend (Leser-Seite)
**Als** Leser **möchte ich** Reviews in konsistenter Struktur sehen **damit** ich schnell relevante Infos finde.

**Akzeptanzkriterien:**
- [ ] Review-Detailseite rendert Template-Felder in definierter Reihenfolge
- [ ] Leere optionale Felder werden ausgeblendet (kein leerer Abschnitt)
- [ ] Template-spezifische CSS-Klassen für Styling
- [ ] Schema.org Microdata für alle Template-Felder (Review, ItemReviewed, Pros/Cons)
- [ ] Backward-Kompatibilität: Reviews ohne Template rendern wie bisher

### US5: Template-Migration für bestehende Reviews
**Als** System **muss ich** bestehende Reviews ohne Template fehlerfrei anzeigen **damit** keine Daten verloren gehen.

**Akzeptanzkriterien:**
- [ ] Reviews ohne `templateId` nutzen Fallback-Rendering (gesamter Content als „Body“)
- [ ] Keine Breaking Changes an bestehenden API/DB
-   Migration-Script optional: Template-ID nachträglich zuordnen

---

## 3. Scope und Nicht-Scope

**In Scope:**
- Template-Definition (JSON), Auswahl-UI, Editor-Integration, Frontend-Rendering, Schema.org
- 3 Standard-Templates (Game, Hardware, Movie/Series)
- Admin-UI für Template-Verwaltung (später, nicht MVP)
- Validierung (Pflichtfelder, Typen)

**Nicht-Scope (später):**
- Eigene Templates für User (Community-Templates)
- Template-Versionierung / A/B-Tests
- WYSIWYG-Editor (bleibt Markdown)
- Template-Marktplatz / Sharing
- KI-unterstütztes Ausfüllen

---

## 4. Randfälle, Fehlerfälle, Leere Zustände

| Situation | Verhalten |
|-----------|-----------|
| Template-JSON ungültig | Startup-Fehler mit Detail, Fallback auf Default-Template |
| Template-ID existiert nicht | Fallback auf Default-Template, Warning loggen |
| Pflichtfeld leer | Submit blockiert, Inline-Fehler, Fokus auf erstes leeres Feld |
| Template-Wechsel mit Content | Best-Effort-Mapping (gleiche Feld-ID → übernehmen), Warnung anzeigen |
| Leere optionale Felder | Nicht rendern (kein leerer `<section>`) |
| Sehr lange Feld-Inhalte | Normale Markdown-Begrenzung, keine Template-spezifischen Limits |
| Gleichzeitige Bearbeitung | Optimistic Locking via `version` (wie bei Collections) |

---

## 5. Auswirkungen auf bestehende Features

| Feature | Auswirkung |
|---------|------------|
| Review-CRUD (Admin) | `templateId` Feld hinzufügen, Validierung erweitern |
| Review-Detailseite | Rendering-Logik um Template-Struktur erweitern |
| Search-API | Template-Felder durchsuchbar machen (optional) |
| PDF-Export | Template-Struktur im PDF abbilden |
| Related Reviews | Template als Filter/Boost nutzbar |
| Schema.org / SEO | Erweitert um strukturierte Template-Daten |

**Abwärtskompatibilität:** Vollständig gewahrt. Bestehende Reviews haben `templateId = null` und rendern als Freitext.

---

## 6. Datenmodell und Migrationen

### Prisma Schema Erweiterungen

```prisma
model Review {
  // ... existing fields
  templateId    String?        @map("template_id")
  templateData  Json?          @map("template_data")  // Serialisierte Feld-Werte
  templateVersion Int?         @default(1) @map("template_version")
  
  @@index([templateId])
}
```

**Migration:** `20261025_add_review_templates` (reversibel: Spalten droppen)

### Template-JSON Schema (`src/templates/reviews/template.schema.json`)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "category", "fields"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z-]+$" },
    "name": { "type": "string", "minLength": 2 },
    "description": { "type": "string" },
    "category": { "type": "string", "enum": ["game", "hardware", "movie", "series", "other"] },
    "default": { "type": "boolean", "default": false },
    "fields": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "type", "label", "required"],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z_]+$" },
          "type": { "type": "string", "enum": ["textarea", "text", "select", "number", "rating"] },
          "label": { "type": "string" },
          "placeholder": { "type": "string" },
          "helpText": { "type": "string" },
          "required": { "type": "boolean" },
          "options": { "type": "array", "items": { "type": "string" } },
          "markdown": { "type": "boolean", "default": true },
          "order": { "type": "integer", "minimum": 0 }
        }
      }
    }
  }
}
```

### Beispiel-Template: `standard-game.json`

```json
{
  "id": "standard-game",
  "name": "Standard Game Review",
  "description": "Klassischer Game-Review mit Gameplay, Grafik, Sound, Wertung",
  "category": "game",
  "default": true,
  "fields": [
    { "id": "intro", "type": "textarea", "label": "Einleitung", "placeholder": "Kurzer Überblick, Genre, Erwartung...", "required": true, "markdown": true, "order": 1 },
    { "id": "gameplay", "type": "textarea", "label": "Gameplay & Mechaniken", "placeholder": "Steuerung, Level-Design, Schwierigkeit, Innovation...", "required": true, "markdown": true, "order": 2 },
    { "id": "graphics", "type": "textarea", "label": "Grafik & Technische Leistung", "placeholder": "Artstyle, Performance, Bugs, Raytracing, FPS...", "required": true, "markdown": true, "order": 3 },
    { "id": "sound", "type": "textarea", "label": "Sound & Atmosphäre", "placeholder": "Musik, Soundeffekte, Voice Acting, Immersion...", "required": false, "markdown": true, "order": 4 },
    { "id": "pros", "type": "textarea", "label": "Pros", "placeholder": "- Punkt 1\n- Punkt 2", "required": true, "markdown": false, "order": 5 },
    { "id": "cons", "type": "textarea", "label": "Cons", "placeholder": "- Punkt 1\n- Punkt 2", "required": true, "markdown": false, "order": 6 },
    { "id": "verdict", "type": "textarea", "label": "Fazit & Wertung", "placeholder": "Zusammenfassung, Für wen geeignet, finale Score-Begründung...", "required": true, "markdown": true, "order": 7 }
  ]
}
```

---

## 7. API-Änderungen

### POST `/api/admin/reviews` (Create)
- Body: `templateId` (optional), `templateData` (Record<string, string>)
- Validierung: Pflichtfelder prüfen, Template existiert

### PATCH `/api/admin/reviews/[id]` (Update)
- `templateId` änderbar (mit Migration-Warnung)
- `templateData` wird gemerged

### GET `/api/admin/reviews/[id]` (Detail)
- Response enthält `templateId`, `templateData`, `templateVersion`

### GET `/api/templates/reviews` (Public)
- Liste aller Templates (für Auswahl-UI)
- Response: `{ templates: Template[] }`

---

## 8. UI/UX-Ablauf

### Admin: Review erstellen
1. Klick „Neuer Review“ → Modal/Seite mit Template-Auswahl (Cards mit Preview)
2. Template wählen → Editor öffnet mit Template-Struktur (Tabs/Accordion)
3. Pflichtfelder rot markiert, Speichern deaktiviert bis alle gefüllt
4. Speichern → `templateId` + `templateData` persistiert

### Frontend: Review lesen
- Template-Felder als `<section>` mit `data-template-field="id"`
- Schema.org: `itemProp="reviewBody"` pro Feld, `itemProp="pros" / "cons"` für Listen
- Leere optionale Felder: `display: none` via CSS `:empty` oder bedingt nicht rendern

### Lade-/Fehler-/Erfolgszustände
- Template-Loading: Skeleton für Template-Cards
- Validierungsfehler: Inline unter Feld, Toast bei Submit
- Speichern: Optimistic UI, Toast „Gespeichert“, Redirect zur Detailseite

### Barrierefreiheit
- Template-Auswahl: Radio-Group mit `aria-labelledby`
- Editor-Felder: `<label>` + `aria-describedby` für Hilfe-Text
- Pflichtfelder: `aria-required="true"`, `required` Attribut
- Fokus-Management: Bei Validierungsfehler Fokus auf erstes ungültiges Feld
- Reduced Motion: Accordion-Animationen deaktiviert

---

## 9. Sicherheit und Performance

**Sicherheit:**
- Template-JSON nur vom Server gelesen (kein User-Input)
- `templateData` Validierung gegen Template-Schema (Zod)
- XSS-Schutz: Markdown-Rendering via bestehender Sanitizer
- Admin-only für Template-CRUD (bereits durch Auth geschützt)

**Performance:**
- Templates: `unstable_cache` 5 Min, Tag `templates:reviews`
- Template-Loading: Parallel zu Editor-Load, nicht blockierend
- Frontend-Rendering: Kein zusätzlicher DB-Zugriff (Daten in `templateData`)
- Bundle-Größe: Template-Logik in separatem Chunk (Dynamic Import)

---

## 10. Teststrategie

### Unit-Tests (`tests/lib/review-templates.test.ts`)
- Template-Loading & Schema-Validierung
- Feld-Validierung (Pflicht, Typ, Optionen)
- Template-Matching (Feld-ID → Content)
- Migration: Content-Mapping bei Template-Wechsel

### Integration-Tests (`tests/api/admin/reviews/templates.test.ts`)
- CRUD mit `templateId` / `templateData`
- Validierung: fehlende Pflichtfelder → 400
- Template nicht gefunden → 400
- Template-Wechsel: Data-Mapping

### E2E-Tests (Playwright)
- Admin: Template auswählen → Felder füllen → Speichern → Detailseite prüfen
- Frontend: Review-Detail mit Template rendern, Schema.org prüfen
- Leere optionale Felder nicht sichtbar
- Template-Wechsel mit Content: Mapping-Check

---

## 11. Rollout-Plan

1. **Feature-Flag:** `FEATURE_REVIEW_TEMPLATES` (Default: `false`)
2. **Phase 1:** Templates + Admin-UI + API (Flag off)
3. **Phase 2:** Frontend-Rendering + Schema.org (Flag on für Staging)
4. **Phase 3:** Production Rollout (Flag on), Monitoring
5. **Phase 4:** Bestehende Reviews optional migrieren (Admin-Tool)

---

## 12. Review-Checkliste (F6)

- [ ] Alle User Stories haben messbare Akzeptanzkriterien
- [ ] Randfälle und Fehlerpfade dokumentiert
- [ ] Migration reversibel (Spalten droppbar)
- [ ] Keine Breaking Changes für bestehende Reviews
- [ ] Schema.org Microdata für SEO
- [ ] Barrierefreiheit: Labels, ARIA, Fokus, Reduced Motion
- [ ] Performance: Caching, Dynamic Import, keine N+1
- [ ] Security: Validierung, XSS-Schutz, Admin-only
- [ ] Teststrategie: Unit, Integration, E2E definiert