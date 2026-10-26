# Feature Spec: Personalisierte Empfehlungen

## 1. Problem & Nutzen

**Problem:** Nutzer finden auf der Startseite und Review-Detailseiten nur statische Inhalte (neueste Reviews, Top-Bewertungen). Es fehlt persönliche Relevanz – "Was könnte MICH interessieren?"

**Nutzen:**
- **Retention:** Nutzer kehren häufiger zurück, wenn die Startseite persönlich kuratiert wirkt
- **Entdeckung:** Long-Tail-Reviews werden sichtbar, die in chronologischen Listen untergehen
- **Cross-Selling:** Hardware-Nutzer sehen passende Game-Reviews, Series-Fans sehen Movie-Reviews
- **SEO/Engagement:** Höhere Verweildauer, mehr Pageviews pro Session

**Zielgruppe:** Eingeloggte Nutzer (Twitch-Auth). Nicht eingeloggte sehen Fallback (Trending/Neueste).

---

## 2. User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien |
|----|------------|-------------------|
| US1 | Als eingeloggter Nutzer sehe ich auf der Startseite einen Bereich "Für dich empfohlen" mit 5–10 Reviews, die auf meinem Verhalten basieren | - Bereich nur für eingeloggte Nutzer sichtbar<br>- Mindestens 5 Empfehlungen, max 10<br>- Erklärung ("Basierend auf deinen Bewertungen, Leseverlauf, Follows…") per Tooltip/Info-Icon<br>- Keine Duplikate zu anderen Bereichen der Startseite |
| US2 | Als eingeloggter Nutzer sehe ich auf Review-Detailseiten "Ähnliche Reviews" / "Auch interessant" | - 3–5 Empfehlungen unter dem Review<br>- Content-Based (gleiche Kategorie, ähnliche Tags, gleicher Developer/Publisher)<br>- Exkludiert das aktuell gelesene Review |
| US3 | Als Nutzer kann ich Empfehlungen als "Nicht interessant" markieren (Dismiss) | - Button/Ikon pro Karte<br>- Sofortiges Ausblenden (optimistische UI)<br>- Persistenz: nicht erneut anzeigen (30 Tage TTL)<br>- Feedback an Ranking-Modell (implizites negatives Signal) |
| US4 | Als Nutzer sehe ich einen Grund, WARUM ein Review empfohlen wird | - Badge/Label pro Karte: "Weil du *Game X* bewertet hast", "Ähnlich zu *Review Y*", "Beliebt in deiner Kategorie *Games*"<br>- Max 1 Grund pro Karte, prägnant |
| US5 | Als Nutzer ohne Historie (New User) sehe ich sinnvolle Fallbacks | - Cold-Start: Trending (Views + Ratings letzte 7 Tage), Top-Rated, Kategorie-Mix aus Subscriptions |
| US6 | Als Nutzer kann ich Empfehlungen in den Einstellungen deaktivieren | - Toggle in `/einstellungen` → "Personalisierte Empfehlungen"<br>- Deaktiviert US1 & US2, Fallback auf statische Bereiche |

---

## 3. Scope & Nicht-Scope

**In Scope:**
- Empfehlungs-Engine (Server-seitig, TypeScript, heuristisch/ML-ready)
- API: `GET /api/recommendations` (Homepage), `GET /api/reviews/[slug]/recommendations` (Detail)
- UI: `RecommendationsSection` (Home), `ReviewRecommendations` (Detail)
- Dismiss-Feature mit Persistenz (Prisma Model `RecommendationDismiss`)
- Feature-Flag `FEATURE_PERSONALIZED_RECOMMENDATIONS` (Default: `true`)
- Cold-Start-Strategie für neue Nutzer
- Caching via `unstable_cache` (TTL 5–15 Min, Tag-Invaliderung bei Mutationen)

**Out of Scope (Explizit):**
- Echtzeit-ML-Training / Model-Serving (spätere Iteration)
- A/B-Test-Framework (kann später ergänzt werden)
- E-Mail/Push-Empfehlungen (separates Feature)
- Cross-Device-Sync über Twitch-Account hinaus (bereits gegeben via Twitch-Login)
- Erklärbares AI / SHAP-Values (Nice-to-have, später)

---

## 4. Randfälle, Fehlerfälle, Leere Zustände, Berechtigungen, Nebenläufigkeit

| Fall | Behandlung |
|------|------------|
| Nutzer hat < 3 Interaktionen (Ratings, Bookmarks, History, Follows) | Cold-Start: Trending + Kategorie-Mix aus Subscriptions + Top-Rated |
| Keine Empfehlungen gefunden (alle gedismissed / keine Daten) | Fallback auf Trending, Empty State nicht nötig (immer mindestens Fallback) |
| Dismiss-Race-Condition (doppelter Klick) | Idempotenz via Unique Constraint `(userId, reviewId)` + `ON CONFLICT DO NOTHING` |
| Cache-Staleness nach neuem Rating/Bookmark/Follow | Tag-Invaliderung: `recommendations:{userId}`, `review:{slug}` bei Mutationen |
| Nicht eingeloggter Nutzer | Keine personalisierten Bereiche, stattdessen statische "Beliebt"/"Neueste" |
| Review gelöscht/gehidden | Automatisch aus Empfehlungen gefiltert (WHERE published=true, deletedAt=null) |
| Hohe Last (viele Nutzer) | `unstable_cache` pro User (Home) / pro Review (Detail), Batch-Computation via Cron für Heavy-User optional später |

---

## 5. Auswirkungen auf bestehende Features & Abwärtskompatibilität

| Feature | Auswirkung |
|---------|------------|
| Startseite (`/`) | Neuer Section "Für dich empfohlen" zwischen Hero und "Neueste Reviews" |
| Review-Detail (`/reviews/[slug]`) | Neuer Section "Auch interessant" vor Kommentaren/Q&A |
| Einstellungen (`/einstellungen`) | Neuer Toggle "Personalisierte Empfehlungen" |
| Reading History | Wird als Signalquelle genutzt (neue Abhängigkeit) |
| Category Subscriptions | Wird als Signalquelle genutzt |
| Follow-System | Wird als Signalquelle genutzt (Followed Users' Ratings/Bookmarks) |
| Bookmarks/Ratings | Werden als Signalquellen genutzt |
| Search/Filter | Keine Änderung |

**Migration:** Keine Breaking Changes. Bestehende APIs unverändert. Neue API-Routes additiv.

---

## 6. Datenmodell & Migrationen

### Neue Prisma Models

```prisma
model RecommendationDismiss {
  id        String   @id @default(cuid())
  userId    String
  reviewId  String
  reason    String?  // "not_interested", "already_read", "irrelevant"
  createdAt DateTime @default(now())
  expiresAt DateTime // now() + 30 days

  user    TwitchUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  review  Review     @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@unique([userId, reviewId])
  @@index([userId, expiresAt])
  @@index([expiresAt]) // Für Cron-Cleanup
}
```

### Bestehende Models als Signalquellen (Read-Only)

- `TwitchUser`: `ratings`, `bookmarks`, `follows` (following), `readingHistory`, `categorySubscriptions`
- `Review`: `category`, `tags`, `metadata.developer`, `metadata.publisher`, `score`, `views`, `createdAt`, `ratingAvg`, `ratingCount`
- `ReviewRating`: `userId`, `reviewId`, `score`
- `Bookmark`: `userId`, `reviewId`
- `Follow`: `followerId`, `followingId`
- `ReadingHistory`: `userId`, `reviewId`, `progress`, `createdAt`
- `CategorySubscription`: `userId`, `category`

### Migration

- Reversibel: `DROP TABLE RecommendationDismiss`
- Keine Datenmigration nötig (leere Tabelle initial)
- Cron-Job für Cleanup abgelaufener Dismisses (optional, kann auch lazy beim Read passieren)

---

## 7. API-Änderungen

### `GET /api/recommendations` (Homepage)

**Query:**
- `limit` (default: 10, max: 20)
- `cursor` (für Pagination, optional)

**Response:**
```json
{
  "recommendations": [
    {
      "review": { /* ReviewSummary */ },
      "reason": { "type": "rated_similar", "label": "Weil du „Elden Ring“ mit 9/10 bewertet hast" },
      "score": 0.87
    }
  ],
  "nextCursor": "abc123",
  "strategy": "collaborative|content-based|cold-start"
}
```

### `GET /api/reviews/[slug]/recommendations` (Detail)

**Query:**
- `limit` (default: 5, max: 10)

**Response:** Gleiches Format, aber `strategy` immer content-basiert.

### `POST /api/recommendations/dismiss`

**Body:**
```json
{ "reviewId": "abc", "reason": "not_interested" }
```

**Response:** `{ "success": true }` oder 409 bei Duplicate.

---

## 8. UI/UX-Ablauf

### Startseite (`/`)
```
[Hero]
[Für dich empfohlen] ← NEU (nur eingeloggt, Feature-Flag)
  ├─ Grid 2/3/4 Spalten (Mobile/Tablet/Desktop)
  ├─ Karte: Thumbnail, Titel, Score, Kategorie, Grund-Badge, Dismiss-Button
  └─ "Alle anzeigen" → `/empfehlungen` (spätere Iteration)
[Neueste Reviews]
[Top Bewertet]
...
```

### Review-Detail (`/reviews/[slug]`)
```
[Review Content]
[Q&A / Kommentare]
[Auch interessant] ← NEU
  ├─ Horizontal scrollbar (Mobile) / Grid 3 Spalten (Desktop)
  ├─ Karte: Thumbnail, Titel, Score, Grund-Badge
  └─ Kein Dismiss (Detail-Kontext: weniger kritisch)
```

### Leere/Cold-Start-Zustände
- Kein leerer State: Immer Fallback-Daten (Trending/Top-Rated)
- New User: Subtile Info "Empfehlungen verbessern sich mit deiner Nutzung"

### Barrierefreiheit
- `section[aria-labelledby="recommendations-heading"]`
- Dismiss-Button: `aria-label="Nicht interessant: {Titel}"`, Keyboard-bedienbar
- Grund-Badge: `aria-live="polite"` bei Update
- Reduced Motion: Keine Animationen bei Dismiss (nur Fade via CSS `transition` respektiert `prefers-reduced-motion`)
- Fokus-Visible Styles für alle interaktiven Elemente

---

## 9. Sicherheit, Eingabevalidierung, Performance

**Sicherheit:**
- Alle APIs: Auth-Check (Session via `getServerSession`), Owner-Check bei Dismiss
- Rate-Limit: Dismiss 30/min, Recommendations 60/min (bestehende Middleware)
- Keine PII in Logs, keine Secrets im Code

**Validierung:**
- Zod Schemas für alle API-Inputs
- `reviewId`: CUID Format, Existenz-Prüfung (published, not deleted)
- `reason`: Enum `['not_interested', 'already_read', 'irrelevant']`

**Performance:**
- **Caching:** `unstable_cache` mit Tags
  - Home: `recommendations:home:{userId}` (TTL 5 Min, Tags: `user:{userId}:recs`, `review:{reviewId}`)
  - Detail: `recommendations:detail:{reviewId}` (TTL 15 Min, Tags: `review:{reviewId}`)
- **Invaliderung:** Bei Rating/Bookmark/Follow/ReadingHistory/CategorySub → `revalidateTag(`user:{userId}:recs`)`
- **Datenbank-Indizes:** `RecommendationDismiss(userId, expiresAt)`, `ReadingHistory(userId, createdAt)`, `ReviewRating(userId, score)`
- **Query-Optimierung:** Materialisierte Signale (Denormalisierung) für Heavy-User später, initial: direkte Joins mit Limit
- **N+1-Vermeidung:** `include`/`select` gezielt, Batch-Loading für Reason-Labels

**Erwartete Latency:**
- Cache Hit: < 50ms (Home), < 30ms (Detail)
- Cache Miss: < 300ms (Home), < 200ms (Detail)
- P95 < 500ms

---

## 10. Empfehlungs-Algorithmus (Heuristisch, ML-ready)

### Signale (Gewichtung initial, konfigurierbar via Env/Config)

| Signal | Gewicht | Beschreibung |
|--------|---------|--------------|
| **Content-Based** | 40% | Gleiche Kategorie, überlappende Tags, gleicher Developer/Publisher, Genre-Ähnlichkeit |
| **Collaborative (User-User)** | 30% | "Nutzer wie du mochten auch…" via Overlap: Ratings, Bookmarks, Follows |
| **Collaborative (Item-Item)** | 20% | "Nutzer die X mochten, mochten auch Y" via Co-Rating/Co-Bookmark Matrix |
| **Popularity/Trending** | 10% | Fallback & Cold-Start: Views, RatingAvg, RatingCount letzte 7/30 Tage |

### Berechnung (Server-seitig, deterministisch, cacheable)

1. **Candidate Generation** (pro Request, schnell):
   - Content: Reviews mit gleicher Kategorie + mind. 1 Tag-Overlap (Limit 50)
   - Collaborative: Reviews die gefolgte Nutzer hoch bewertet/bookmarked haben (Limit 50)
   - Trending: Top 20 by `views * ratingAvg` letzte 7 Tage
   - Union → Dedupe → Exclude: bereits gelesen (History > 50%), gedismissed, eigenes Review, unveröffentlicht

2. **Scoring** (pro Kandidat):
   - Content-Score: Jaccard(Tags) * 0.5 + Category-Match * 0.3 + Dev/Pub-Match * 0.2
   - User-User: Cosine-Similarity über Rating-Vektoren (shared reviews) * Gewichtung Follow-Stärke
   - Item-Item: Co-Occurrence Count / sqrt(pop(X)*pop(Y))
   - Trending: Normalisierte Popularity
   - **Final Score** = gewichtete Summe

3. **Ranking & Diversität:**
   - Top-K nach Score
   - MMR (Maximal Marginal Relevance) für Diversität: `score - lambda * similarity_to_already_selected`
   - Max 1 Review pro Developer in Top-5 (optional)

4. **Reason Generation:**
   - Wähle stärksten Signal-Beitrag pro Review
   - Templates: "Weil du *{review}* bewertet hast", "Ähnlich zu *{review}*", "Beliebt in *{category}*", "Von *{developer}*", "Trending diese Woche"

### Cold-Start (Neue Nutzer < 3 Signale)
1. Category Subscriptions → Top-Rated pro Kategorie
2. Falls keine Subs: Trending (Views + Rating) gemischt über alle Kategorien
3. Strategy-Label: `cold-start`

### Konfigurierbarkeit (Env/Config)
```env
REC_WEIGHT_CONTENT=0.4
REC_WEIGHT_USER_USER=0.3
REC_WEIGHT_ITEM_ITEM=0.2
REC_WEIGHT_TRENDING=0.1
REC_MMR_LAMBDA=0.3
REC_CANDIDATE_LIMIT=50
REC_HOME_LIMIT=10
REC_DETAIL_LIMIT=5
REC_DISMISS_TTL_DAYS=30
REC_CACHE_TTL_HOME=300
REC_CACHE_TTL_DETAIL=900
```

---

## 11. Teststrategie

### Unit-Tests (`tests/lib/recommendations.test.ts`)
- Signal-Extraktion (Tags, Category, Dev/Pub)
- Content-Based Scoring (Jaccard, Category-Match)
- User-User Similarity (Cosine, Edge-Cases: 0 Overlap, Self)
- Item-Item Co-Occurrence
- MMR Diversität
- Reason-Generierung (Templates, Priorisierung)
- Cold-Start Logik
- Dismiss-Filterung

### Integration-Tests (`tests/app/api/recommendations.test.ts`)
- `GET /api/recommendations` (Auth, Cache, Pagination, Dismiss-Filter)
- `GET /api/reviews/[slug]/recommendations` (Auth, Exclude Current)
- `POST /api/recommendations/dismiss` (Auth, Idempotenz, Persistenz, Cache-Invaliderung)
- Cold-Start Fallback (Neuer User, keine Signale)
- Rate-Limit
- Feature-Flag aus → 404/Empty

### E2E-Tests (Playwright, `tests/e2e/recommendations.e2e.ts`)
- Eingeloggter Nutzer sieht "Für dich empfohlen" auf Startseite
- Dismiss funktioniert (Verschwindet, bleibt nach Reload weg)
- Grund-Badge sichtbar und korrekt
- Review-Detail zeigt "Auch interessant"
- Nicht eingeloggter Nutzer sieht Fallback
- Toggle in Einstellungen deaktiviert Bereiche

---

## 12. Rollout-Plan & Feature-Flag

- **Feature-Flag:** `FEATURE_PERSONALIZED_RECOMMENDATIONS` (Default: `true`)
- **Rollout:** 100% nach Verify (kein Canary nötig, Low-Risk)
- **Rollback:** Flag auf `false` → Bereiche verschwinden sofort, keine DB-Migration zurück nötig
- **Monitoring:** Logs bei Cache-Miss > 500ms, Dismiss-Rate, CTR (später)

---

## 13. Review-Checkliste (F6)

- [ ] Alle 6 User Stories implementiert & getestet
- [ ] Randfälle: Cold-Start, Dismiss-Race, Cache-Invaliderung, Gelöschte Reviews
- [ ] Eingabevalidierung (Zod), Auth/Autorisierung, Rate-Limit
- [ ] Performance: Cache-Hit < 50ms, P95 < 500ms, Indizes gesetzt
- [ ] Migration reversibel, keine Breaking Changes
- [ ] Bestehende Tests grün, 525+ neue Tests grün
- [ ] Code-Stil, keine toten Codeteile, kleine Funktionen
- [ ] UI: Alle Zustände (Loading, Error, Empty/Fallback), a11y (ARIA, Keyboard, Reduced Motion)
- [ ] Doku: CHANGELOG, README, .env.example, ROADMAP, PROGRESS aktualisiert