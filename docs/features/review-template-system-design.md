# Feature-Design: Review-Template-System

## 1. Architektur-Übersicht

Das Review-Template-System besteht aus drei Hauptkomponenten:
1. **Template-Registry** (Server-seitig): Lädt, validiert, cached Templates aus JSON-Dateien
2. **Admin-UI** (Client): Template-Auswahl, strukturierter Editor mit Validierung
3. **Frontend-Renderer** (Server/Client): Rendert Reviews basierend auf Template-Struktur + Schema.org

### Datenfluss

```
Admin Creates Review
       │
       ▼
┌──────────────────┐
│ Template Selection │  → GET /api/templates/reviews (cached)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Structured Editor  │  → Fields aus Template, Zod-Validierung
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ POST /api/admin/reviews
│ { templateId, templateData, ... }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Prisma: Review    │  → templateId, templateData (Json), templateVersion
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ GET /reviews/[slug]    │  → Review mit templateId, templateData
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Frontend Renderer  │  → Template laden, Felder rendern, Schema.org
└──────────────────┘
```

---

## 2. Betroffene Module und Schnittstellen

| Modul | Änderung |
|-------|----------|
| `src/templates/reviews/` | **Neu**: JSON-Dateien + Schema |
| `src/lib/review-templates.ts` | **Neu**: Template-Registry (Loading, Validation, Cache) |
| `src/lib/review-templates-schema.ts` | **Neu**: Zod-Schemas für Template & TemplateData |
| `src/app/api/templates/reviews/route.ts` | **Neu**: GET Templates für Admin-UI |
| `src/app/api/admin/reviews/route.ts` | **Erweitert**: templateId, templateData Validierung |
| `src/app/api/admin/reviews/[id]/route.ts` | **Erweitert**: templateId, templateData |
| `src/components/admin/ReviewTemplateSelector.tsx` | **Neu**: Template-Auswahl UI |
| `src/components/admin/ReviewTemplateEditor.tsx` | **Neu**: Strukturierter Editor mit Tabs |
| `src/components/reviews/ReviewTemplateRenderer.tsx` | **Neu**: Frontend-Rendering mit Schema.org |
| `src/app/reviews/[slug]/page.tsx` | **Erweitert**: Template-Renderer Integration |
| `src/lib/feature-flags.ts` | **Erweitert**: `FEATURE_REVIEW_TEMPLATES` |
| `prisma/schema.prisma` | **Erweitert**: Review.templateId, templateData, templateVersion |

---

## 3. Bestehende Wiederverwendung

| Existierend | Wiederverwendung |
|-------------|------------------|
| `src/lib/feature-flags.ts` | Flag `FEATURE_REVIEW_TEMPLATES` |
| `src/lib/prisma.ts` | Prisma Client |
| `src/lib/api-response.ts` | `successResponse`, `errorResponse` |
| `src/lib/rate-limit.ts` | Rate-Limiting für Template-API |
| `src/components/ui/*` | shadcn/ui: Tabs, Accordion, Form, Alert, Toast |
| `src/hooks/useToast.ts` | Toast-Benachrichtigungen |
| `src/lib/zod.ts` | Zod-Validierung Patterns |
| `unstable_cache` | Template-Caching (wie bei Collections, Reactions) |

---

## 4. Arbeitspakete (PKG-1 bis PKG-12)

### PKG-1: Template-Infrastruktur & Schema
**Ziel:** JSON-Schema, Templates laden/validieren, Caching
- `src/templates/reviews/template.schema.json` (JSON Schema)
- `src/templates/reviews/standard-game.json`, `hardware.json`, `movie-series.json`
- `src/lib/review-templates-schema.ts` (Zod: Template, TemplateField, TemplateData)
- `src/lib/review-templates.ts` (Registry: `getTemplates()`, `getTemplate(id)`, `validateTemplateData()`)
- `unstable_cache` 5 Min, Tag `templates:reviews`
- Unit-Tests: Schema-Validierung, Loading, Validation

### PKG-2: Prisma Migration & Types
**Ziel:** DB-Schema erweitern
- `prisma/schema.prisma`: Review + `templateId`, `templateData`, `templateVersion`
- Migration `20261025_add_review_templates` (reversibel)
- Type-Exports in `src/types/reviews.ts` erweitern

### PKG-3: Template-API (Public)
**Ziel:** Templates für Admin-UI bereitstellen
- `GET /api/templates/reviews` → `{ templates: Template[] }`
- Feature-Flag Check, Rate-Limit, Cache-Headers
- Integration-Tests

### PKG-4: Admin Review-CRUD Erweitern
**Ziel:** Template-Felder in Create/Update/Read
- `POST/PATCH /api/admin/reviews`: `templateId`, `templateData` Validierung via Zod
- `GET /api/admin/reviews/[id]`: Response um Template-Felder erweitern
- Pflichtfeld-Validierung serverseitig
- Integration-Tests

### PKG-5: Template-Auswahl UI (Admin)
**Ziel:** Visuelle Template-Auswahl beim Erstellen
- `ReviewTemplateSelector.tsx`: Cards mit Preview, Radio-Group, Accessibility
- Preview: Name, Beschreibung, Kategorie, Feld-Anzahl
- Default-Template vorbelegt
- Unit-Tests: Rendering, Selection, Keyboard-Navigation

### PKG-6: Strukturierter Editor (Admin)
**Ziel:** Template-Felder als Tabs/Accordion mit Validierung
- `ReviewTemplateEditor.tsx`: Dynamic Tabs aus Template-Feldern
- Feld-Typen: textarea (Markdown), text, select, number, rating
- Client-seitige Validierung (Zod), Submit-Button disabled bei Fehlern
- Template-Wechsel: Best-Effort Content-Mapping (gleiche field.id)
- Unit-Tests: Rendering, Validation, Template-Switch

### PKG-7: Frontend Template-Renderer
**Ziel:** Review-Detailseite rendert Template-Struktur
- `ReviewTemplateRenderer.tsx`: Server Component
- Felder in definierter Reihenfolge (`order`)
- Leere optionale Felder: nicht rendern
- Schema.org Microdata: `Review`, `ItemReviewed`, `pros`/`cons` als `ItemList`
- Template-spezifische CSS-Klassen: `.review-template-[id]`, `.review-field-[id]`
- Integration in `src/app/reviews/[slug]/page.tsx` (conditional auf `review.templateId`)

### PKG-8: Schema.org & SEO
**Ziel:** Strukturierte Daten für alle Template-Felder
- JSON-LD in `<script type="application/ld+json">`
- `Review` mit `reviewBody` (concatenated), `reviewRating`, `author`, `datePublished`
- `ItemReviewed` (Game/Hardware/Movie) mit `name`, `category`, `image`
- `Pros/Cons` als `ItemList` mit `itemListElement`
- Test: Google Rich Results Test

### PKG-9: Styles & Responsive
**Ziel:** Konsistentes Styling für Template-Felder
- CSS-Variablen in `globals.css`: `--review-field-gap`, `--review-section-radius`
- Mobile: Accordion (ein Feld offen), Desktop: Tabs oder Grid
- Dark Mode Support
- Print-Styles für PDF-Export

### PKG-10: Tests (Unit + Integration + E2E)
**Ziel:** Vollständige Testabdeckung
- Unit: `review-templates.ts` (Loading, Validation, Mapping), `review-templates-schema.ts`
- Integration: Template-API, Admin-CRUD mit Templates, Validation
- E2E: Admin Flow (Select → Edit → Save → View), Frontend Rendering, Schema.org Check

### PKG-11: Dokumentation & Feature-Flag
**Ziel:** Doku, Changelog, Flag
- `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `.env.example` aktualisieren
- `FEATURE_REVIEW_TEMPLATES` in `src/lib/feature-flags.ts` (Default: `false`)
- Admin-Doku: Template-Erstellung, Migration

### PKG-12: Self-Review & Verify
**Ziel:** Qualitätssicherung
- Self-Review Checkliste (F6) abarbeiten
- `npm run verify` (Build, Type-Check, Lint, Tests) grün
- Performance-Check: Template-Loading < 50ms, Rendering < 100ms

---

## 5. Cache-Strategie

| Cache | Key | TTL | Invaliderung |
|-------|-----|-----|--------------|
| Templates List | `templates:reviews:list` | 5 Min | Template-Datei-Änderung (Dev: Hot-Reload, Prod: Deploy) |
| Single Template | `templates:reviews:{id}` | 5 Min | Wie oben |
| Template Schema | `templates:reviews:schema` | 5 Min | Wie oben |

**Implementation:** `unstable_cache` in `review-templates.ts`, Invaliderung via `revalidateTag('templates:reviews')` bei Deploy (Build-Script).

---

## 6. Abhängigkeiten und Reihenfolge

```
PKG-1 (Schema/Registry) 
    │
    ├──→ PKG-2 (Prisma Migration) ──────────────┐
    ├──→ PKG-3 (Template API) ──────────────────┤
    │                                           ▼
    ├──→ PKG-4 (Admin CRUD) ───────────────────┤
    │                                           │
    ├──→ PKG-5 (Template Selector) ────────────┼──→ PKG-6 (Editor)
    │                                           │
    ├──→ PKG-7 (Frontend Renderer) ◀───────────┤
    │                                           │
    ├──→ PKG-8 (Schema.org) ◀──────────────────┤
    │                                           │
    └──→ PKG-9 (Styles) ───────────────────────┘
                                                    │
                                                    ▼
                                            PKG-10 (Tests)
                                                    │
                                                    ▼
                                            PKG-11 (Doku/Flag)
                                                    │
                                                    ▼
                                            PKG-12 (Review/Verify)
```

**Kritischer Pfad:** PKG-1 → PKG-2 → PKG-4 → PKG-6 → PKG-7 → PKG-10 → PKG-12

---

## 7. Risiken und Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Template-JSON Syntax-Fehler bricht Build | Mittel | Hoch | Schema-Validierung beim Start, Fallback-Template |
| Bestehende Reviews brechen beim Rendering | Niedrig | Hoch | `templateId` nullable, Fallback-Renderer |
| Content-Verlust bei Template-Wechsel | Mittel | Mittel | Best-Effort Mapping, Warnung vor Wechsel |
| Performance: Template-Loading blockiert Editor | Niedrig | Mittel | Parallel Loading, Skeleton, Cache-First |
| SEO: Schema.org Fehler | Niedrig | Hoch | Unit-Tests für JSON-LD Output, Rich Results Test |

---

## 8. Feature-Flag Strategie

```typescript
// src/lib/feature-flags.ts
export const featureFlags = {
  // ... existing
  get reviewTemplates() { return process.env.FEATURE_REVIEW_TEMPLATES === 'true'; },
};
```

**Default:** `false` (Environment Variable nicht gesetzt = aus)
**Rollout:** `FEATURE_REVIEW_TEMPLATES=true` in Staging → Production

---

## 9. Schätzung

| Paket | Aufwand (h) |
|-------|-------------|
| PKG-1: Schema/Registry | 3 |
| PKG-2: Prisma Migration | 1 |
| PKG-3: Template API | 1.5 |
| PKG-4: Admin CRUD | 2 |
| PKG-5: Template Selector | 2 |
| PKG-6: Editor | 4 |
| PKG-7: Frontend Renderer | 3 |
| PKG-8: Schema.org | 1.5 |
| PKG-9: Styles | 1 |
| PKG-10: Tests | 3 |
| PKG-11: Doku/Flag | 1 |
| PKG-12: Review/Verify | 1 |
| **Total** | **~25h** |