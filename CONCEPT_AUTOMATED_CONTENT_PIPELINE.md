# Nerdiction.de — Automatisierte Content-Pipeline & UX-Feature-Set

**Status:** Konzept (fertig zur Umsetzung)  
**Zielgruppe:** Hardware-, Software-, Game- und Lifestyle-Reviews  
**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma + PostgreSQL  
**Sprache:** Deutsch (Inhalte + UI)

---

## Teil 1 — UX-Feature-Katalog (5–7 Features)

Jedes Feature ist so konzipiert, dass es den Nutzer in ≤30 Sekunden zur Kaufentscheidung bringt, die Verweildauer durch Interaktivität erhöht und die Conversion durch Transparenz maximiert. Alle Features bauen auf dem vorhandenen `Review`-Typ und der `hardware-db` auf.

### 1. Kauf-Entscheidungs-Assistent („30-Sekunden-Check“)
**Was es tut:** Ein interaktiver Widget über dem Fließtext, der die wichtigsten Pro-Contra-Punkte dynamisch nach Nutzer-Gewichtung sortiert und ein Preis-Leistungs-Meter (0–100) anzeigt. Der Nutzer schiebt Regler für Kategorien (z. B. „Leistung 40 %, Preis 30 %, Verarbeitung 20 %, Laufzeit 10 %”), und das Tool neu-gewichtet die Pros/Cons und den Gesamt-Score in Echtzeit.

**Warum es Conversion/Verweildauer maximiert:**
- Entscheidungszeit sinkt von Minuten auf Sekunden → geringere Absprungrate.
- Der Nutzer fühlt sich im Kontroll, nicht „beraten" → höheres Vertrauen in die Empfehlung.
- Das Preis-Leistungs-Meter ist ein starker Click-out-/Affiliate-Trigger.

**Umsetzung (Repo):** `src/components/reviews/decision-assistant.tsx`, liest `review.pros`, `review.cons`, `review.score`, `metadata.price`, speichert Gewichtung lokal (localStorage/URL-Params).

---

### 2. KI-Vergleichs-Matrix (2–5 Produkte nebeneinander)
**Was es tut:** Eine scrollbare, sticky-header-Tabelle, in der der Nutzer Produkte vergleichen kann. Zeilen = technische Spezifikationen (aus `metadata.specs`), Spalten = Produkte. Zellen werden farbkodiert (grün = gut, gelb = mittel, rot = schlecht) anhand von Benchmark-Indizes aus der `hardware-db`. Eine „Sieger-Spalte" zeigt pro Kategorie das beste Produkt an. Export als PNG/PDF und als shareable Link.

**Warum es Conversion/Verweildauer maximiert:**
- Vergleich ist die häufigste Nutzerhandlung vor dem Kauf → länger auf der Seite.
- Direkter Affiliate-Link pro Spalte → höhere Klickrate.
- Shareable Links bringen externe Traffic-Quellen (Foren, Reddit, Discord).

**Umsetzung (Repo):** `src/components/comparison/comparison-matrix.tsx`, nutzt `HardwareMetadata.specs` und `CPU_DB`/`GPU_DB` aus `src/lib/hardware-db.ts`.

---

### 3. Interaktiver Spezifikations-Filter
**Was es tut:** Der Nutzer filtert Reviews nach harten Kriterien (z. B. „GPU ≥ RTX 4070", „Preis ≤ 1200 €", „TDP ≤ 65 W", „Verfügbar ab Datum"). Die Trefferliste aktualisiert sich ohne Seitenreload. Jeder Filter-Chip zeigt die Trefferanzahl an. „Nur Produkte, die alle Kriterien erfüllen"-Modus vs. „Treffer sortiert nach Trefferquote".

**Warum es Conversion/Verweildauer maximiert:**
- Nutzer findet sein passendes Produkt schneller → niedrigere Bounce-Rate.
- Filter-Interaktionen signalisieren Kaufintention → ideale Platzierung für Affiliate-CTAs.
- Wiederkehrende Nutzer speichern Filter als „Suchalarm".

**Umsetzung (Repo):** Server-Component mit URL-Search-Params, Prisma-Where auf `Review.metadata` (JSON-Feld in PostgreSQL).

---

### 4. „Passt dieses Produkt zu mir?"-Kriterien-Checker
**Was es tut:** 5–8 Multiple-Choice-Fragen zum Anwendungsfall (z. B. „Gaming in 4K?", „Office + Reisen", „Budget?"). Am Ende ein Match-Prozentwert pro getestetes Produkt plus eine Begründung, warum es passt (oder nicht). Ergebnis als „Mein Produkt-Profil" speicherbar.

**Warum es Conversion/Verweildauer maximiert:**
- Personalisierung schafft emotionale Bindung → Wiederbesuche.
- Match-Wert ist ein starker sozialer Beweis („87 % Match für deinen Use Case").
- Profil-Speicherung führt zu Nutzerkonten und Retention.

**Umsetzung (Repo):** `src/components/personalization/product-matcher.tsx`, Speicherung in `useReadingHistory` / `useUserProfiles`.

---

### 5. Adaptive Zusammenfassung (Profi vs. Einsteiger) + automatisches TL;DR
**Was es tut:** Gleiche Review, zwei Lesemodi. „Einsteiger" zeigt verständliche Sprache, Analogien, Glossar-Tooltips und ein 3-Satz-TL;DR oben. „Profi" zeigt Benchmark-Daten, Fachbegriffe ohne Erklärung, technische Tiefe und ein Executive-Summary-Dropdown. Umschaltung per Toggle, gespeichert im Nutzerprofil.

**Warum es Conversion/Verweildauer maximiert:**
- Beide Zielgruppen bleiben länger (keine Überforderung, keine Langeweile).
- TL;DR oben reduziert Absprung bei „scannenden" Nutzern.
- Profil-Modus führt zu wiederkehrenden Besuchen mit konsistenter Erfahrung.

**Umsetzung (Repo):** `src/lib/review-generation.ts` erzeugt beide Varianten; `src/components/reviews/adaptive-summary.tsx` rendert je nach `userPreference`.

---

### 6. Daten-Visualisierung & Transparenz (Benchmarks, Preise, Community)
**Was es tut:**
- **Benchmark-Charts:** Balken-/Radar-Charts für CPU/GPU/FPS mit Vergleichslinie (Durchschnitt der Kategorie, Vorgänger-Modell).
- **Preis-Entwicklung:** Linie der letzten 90 Tage mit Tiefstpreis-Markierung und „Jetzt kaufen?"-Empfehlung (Preis unter 30-Tage-Durchschnitt?).
- **Testergebnisse:** Radar-Chart der Testkategorien (Leistung, Verarbeitung, Features, Preis-Leistung, Langlebigkeit).
- **Community-Meinung:** Aggregierte Sterneverteilung, Sentiment-Balken (positiv/neutral/negativ) aus Nutzer-Reaktionen und Foren-Posts.

**Warum es Conversion/Verweildauer maximiert:**
- Zahlen wirken objektiver als Fließtext → höheres Vertrauen.
- Preis-Historie schafft Dringlichkeit („Jetzt ist der Tiefstpreis").
- Interaktive Charts laden zum Verweilen ein (Hover-Details, Zoom).

**Umsetzung (Repo):** `src/components/charts/` mit shadcn/ui + recharts, Daten aus Prisma + `hardware-db`, Community-Daten aus `review-reactions` und Forum-Tabellen.

---

### 7. Verified-Feedback-Aggregation mit Stimmungsbild
**Was es tut:** Echte Nutzer-Feedback-Quellen (Verkaufs-Bewertungen, Forum-Posts, Social-Media-Erwähnungen) werden automatisch gesammelt, dedupliziert und als Stimmungsbild dargestellt. Jeder Eintrag zeigt Quelle, Datum und einen „Verified"-Hinweis, wenn der Kauf über den Partner-Link belegt ist. Negative Punkte werden thematisch gruppiert („Häufige Kritik: Lüftergeräusch").

**Warum es Conversion/Verweildauer maximiert:**
- Social Proof steigert Conversion stark.
- Transparenz bei Kritik schafft Glaubwürdigkeit (kein reiner Lobby-Artikel).
- Nutzer verbringen Zeit damit, durch die Community-Stimmen zu scrollen.

**Umsetzung (Repo):** `src/lib/forum-generation.ts`, `src/lib/comment-generation.ts`, `src/types/review-reactions.ts`, Prisma-Modelle für `ReviewReaction` und `Comment`.

---

## Teil 2 — Pipeline-Architektur (5 Phasen)

Die Pipeline läuft vollständig autonom. Jede Phase hat klar definierte Inputs, Outputs, Qualitätsschranken und eine Fallback-Logik bei Fehlern.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  PHASE 1    │───▶│  PHASE 2    │───▶│  PHASE 3    │───▶│  PHASE 4    │───▶│  PHASE 5    │
│ Recherche   │    │ Fact-Check  │    │ Multi-Agent │    │ Rich Content│    │ QA & Publish│
│ & Ingestion │    │ & Guardrails│    │ Generation  │    │ & Visuals   │    │ & Publishing│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼                   ▼
   Produkt-ID +      Bereinigte,      Strukturierter     Artikel + JSON-LD   Publiziert +
   Quellen-URLs      validierte Daten   Artikelentwurf    Infografiken, Alt   Status=published
                                                   Texte, Meta
```

### Phase 1 — Recherche & Data Ingestion (Autonome Quellen-Aggregation)

**Trigger:** Neues Produkt erkannt (IGDB/TMDB/Steam-Release, Preis-Portal-Neuheit, Hersteller-Pressemitteilung, Nutzer-Suchanfrage ohne Treffer).

**Datenquellen und Erfassung:**

| Quelle | Daten | Erfassung | Relevanz für Repo |
|--------|-------|-----------|-------------------|
| IGDB / TMDB / Steam API | Spiel-/Software-Metadaten, Plattformen, Genres, Release-Datum | REST-Polling alle 6h bei neuen Releases | `ReviewMetadata`, `igdbId`, `tmdbId`, `steamAppId` |
| Hersteller-Website / Handbuch (PDF) | Technische Spezifikationen, Maße, Gewicht, Anschlüsse | Crawler + PDF-Extraktion (pdf-parse), OCR fallback | `HardwareMetadata.specs` |
| Preis-APIs (Idealo, Amazon PA-API, Geizhals) | Aktueller Preis, Preisverlauf, Verfügbarkeit, Händler | Webhook oder Cron alle 4h | `metadata.price`, Preis-Historie-Tabelle |
| Nutzer-Feedback (Amazon-Reviews, Reddit, Foren, eigene Kommentare) | Sterne, Pros/Cons, Stimmung, häufige Kritik | RSS + scrapling (nur bei Bot-Schutz), Foren-Crawler | `review-reactions`, `Comment`, `forum-generation` |
| Benchmark-Datenbanken (3DMark, Cinebench, eigene `hardware-db`) | FPS, Benchmark-Indizes | Statische DB + API-Import | `CPU_DB`, `GPU_DB`, `hardware-db.ts` |

**Output Phase 1:** Ein `RawProduct`-Datensatz (JSON) mit allen Rohdaten, Quellen-Referenzen und Zeitstempel. Status: `ingested`.

---

### Phase 2 — Fact-Checking & Anti-Halluzination

**Mechanismus:** Dreistufige Validierung (RAG + Guardrails + Primärdatenbank-Abgleich).

1. **Primärdatenbank-Abgleich (Hard stop):** Technische Spezifikationen (CPU, GPU, RAM, Preis, Release-Datum) werden gegen die `hardware-db` und die offiziellen Hersteller-Daten validiert. Abweichung >5 % bei Preisen oder falsche Specs → Artikel wird nicht weiterverarbeitet, sondern an eine manuelle Review-Warteschlange übergeben.

2. **RAG (Retrieval-Augmented Generation):** Alle Agenten arbeiten mit einem kontextuellen Wissens-Corpus (Hersteller-Handbücher, Datenblätter, eigene bisherige Reviews zum Produkt). Antworten müssen zitierbar sein; jede Behauptung im Artikel verweist auf eine Quelle im Corpus.

3. **Guardrails:** Regex- und Schema-Validierung aller numerischen Felder (Preis >0, Score 0–100, Benchmark-Indizes plausibel). Verbotene Phrasen („ich denke", „wahrscheinlich", „vielleicht") werden automatisch erkannt und ersetzt oder blockieren den Output.

4. **Konsistenz-Check:** Ein zweiter LLM liest den generierten Entwurf und vergleicht jede technische Aussage mit den Primärquellen. Abweichungen werden als `FactCheckIssue` geloggt.

**Output Phase 2:** `ValidatedProduct`-Datensatz mit `factCheckScore` (0–100) und `sources[]`. Schwellenwert: `factCheckScore ≥ 95` erforderlich für Weiterverarbeitung.

---

### Phase 3 — Multi-Agenten-Generierung (Der redaktionelle Workflow)

Fünf spezialisierte Agenten arbeiten sequenziell, jeder mit eigenem System-Prompt und eigenem Kontextfenster. Zwischen den Agenten liegt ein `handoff`-Protokoll (JSON), damit kein Kontext verloren geht.

| Agent | Rolle | Input | Output |
|-------|-------|-------|--------|
| **A1 Data Extraction Agent** | Extrahiert und strukturiert Rohdaten aus Phase 1/2 | `ValidatedProduct` | Strukturierte Daten-Karte (Specs, Preis, Benchmarks, Pros/Cons-Rohliste) |
| **A2 Analyst Agent** | Bewertet das Produkt, zieht Vergleiche zu Konkurrenten, definiert Zielgruppen | Daten-Karte | Analysen: Stärken/Schwächen, Zielgruppen-Einordnung, Preis-Leistungs-Einstufung |
| **A3 Redaktions-Agent** | Schreibt den Fließtext (deutsch), Einsteiger- und Profi-Zusammenfassung, TL;DR | Analysen + Daten-Karte | Vollständiger Artikel-Entwurf (Markdown), Pros/Cons, Score |
| **A4 SEO/AIO-Optimierer** | Fügt Meta-Daten, JSON-LD, Keywords, interne Verlinkungen, Struktur hinzu | Artikel-Entwurf | SEO-optimierter Artikel mit `metaDescription`, `metaKeywords`, JSON-LD |
| **A5 Design/Layout-Agent** | Plant Infografiken, Diagramme, Alt-Texte, Bildplatzierungen | Finaler Artikel | Layout-Spec mit Visualisierungs-Anweisungen |

**Kommunikation:** Jeder Agent gibt ein JSON `handoff` aus, das der nächste Agent als System-Kontext erhält. Fehler in einem Agenten lösen einen Retry (max. 3) mit verfeinertem Prompt aus. Bei wiederholtem Fehler: Warteschlange für manuelle Redaktion.

**Output Phase 3:** `ArticleDraft` (Markdown + JSON-LD + Meta-Analyse).

---

### Phase 4 — Generierung von Rich Content & Visuals

**Strukturierte Elemente (automatisiert):**

- **Dynamische Tabellen:** Aus `metadata.specs` generierte Vergleichs- und Spezifikationstabellen (HTML/React-Komponente).
- **Schema.org / JSON-LD:** `Review`, `Product`, `AggregateRating`, `Offer` (Preis, Verfügbarkeit, Händler) — automatisch aus Artikel-Daten generiert.
- **Infografiken & Diagramme:** Preis-Entwicklungs-Linie, Benchmark-Balken, Radar-Chart der Testkategorien. Generiert via `src/lib/image-generation.ts` (SVG/Chart-React) und als PNG gecacht.
- **Alt-Texte:** Jedes Bild/diagramm bezieht einen beschreibenden Alt-Text aus dem Artikel-Kontext (Barrierefreiheit).
- **Meta-Daten:** Title (≤60 Zeichen), Description (≤155 Zeichen), Open-Graph-Tags, Twitter-Cards.

**Output Phase 4:** `RichArticle` — kompletter Publish-Paket: HTML/MDX-Inhalt, JSON-LD, Bild-Assets, Alt-Texte, Meta-Tags.

---

### Phase 5 — Automated QA, SEO & Publishing

**Qualitäts-Schwellenwerte (alle müssen erfüllt sein für vollautomatisches Publishing):**

| Metrik | Schwellenwert | Prüfung |
|--------|---------------|---------|
| Fact-Checking-Score | ≥ 95 / 100 | Phase 2 |
| Lesbarkeit (Deutsche Lesbarkeitsindex / Flesch-Kincaid angepasst) | ≥ 60 / 100 (einfache bis mittlere Sprache) | Automatisiert auf Artikeltext |
| SEO-Abdeckung | ≥ 90 % (Meta-Title, Meta-Desc, H1, H2, JSON-LD, Alt-Texte, Keyword im ersten Absatz) | SEO-Checker |
| Struktur-Vollständigkeit | Pros, Cons, Score, TL;DR, Einsteiger- und Profi-Zusammenfassung vorhanden | Schema-Validierung |
| Plagiat-Check | ≤ 5 % Übereinstimmung mit existierenden Web-Texten | Kopyscape-ähnlicher Check oder lokaler Similarity |
| Bild-Validität | Alle generierten Bilder existieren, Alt-Texte vorhanden, Dateigröße < 500 KB | Asset-Check |

**Entscheidung:**
- **Alle Schwellenwerte erfüllt:** Artikel wird via Prisma/CMS-API mit `status: "published"` live geschaltet, Sitemap aktualisiert, JSON-LD in die Seite eingebaut, Push-Benachrichtigung an Abonnenten (Webpush via `src/lib/webpush.ts`).
- **Ein Schwellenwert nicht erfüllt:** Artikel geht in Status `needs_revision`, ein einzelner Revision-Agent überarbeitet nur die mangelnden Teile (max. 2 Revisionen), danach manuelle Redaktion.

**Output Phase 5:** Publizierter Review unter `/reviews/[slug]`, strukturierte Daten für Rich Snippets, Indexierung bei Google/Bing via Sitemap-Ping.

---

## Teil 3 — System-Prompt / Orchestrierung

### 3.1 Master-Prompt (für die Orchestrierungs-LLM)

Dieser Prompt steuert die gesamte Pipeline. Er wird an das übergeordnete Orchestrierungs-Modell gesendet, das die fünf Agenten sequenziell aufruft und die `handoff`-JSONs verwaltet.

```
Du bist der Chef-Redakteur der automatisierten Content-Pipeline von Nerdiction.de.
Deine Aufgabe ist es, Reviews und Testberichte zu erstellen, die in Qualität,
Präzision und Tiefe von echten Fachredakteuren nicht zu unterscheiden sind.

STAPEL: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Prisma + PostgreSQL.
SPRACHE: Deutsch. UI-Texte und Inhalte sind deutschsprachig.

PIPELINE-PHA­SEN (reihenfolge strikt einhalten):
1. Recherche & Data Ingestion → 2. Fact-Checking & Anti-Halluzination →
3. Multi-Agenten-Generierung → 4. Rich Content & Visuals → 5. QA, SEO & Publishing.

AGENTEN UND IHRE ROLLEN:
A1 Data Extraction Agent: Extrahiert strukturierte Produktdaten (Specs, Preis, Benchmarks,
   Roh-Pros/Cons) aus ValidatedProduct. Output: JSON-Datenkarte.
A2 Analyst Agent: Bewertet Produkt, zieht Vergleiche zu Konkurrenten, definiert
   Zielgruppen und Preis-Leistungs-Einstufung. Output: Analyse-JSON.
A3 Redaktions-Agent: Schreibt deutschen Fließtext, Einsteiger- und Profi-Zusammenfassung,
   automatisches TL;DR, Pros/Cons, Gesamt-Score. Output: Markdown-Artikel.
A4 SEO/AIO-Optimierer: Fügt Meta-Title, Meta-Desc, Keywords, interne Verlinkungen,
   Schema.org/JSON-LD hinzu. Output: SEO-optimierter Artikel.
A5 Design/Layout-Agent: Plant Infografiken, Diagramme, Alt-Texte, Bildplatzierungen.
   Output: Layout-Spec.

REGELN (hart, verhandelbar nicht):
- Jede technische Aussage muss auf eine Quelle im RAG-Corpus verweisbar sein.
- Spezifikationen und Preise müssen gegen hardware-db und Primärquellen validiert sein.
- Keine Spekulationen („ich denke", „wahrscheinlich"). Bei Unsicherheit: Wert als „nicht bestätigt" markieren.
- Pro/Contra müssen aus den Daten abgeleitet sein, nicht erfunden.
- Gesamt-Score 0–100, nachvollziehbar aus Einzelbewertungen.
- JSON-LD muss Schema.org Review + Product + AggregateRating + Offer enthalten.
- Artikel muss Lesbarkeits-Schwelle (≥ 60) und SEO-Schwelle (≥ 90 %) erfüllen.
- Bei jedem Fact-Check-Fehler: max. 3 Retries mit verfeinertem Prompt, dann Warteschlange.

AUSGABEFORMAT:
Jeder Agent gibt ein JSON-Objekt mit Feldern: status ("ok"|"retry"|"blocked"),
handoff (für nächsten Agent), data (eigenes Ergebnis), issues (Array von Problemen).

Beende die Pipeline mit einer Zusammenfassung: Artikel-ID, Status, Fact-Check-Score,
SEO-Score, Lesbarkeit, Entscheidungsgrund (published oder blocked + Gründe).
```

### 3.2 JSON-Workflow-Entwurf (maschinenlesbar)

Dieses JSON kann direkt in ein Orchestrierungssystem (z. B. ein Node.js-Worker mit Prisma-Jobs) eingespeist werden.

```json
{
  "pipeline": "nerdiction-content-engine",
  "version": "1.0.0",
  "language": "de-DE",
  "stack": {
    "frontend": "Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui",
    "database": "Prisma + PostgreSQL",
    "libs": [
      "src/lib/review-generation.ts",
      "src/lib/seo-generation.ts",
      "src/lib/image-generation.ts",
      "src/lib/qa-generation.ts",
      "src/lib/humanizer.ts",
      "src/lib/hardware-db.ts"
    ]
  },
  "trigger": {
    "sources": ["igdb", "tmdb", "steam", "hersteller-pressemitteilung", "nutzer-nachfrage"],
    "pollIntervalMinutes": 360
  },
  "phases": [
    {
      "id": 1,
      "name": "recherche_und_ingestion",
      "sources": [
        { "type": "igdb_tmdb_steam", "data": ["metadata", "releaseDate", "platforms", "genres"] },
        { "type": "hersteller_website_pdf", "data": ["specs", "handbuch"] },
        { "type": "preis_api", "data": ["preis", "preisverlauf", "verfügbarkeit"], "pollIntervalMinutes": 240 },
        { "type": "nutzer_feedback", "data": ["sterne", "pros_cons", "stimmung"], "sources": ["amazon", "reddit", "foren", "eigene_kommentare"] },
        { "type": "benchmark_db", "data": ["fps", "benchmark_index"], "source": "src/lib/hardware-db.ts" }
      ],
      "output": "RawProduct",
      "statusField": "ingested"
    },
    {
      "id": 2,
      "name": "fact_checking_und_guardrails",
      "checks": [
        { "type": "primärdatenbank_abgleich", "source": "src/lib/hardware-db.ts", "tolerance": 0.05 },
        { "type": "rag_validierung", "corpus": ["hersteller_handbücher", "datenblätter", "eigene_reviews"], "zitierpflicht": true },
        { "type": "guardrails", "forbidden_phrases": ["ich denke", "wahrscheinlich", "vielleicht"], "numeric_schema": ["preis>0", "score_0_100"] },
        { "type": "konsistenz_check", "second_llm": true }
      ],
      "threshold": { "factCheckScore": 95 },
      "output": "ValidatedProduct",
      "statusField": "fact_checked"
    },
    {
      "id": 3,
      "name": "multi_agent_generierung",
      "agents": [
        { "id": "A1", "name": "data_extraction", "input": "ValidatedProduct", "output": "datenkarte_json" },
        { "id": "A2", "name": "analyst", "input": "datenkarte_json", "output": "analyse_json" },
        { "id": "A3", "name": "redaktion", "input": "analyse_json + datenkarte_json", "output": "artikel_markdown", "variants": ["einsteiger", "profi"], "tl;dr": true },
        { "id": "A4", "name": "seo_aio_optimierer", "input": "artikel_markdown", "output": "seo_artikel", "fields": ["metaTitle", "metaDescription", "metaKeywords", "jsonLd", "interneVerlinkungen"] },
        { "id": "A5", "name": "design_layout", "input": "seo_artikel", "output": "layout_spec", "visuals": ["infografiken", "diagramme", "alt_texte", "bildplatzierungen"] }
      ],
      "handoff": true,
      "maxRetries": 3,
      "output": "ArticleDraft",
      "statusField": "drafted"
    },
    {
      "id": 4,
      "name": "rich_content_und_visuals",
      "elements": [
        { "type": "dynamische_tabellen", "source": "metadata.specs" },
        { "type": "schema_org_jsonld", "schemas": ["Review", "Product", "AggregateRating", "Offer"] },
        { "type": "infografiken_diagramme", "chartTypes": ["preis_entwicklung", "benchmark_balken", "testkategorien_radar"], "generator": "src/lib/image-generation.ts" },
        { "type": "alt_texte", "rule": "barrierefrei, beschreibend" },
        { "type": "meta_daten", "limits": { "title": 60, "description": 155 } }
      ],
      "output": "RichArticle",
      "statusField": "rich_content_ready"
    },
    {
      "id": 5,
      "name": "automated_qa_seo_publishing",
      "thresholds": {
        "factCheckScore": 95,
        "lesbarkeit": 60,
        "seoAbdeckung": 90,
        "strukturVollständigkeit": ["pros", "cons", "score", "tl;dr", "einsteiger_zusammenfassung", "profi_zusammenfassung"],
        "plagiat": 5,
        "bildDateigrößeKb": 500
      },
      "decisions": {
        "alle_erfüllt": { "action": "publish", "status": "published", "cmsApi": "prisma", "sitemapUpdate": true, "webpush": true },
        "teilweise_erfüllt": { "action": "revision", "maxRevisionen": 2, "revisionAgent": "einzelner_revision_agent", "fallback": "manuelle_redaktion" },
        "nicht_erfüllt": { "action": "block", "status": "needs_revision", "warteschlange": true }
      },
      "output": "published_review",
      "urlPattern": "/reviews/[slug]"
    }
  ],
  "quality_gates": {
    "fact_check": {"min": 95, "hard_stop": true},
    "seo": {"min": 90, "hard_stop": true},
    "readability": {"min": 60, "hard_stop": true},
    "plagiat_max": 5
  },
  "fallback": {
    "agent_error": "retry_max_3_dann_warteschlange",
    "fact_check_error": "manuelle_redaktion",
    "publish_error": "status_needs_revision"
  }
}
```

---

## Umsetzungshinweise für das Repo

1. **Datenmodell ergänzen:** Prisma-Schema um `PriceHistory`, `FactCheckLog`, `ArticleDraft`, `RichContentAsset` erweitern (oder bestehende `Review`-Felder nutzen).
2. **Bestehende Libs wiederverwenden:** `review-generation.ts`, `seo-generation.ts`, `image-generation.ts`, `qa-generation.ts`, `humanizer.ts` sind die natürliche Implementationslage für die Agenten A3–A5.
3. **UX-Komponenten unter `src/components/`:** `decision-assistant.tsx`, `comparison-matrix.tsx`, `product-matcher.tsx`, `adaptive-summary.tsx`, `charts/` (recharts), `community-feedback.tsx`.
4. **Keine neuen Dependencies für wenige Zeilen:** Die vorhandenen Libs und shadcn/ui decken die Anforderungen ab; Charts via `recharts` (falls bereits vorhanden) oder inline-SVG.

Das Konzept ist bereit für die Implementierung. Die Pipeline kann schrittweise aktiviert werden: Phase 1–2 zuerst (Daten + Fact-Check), dann Phase 3–5 (Generierung + Publishing).