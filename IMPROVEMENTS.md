# Verbesserungen für Buen Camino Review

## Übersicht
Dieses Dokument beschreibt die Verbesserungen am Inhaltsverzeichnis und den Überschriften für den Review "Buen Camino - Eine emotionale Reise zwischen Komik und Familiendramen".

## Durchgeführte Verbesserungen

### 1. Verbesserte Überschriften
Die ursprünglichen Überschriften waren zu generisch. Sie wurden durch aussagekräftigere Titel mit beschreibenden Untertiteln ersetzt:

**Vorher:**
- Einleitung
- Handlung und Erzählstruktur
- Charakterentwicklung
- Regie und Inszenierung
- Kameraarbeit und Bildsprache
- Musik und Sounddesign
- Thematische Tiefe
- Fazit

**Nachher:**
- Einleitung: Eine Reise der Selbstfindung
- Handlung: Vom verwöhnten Erben zum verantwortungsvollen Vater
- Charaktere: Authentische Entwicklung ohne Klischees
- Regie: Balance zwischen Komödie und Emotion
- Visuelles: Die Magie des Jakobswegs
- Soundtrack: Emotionale Begleitung einer Reise
- Themen: Zeitlose Werte und persönliches Wachstum
- Fazit: Ein Film für die ganze Familie

### 2. Korrigiertes Inhaltsverzeichnis
Das Inhaltsverzeichnis im Markdown-Content wurde aktualisiert, sodass alle Anchor-Links korrekt mit den generierten IDs der Überschriften übereinstimmen.

### 3. Verbesserte Extraktionslogik
Die `extractHeadings` Funktion wurde aktualisiert, um:
- Den Haupttitel (H1) auszuschließen
- Das "Inhaltsverzeichnis"-Heading selbst auszuschließen

## Technische Details

### Dateien geändert:
1. `src/app/reviews/[slug]/page.tsx` - Verbesserte `extractHeadings` Funktion

### Scripts erstellt:
1. `scripts/improve-buen-camino-content.ts` - Script zum Aktualisieren des Review-Inhalts

## Verwendung

### Option 1: Script ausführen (wenn Datenbank verfügbar)
```bash
npx tsx scripts/improve-buen-camino-content.ts
```

### Option 2: Manuell über Admin-Interface
1. Gehe zu `/admin/reviews/[id]/edit`
2. Finde den Review mit dem Slug `buen-camino-eine-emotionale-reise-zwischen-komik-und-familiendramen`
3. Ersetze den Content mit der verbesserten Version aus `scripts/improve-buen-camino-content.ts`
4. Speichere die Änderungen

## Erwartete Ergebnisse

Nach der Aktualisierung sollte:
- Das Inhaltsverzeichnis nur die relevanten Überschriften anzeigen (ohne H1 und "Inhaltsverzeichnis")
- Alle Links im Inhaltsverzeichnis korrekt zu den entsprechenden Abschnitten führen
- Die Überschriften aussagekräftiger und ansprechender sein
- Die Navigation im Inhaltsverzeichnis besser funktionieren

---

# Verbesserungen der Film- & Serien-Review-Qualität

## Übersicht
Verbesserung der KI-generierten Reviews in den Kategorien "Filme" und "Serien" (TMDB-basiert): mehr Faktenkontext durch Web-Recherche und Credits, kalibrierte Scores statt automatischer 70-80, strukturierte Metadata-Speicherung und ein Skript zur Regeneration bestehender Reviews.

## Durchgeführte Verbesserungen

### 1. Web-Recherche (Tavily) für Filme & Serien
- `src/lib/tavily.ts`: Neue Funktionen `searchMovieProduct(title, year?)` und `searchSeriesProduct(title, year?)`.
  - Domains: rottentomatoes.com, metacritic.com, ign.com, variety.com, hollywoodreporter.com, deadline.com, screenrant.com, indiewire.com, collider.com, theguardian.com, filmstarts.de, moviepilot.de, kino.de, cineasts.de.
  - `search_depth: "advanced"`, `max_results: 8`.
- `buildGameResearchSummary` wurde zu `buildResearchSummary` verallgemeinert (Alias bleibt bestehen).

### 2. TMDB-Erweiterungen
- `src/lib/tmdb.ts`: `TMDBPerson`-Interface; `credits` (cast/crew) und `external_ids` (imdb_id) für `TMDBMovie` und `TMDBSeries`; `TMDBSeries` zusätzlich `created_by`, `last_air_date`, `status`.
- `append_to_response` überall auf `"videos,images,credits,external_ids"` erweitert (tmdb.ts + tmdb-large.ts).

### 3. Bessere Inhaltsgenerierung (`src/lib/review-generation.ts`)
- `computeScoreBand(reference10)`: Übersetzt TMDB-Score (0-10) in ein Zielband (0-100, ±8, geclampt). Der Prompt erlaubt Abweichungen >±5 nur mit Begründung – verhindert das Default-Problem "immer 70-80".
- `generateMovieReviewContent` / `generateSeriesReviewContent`:
  - Best-Effort-Tavily-Recherche vor der Generierung (blockiert nicht bei Fehlern).
  - Zusätzlicher Kontext: Regie, Drehbuch/Autoren, Besetzung, IMDb-ID, Status/letzte Ausstrahlung (Serien).
  - `wordTarget: 1800` (de/en), `imageCount: 4`.
- Fallback-Inhalte für Film/Serie neu aufgebaut (behoben: Parsing-Fehler durch verschachtelte Template-Literale).

### 4. Metadata-Speicherung & Anzeige
- `processMovie`: speichert `metadata` (genres, production_companies/-countries, spoken_languages, release_date, runtime, tmdb_score, vote_count, popularity, director, cast, original_title).
- `processSeries`: analog plus last_air_date, status, number_of_seasons/-episodes, created_by.
- `generateAndAttachTagsForReview` für Filme ergänzt (fehlte vorher; Serien hatten es bereits).
- Backdrops von 2 auf 3 erhöht (Film & Serie).
- `src/components/reviews/MovieSeriesMetadata.tsx`: zeigt jetzt auch Regie/Ersteller, Besetzung (max. 10), Status und letzte Ausstrahlung an.

## Regenerations-Skript

`scripts/regenerate-movie-series-content.ts` (Script: `npm run regenerate-movie-series`)

Regeneriert bestehende Film-/Serien-Reviews **in-place** (Titel de/en, Content, Score, Pros/Cons, SEO-Meta), ohne Slug/Bilder zu verändern.

Optionen:
- `--category=movie|series|all` (Standard: all)
- `--status=published|draft|all` (Standard: published)
- `--limit=N` (Standard: unbegrenzt)
- `--force` (ignoriert Fortschrittsdatei)

Fortschritt wird in `scripts/movie-series-regeneration-progress.json` gespeichert, damit Wiederholungen nur offene Reviews nachholen.

## Dateien geändert
1. `src/lib/tavily.ts`
2. `src/lib/tmdb.ts`, `src/lib/tmdb-large.ts`
3. `src/lib/review-generation.ts`
4. `src/components/reviews/MovieSeriesMetadata.tsx`
5. `scripts/regenerate-movie-series-content.ts` (neu)
6. `package.json`

## Verwendung
```bash
npx tsx scripts/regenerate-movie-series-content.ts --category=movie --status=published --limit=5
```
