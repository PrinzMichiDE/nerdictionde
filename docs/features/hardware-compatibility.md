# Feature Spec: Hardware-Kompatibilitäts-Check

## 1. Problem und Nutzen

**Problem:** Nutzer (Gamer, Tech-Enthusiasten) lesen Hardware-Reviews (GPUs, CPUs, Monitore, Peripherie) und müssen selbst abwägen, ob das getestete Produkt auf ihrem eigenen System läuft, ob es ein Flaschenhals ist oder ob sie Upgrade-Potenzial haben. Es gibt keine automatische Prüfung gegen die eigenen PC-Specs.

**Nutzen:**
- **Kaufentscheidung:** "Läuft meine RTX 3070 mit diesem Monitor ohne Flaschenhals?"
- **Upgrade-Planung:** "Welche GPU bringt bei meinem i5-12400 den größten Sprung?"
- **Differenzierung:** Alleinstellungsmerkmal gegenüber reinen Review-Seiten (PCGamesHardware, Notebookcheck, Tom's Hardware haben kein User-Profil-Abgleich)
- **Retention:** Nutzer pflegen ihr Profil, kehren für neue Reviews zurück
- **Cross-Selling:** Empfehlungen basierend auf Hardware-Profil (z. B. "Du hast einen 1440p-Monitor → diese GPUs passen")

**Zielgruppe:** Eingeloggte Nutzer (Twitch OAuth), primär PC-Gamer und Hardware-Enthusiasten.

---

## 2. User Stories & Akzeptanzkriterien

| ID | User Story | Akzeptanzkriterien |
|----|------------|-------------------|
| **US1** | Als eingeloggter Nutzer möchte ich meine PC-Specs (CPU, GPU, RAM, Monitor-Auflösung, Netzteil) in den Einstellungen hinterlegen, damit sie für Kompatibilitäts-Checks genutzt werden. | - Seite `/einstellungen/hardware` mit Formular (CPU, GPU, RAM, Monitor, Netzteil) <br> - Autocomplete/Vorschläge aus bekannter Hardware-DB <br> - Speichern via `PATCH /api/user/hardware-profile` <br> - Validierung: Pflichtfelder CPU + GPU + RAM <br> - Anzeige im Profil-Tab "Hardware" (nur für Owner) |
| **US2** | Als Nutzer sehe ich auf Hardware-Review-Detailseiten (Kategorie `hardware`) einen Kompatibilitäts-Badge ("✅ Läuft", "⚠️ Flaschenhals möglich", "❌ Inkompatibel") basierend auf meinem Profil. | - Badge nur bei Hardware-Reviews (`category === 'hardware'` oder `hardwareType` gesetzt) <br> - Logik: Mindestanforderungen (aus Review `specs.minRequirements` oder `metadata.minSpecs`) vs. User-Profil <br> - 3 Stati: `COMPATIBLE`, `BOTTLENECK_WARNING`, `INCOMPATIBLE` <br> - Tooltip mit Details (welches Komponente limitiert) <br> - Nur sichtbar, wenn User Profil vollständig (CPU+GPU+RAM) |
| **US3** | Als Nutzer sehe ich auf Hardware-Review-Detailseiten eine geschätzte FPS-Range für gängige Auflösungen (1080p, 1440p, 4K) basierend auf meiner GPU + CPU-Kombi. | - Nur bei GPU-Reviews (`hardwareType === 'gpu'`) <br> - Basis: Review-Benchmarks (`specs.benchmarks` oder `metadata.benchmarks`) + User-CPU als Flaschenhals-Faktor <br> - Anzeige: "~85–110 FPS (1080p Ultra)", "~55–75 FPS (1440p Ultra)" <br> - Disclaimer: "Schätzung basierend auf deinem Profil, reale Werte können abweichen" |
| **US4** | Als Nutzer kann ich den Kompatibilitäts-Check in den Einstellungen deaktivieren (Opt-out). | - Toggle in `/einstellungen/hardware` <br> - Default: `true` (Opt-in für Datenschutz) <br> - Wenn aus: Keine Badges, keine FPS, Profil bleibt gespeichert |
| **US5** | Als Nutzer wird mir bei fehlendem/unvollständigem Profil ein CTA angezeigt ("Vervollständige dein Hardware-Profil für Kompatibilitäts-Checks"). | - CTA auf Hardware-Reviews wenn eingeloggt aber Profil unvollständig <br> - Link zu `/einstellungen/hardware` <br> - Nicht anzeigen wenn Feature-Flag aus oder User nicht eingeloggt |

---

## 3. Scope & Nicht-Scope

**In Scope (Phase 1 - MVP):**
- User Hardware-Profil (CPU, GPU, RAM, Monitor, Netzteil) in `TwitchUser` JSON-Feld `hardwareProfile`
- Kompatibilitäts-Badge auf Hardware-Review-Detailseiten (Mindestanforderungen vs. User-Profil)
- FPS-Schätzung für GPU-Reviews (basierend auf Review-Benchmarks + CPU-Flaschenhals-Heuristik)
- Einstellungen-Seite `/einstellungen/hardware` mit Formular + Toggle
- Feature-Flag `FEATURE_HARDWARE_COMPATIBILITY` (Default `false` für Opt-in)
- Unit-Tests für Logik, Integration-Tests für API, E2E für UI

**Nicht in Scope (Phase 1):**
- Benchmark-Datenbank (PassMark, 3DMark, UserBenchmarks) — später Phase 2
- Automatisches Hardware-Erkennen (WebGPU, User-Agent) — später
- Historische Vergleiche ("Deine alte GPU vs. neue") — später
- Netzteil-Wattage-Check (nur Warnung, keine harte Inkompatibilität) — Phase 2
- Monitor-Refresh-Rate vs. GPU-Leistung Matching — Phase 2
- Mobile App / Native — nicht geplant

---

## 4. Randfälle, Fehlerfälle, Berechtigungen

| Fall | Behandlung |
|------|------------|
| User nicht eingeloggt | Keine Badges, keine FPS, kein CTA (nur "Login für personalisierte Checks") |
| Profil unvollständig (nur CPU) | CTA "Vervollständige dein Profil", keine Badges |
| Review hat keine `minRequirements` | Badge "Keine Daten für Check verfügbar", keine FPS |
| Review ist kein Hardware-Review | Keine Badges, keine FPS (nur Kategorie `hardware` oder `hardwareType` gesetzt) |
| CPU/GPU nicht in bekannter DB | Fuzzy-Match auf Modellname, Fallback: Generische Klasse (z. B. "RTX 3070" → "RTX 30 Series") |
| Benchmark-Daten unvollständig | FPS nur für Auflösungen anzeigen, wo Daten existieren |
| API-Fehler beim Speichern | Toast-Fehler, Formular bleibt editierbar |
| Race Condition (gleichzeitiges Speichern) | Optimistisches Locking via `version` Feld auf User (optional, später) |

---

## 5. Auswirkungen auf bestehende Features

| Feature | Auswirkung |
|---------|------------|
| **Reviews** | Neue Anzeige auf Hardware-Reviews (Badge, FPS, CTA) — additive, kein Breaking Change |
| **Einstellungen** | Neuer Tab/Section "Hardware" — additive |
| **Profil `/u/[username]`** | Neuer Tab "Hardware" (nur Owner sichtbar) — additive |
| **Personalisierte Empfehlungen** | Hardware-Profil als zusätzliches Signal nutzbar (später) |
| **Search/Filter** | Keine Änderung |
| **Notifications** | Keine Änderung |

---

## 6. Datenmodell & Migrationen

### 6.1 Prisma Schema Änderungen

```prisma
model TwitchUser {
  // ... bestehende Felder
  hardwareProfile      Json?          // { cpu: string, gpu: string, ram: string, monitor: string, psu: string, resolution: string, refreshRate: number }
  hardwareProfileEnabled Boolean      @default(false)  // Opt-in für Kompatibilitäts-Checks
  hardwareProfileVersion Int          @default(1)      // für optimistisches Locking (später)
}
```

### 6.2 Review Model Erweiterung (bereits vorhanden, Nutzung)

Bestehende Felder in `Review` werden genutzt:
- `category` (String) — Filter auf `'hardware'`
- `hardwareType` (String?) — `'gpu' | 'cpu' | 'monitor' | 'peripheral' | 'motherboard' | 'storage' | 'cooling' | 'case' | 'psu'`
- `specs` (Json?) — `{ minRequirements?: { cpu?: string, gpu?: string, ram?: string }, benchmarks?: { [resolution: string]: { avgFps: number, minFps: number, maxFps: number } } }`
- `metadata` (Json?) — Fallback für `minSpecs`, `benchmarks`

### 6.3 Migration

- **Reversibel:** Neues Feld `hardwareProfile` (nullable JSON), `hardwareProfileEnabled` (Boolean Default false), `hardwareProfileVersion` (Int Default 1)
- **Rollback:** `DROP COLUMN hardwareProfile, hardwareProfileEnabled, hardwareProfileVersion` — keine Datenverlust (nur neue Felder)
- **Migration Name:** `20261025_add_hardware_profile`

---

## 7. API-Änderungen

| Route | Method | Beschreibung |
|-------|--------|--------------|
| `/api/user/hardware-profile` | GET | Holt Hardware-Profil des aktuellen Users |
| `/api/user/hardware-profile` | PATCH | Speichert/aktualisiert Hardware-Profil (Validierung: CPU, GPU, RAM Pflicht) |
| `/api/user/hardware-profile` | DELETE | Löscht Hardware-Profil (setzt auf null) |
| `/api/reviews/[slug]/compatibility` | GET | Berechnet Kompatibilität + FPS für aktuellen User (nur bei Hardware-Reviews, nur wenn Profil komplett + enabled) |

**Response `/api/reviews/[slug]/compatibility`:**
```ts
{
  status: 'COMPATIBLE' | 'BOTTLENECK_WARNING' | 'INCOMPATIBLE' | 'NO_DATA' | 'PROFILE_INCOMPLETE' | 'NOT_HARDWARE_REVIEW',
  badgeLabel: string,           // z. B. "✅ Läuft auf deinem System"
  badgeDetails: string,         // Tooltip: "Deine RTX 3070 erfüllt die Anforderungen. CPU i5-12400 könnte bei 1080p leicht limitieren."
  fpsEstimates: FpsEstimate[],  // [{ resolution: '1080p', preset: 'Ultra', min: 85, avg: 110, max: 135 }, ...]
  limitingComponent?: 'cpu' | 'gpu' | 'ram' | 'psu',
  recommendation?: string       // z. B. "Upgrade auf i7-12700K würde ~15% mehr FPS bringen"
}
```

---

## 8. UI/UX-Ablauf

### 8.1 Einstellungen: `/einstellungen/hardware`

**Zustände:**
- **Initial (leer):** Formular mit Autocomplete-Feldern (CPU, GPU, RAM, Monitor, Netzteil), "Speichern"-Button, Toggle "Kompatibilitäts-Checks aktivieren" (default an wenn Profil gespeichert)
- **Loading:** Spinner auf Buttons
- **Success:** Toast "Hardware-Profil gespeichert", CTA "Zu Hardware-Reviews"
- **Error:** Toast mit Fehlermeldung, Formular editierbar
- **Gefüllt:** Formular mit Werten, "Aktualisieren", "Löschen", Toggle

**Autocomplete-Quelle:** Statische Liste bekannter CPUs/GPUs (aus `src/lib/hardware-db.ts` — ca. 200 CPUs, 300 GPUs) + Freitext erlaubt.

**Barrierefreiheit:**
- `<label>` für jedes Input, `aria-describedby` für Hilfetexte
- Autocomplete: `role="combobox"`, `aria-autocomplete="list"`, Keyboard-Navigation (Pfeile, Enter, Escape)
- Toggle: `role="switch"`, `aria-checked`
- Focus-Management: nach Speichern Fokus auf ersten Fehler oder Erfolgstoast

### 8.2 Review-Detailseite: Hardware-Kompatibilitäts-Badge

**Position:** Oberhalb der Review-Inhalts, neben Kategorie-Chip / Score

**Stati:**
- `COMPATIBLE` — Grün, Icon ✅, Label "Läuft auf deinem System"
- `BOTTLENECK_WARNING` — Gelb/Orange, Icon ⚠️, Label "Flaschenhals möglich"
- `INCOMPATIBLE` — Rot, Icon ❌, Label "Nicht kompatibel"
- `NO_DATA` — Grau, Icon ❓, Label "Keine Prüf-Daten verfügbar"
- `PROFILE_INCOMPLETE` — Blau, Icon ℹ️, Label "Profil vervollständigen für Check" (CTA-Button)

**FPS-Anzeige (nur GPU-Reviews, nur bei `COMPATIBLE` oder `BOTTLENECK_WARNING`):**
- Horizontal scrollbare Karten (Mobile) / Grid (Desktop)
- Je Auflösung: "1080p Ultra: ~85–110 FPS"
- Tooltip auf Hover: "Basiert auf Review-Benchmarks × CPU-Flaschenhals-Faktor (dein i5-12400 = 0.92x)"

### 8.3 Profil-Seite: `/u/[username]` Tab "Hardware"

- Nur für Owner sichtbar (`session.user.id === profileUser.id`)
- Read-only Anzeige der Specs
- Button "Bearbeiten" → `/einstellungen/hardware`

---

## 9. Sicherheit, Validierung, Datenschutz, Performance

**Sicherheit:**
- API-Routes: `verifySession` Middleware, Owner-Check (nur eigenes Profil bearbeitbar)
- Input-Validierung: Zod-Schema für Hardware-Profil (Länge, erlaubte Zeichen, keine HTML/Script-Injection)
- Rate-Limit: 10 Requests/min für PATCH/DELETE `/api/user/hardware-profile`
- Keine Secrets im Client-Code

**Datenschutz (DSGVO):**
- Opt-in Default `false` — Nutzer muss aktiv speichern + Toggle aktivieren
- Profil löschbar jederzeit (DELETE API)
- Keine Weitergabe an Dritte, nur lokale Berechnung
- In Privacy Policy erwähnen

**Performance:**
- `unstable_cache` für Compatibility-API: 5 Min (`compatibility:{reviewId}:{userId}`), Tag-Invaliderung bei User-Profil-Update (`user:{userId}:hardware`) + Review-Update (`review:{reviewId}`)
- Hardware-DB (Autocomplete) statisch im Build, Client-seitig geladen (keine API-Latency)
- Kompatibilitäts-Berechnung: O(1) String-Vergleiche + Lookup-Tabellen, < 5ms
- FPS-Berechnung: Einfache Multiplikation (Benchmark × CPU-Faktor), < 1ms

---

## 10. Teststrategie

| Test-Ebene | Was | Ziel |
|------------|-----|------|
| **Unit** | `lib/hardware-compatibility.ts` — `checkCompatibility()`, `estimateFps()`, `parseHardwareSpecs()`, `getCpuBottleneckFactor()` | 100% Branches, alle Randfälle (fehlende Daten, unbekannte Hardware, Edge-Cases) |
| **Unit** | `lib/hardware-db.ts` — `searchCpu()`, `searchGpu()`, `getCpuTier()`, `getGpuTier()` | Korrekte Lookups, Fuzzy-Match |
| **Integration** | `POST /api/user/hardware-profile` — Validierung, Auth, Speichern, Löschen | 200/400/401/422 |
| **Integration** | `GET /api/reviews/[slug]/compatibility` — alle Stati, Auth, Cache, Feature-Flag | 200/401/404, Response-Schema |
| **E2E** | Einstellungen: Profil anlegen, speichern, löschen, Toggle | User-Flow |
| **E2E** | Hardware-Review: Badge-Anzeige, FPS, CTA bei unvollständigem Profil | User-Flow |

---

## 11. Rollout-Plan

1. **Feature-Flag:** `FEATURE_HARDWARE_COMPATIBILITY` (Default `false`)
2. **Phase 1 (Intern):** Flag auf `true` für Team-Accounts, Testing auf Staging
3. **Phase 2 (Beta):** Flag auf `true` für 10% Nutzer (Cookie-basiert oder User-Flag)
4. **Phase 3 (Full):** Flag auf `true` Default, Kommunikation via Changelog/Newsletter

---

## 12. Review-Checkliste (F6)

- [ ] Alle User Stories implementiert & getestet
- [ ] Randfälle behandelt (kein Profil, unvollständig, keine Review-Daten, API-Fehler)
- [ ] Eingaben validiert (Zod), Autorisierung geprüft (Owner-only), keine Secrets
- [ ] Performance: Cache-Strategie, < 100ms API-Latency p95
- [ ] Migration reversibel, bestehende Daten intakt
- [ ] Abwärtskompatibilität: Keine Breaking Changes an bestehender API/UI
- [ ] UI: Alle Zustände (Loading, Error, Empty, Success), a11y (Labels, ARIA, Fokus, Kontrast)
- [ ] Doku: CHANGELOG, README, .env.example, PROGRESS.md