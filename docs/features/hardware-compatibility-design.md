# Feature Design: Hardware-Kompatibilitäts-Check

## 1. Architektur-Überblick

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Client (RSC)  │────▶│  API Routes      │────▶│  Prisma / Postgres  │
│                 │     │                  │     │                     │
│ /einstellungen/ │     │ /api/user/       │     │ TwitchUser          │
│   hardware      │     │   hardware-profile│     │   hardwareProfile   │
│                 │     │                  │     │   hardwareProfileEnabled│
│ /reviews/[slug] │     │ /api/reviews/    │     │   hardwareProfileVersion│
│   (Hardware)    │     │   [slug]/        │     │                     │
│                 │     │   compatibility  │     │ Review              │
└─────────────────┘     └──────────────────┘     │   specs.minRequirements│
       ▲                      ▲                  │   specs.benchmarks    │
       │                      │                  │   hardwareType        │
       │         ┌────────────┴────────────┐     └─────────────────────┘
       │         │  lib/hardware-          │
       └────────▶│  compatibility.ts       │
                 │  - checkCompatibility() │
                 │  - estimateFps()        │
                 │  - getCpuBottleneck()   │
                 └────────────┬────────────┘
                              │
                 ┌────────────┴────────────┐
                 │  lib/hardware-db.ts     │
                 │  - CPU_DB[]             │
                 │  - GPU_DB[]             │
                 │  - searchCpu()          │
                 │  - searchGpu()          │
                 │  - getCpuTier()         │
                 │  - getGpuTier()         │
                 └─────────────────────────┘
```

**Prinzipien:**
- **RSC First:** Kompatibilitäts-Badge & FPS im Server Component berechnet (SSR, SEO, Cache)
- **Client nur für Interaktion:** Einstellungen-Formular (Autocomplete, Toggle, Speichern)
- **Cache-Strategie:** `unstable_cache` 5 Min für Compatibility-API, Tags für Invaliderung
- **Keine neuen Dependencies:** Nur bestehende (zod, @tanstack/react-query für Client-Mutations)

---

## 2. Bestehende Wiederverwendung (Code-Analyse)

| Bereich | Datei | Wiederverwendung |
|---------|-------|------------------|
| **User-Profil API** | `src/app/api/user/profile/route.ts` | Pattern für GET/PATCH/DELETE User-Daten |
| **Einstellungen UI** | `src/app/einstellungen/page.tsx` | Tabs-Struktur, Form-Layout, Toast-Pattern |
| **Review-Detail** | `src/app/reviews/[slug]/page.tsx` | Integration-Point für Badge/FPS |
| **Feature-Flags** | `src/lib/feature-flags.ts` | `FEATURE_HARDWARE_COMPATIBILITY` hinzufügen |
| **Cache** | `src/lib/cache.ts` | `unstable_cache` Wrapper, Tag-Invaliderung |
| **Notifications** | `src/lib/notifications.ts` | Nicht nötig (keine Notifications für dieses Feature) |
| **Hardware-Daten** | `prisma/seed.ts` | Hardware-Typen, Specs-Struktur verstehen |

---

## 3. Datenfluss

### 3.1 Profil Speichern (Client → Server)
```
User füllt Formular aus
    ▼
useHardwareProfile Mutation (react-query)
    ▼
PATCH /api/user/hardware-profile { cpu, gpu, ram, monitor, psu, resolution, refreshRate }
    ▼
validateSession() → getUser()
    ▼
Zod validate → prisma.twitchUser.update({ hardwareProfile, hardwareProfileEnabled, hardwareProfileVersion: { increment: 1 } })
    ▼
revalidateTag(`user:${userId}:hardware`)
    ▼
Return { success: true, profile }
```

### 3.2 Kompatibilität Berechnen (Server → Client bei Review-Load)
```
RSC: /reviews/[slug]/page.tsx
    ▼
fetchReviewWithCompatibility(slug, userId?) → unstable_cache(5min, tags: [`review:${slug}`, `user:${userId}:hardware`])
    ▼
Wenn Hardware-Review + User eingeloggt + Profil komplett + Flag an:
    ▼
lib/hardware-compatibility.checkCompatibility(userProfile, review)
    ▼
lib/hardware-compatibility.estimateFps(userProfile, review) (nur GPU)
    ▼
Return { badge, fpsEstimates, details }
    ▼
Client Component <HardwareCompatibilityBadge> erhält Props (kein Hydration-Mismatch)
```

---

## 4. Arbeitspakete (PKG-1 bis PKG-12)

| PKG | Beschreibung | Dateien (neu/geändert) | Aufwand |
|-----|--------------|------------------------|---------|
| **PKG-1** | **Prisma Migration & Types** — `hardwareProfile` (Json), `hardwareProfileEnabled` (Boolean), `hardwareProfileVersion` (Int) auf `TwitchUser`. Migration reversibel. | `prisma/schema.prisma`, `prisma/migrations/.../migration.sql`, `src/types/user.ts` | 0.5h |
| **PKG-2** | **Hardware DB (Static)** — Statische Arrays `CPU_DB`, `GPU_DB` mit Tier, TDP, Release-Year, Benchmark-Index. Lookup-Funktionen `searchCpu()`, `searchGpu()`, `getCpuTier()`, `getGpuTier()`, `getCpuBottleneckFactor(cpu, gpu)`. | `src/lib/hardware-db.ts` (neu), `src/lib/hardware-db.test.ts` | 1.5h |
| **PKG-3** | **Compatibility Logic** — `checkCompatibility(userProfile, review)`: Vergleicht `minRequirements` vs. User-Profil → Status + limitingComponent. `estimateFps(userProfile, review)`: Nimmt Review-Benchmarks × CPU-Faktor × RAM-Faktor. Zod-Schemas für Input/Output. | `src/lib/hardware-compatibility.ts` (neu), `src/lib/hardware-compatibility-schema.ts` (neu), `src/lib/hardware-compatibility.test.ts` | 2h |
| **PKG-4** | **API: User Hardware Profile** — `GET/PATCH/DELETE /api/user/hardware-profile`. Auth, Owner-Check, Zod-Validierung (Pflicht: cpu, gpu, ram), Version-Increment, Cache-Tag-Invaliderung. | `src/app/api/user/hardware-profile/route.ts` (neu), `tests/api/user/hardware-profile.test.ts` | 1h |
| **PKG-5** | **API: Review Compatibility** — `GET /api/reviews/[slug]/compatibility`. Prüft Feature-Flag, Hardware-Review, User-Profil. Nutzt `checkCompatibility` + `estimateFps`. Cache 5 Min + Tags. | `src/app/api/reviews/[slug]/compatibility/route.ts` (neu), `tests/api/reviews/compatibility.test.ts` | 1h |
| **PKG-6** | **Client Hook & Types** — `useHardwareProfile()` (react-query: get, update, delete), `useHardwareCompatibility(slug)` (SSR-Data via Props, Client-Refresh optional). Types in `src/types/hardware.ts`. | `src/hooks/useHardwareProfile.ts` (neu), `src/types/hardware.ts` (neu) | 0.5h |
| **PKG-7** | **UI: Einstellungen Hardware** — `/einstellungen/hardware` (neue Page) oder Tab in `/einstellungen`. Formular mit Autocomplete (CPU/GPU/ROM), Monitor/PSU Freitext, Toggle, Speichern/Löschen. Optimistic UI, Toast, a11y. | `src/app/einstellungen/hardware/page.tsx` (neu) ODER `src/app/einstellungen/page.tsx` (Tab erweitern), `src/components/settings/HardwareProfileForm.tsx` (neu) | 1.5h |
| **PKG-8** | **UI: Hardware Compatibility Badge** — `<HardwareCompatibilityBadge>` Client Component. Props: `status`, `label`, `details`, `fpsEstimates`, `onProfileComplete`. Tooltip, Responsive FPS-Grid, CTA-Button. | `src/components/reviews/HardwareCompatibilityBadge.tsx` (neu), `src/components/reviews/HardwareCompatibilitySkeleton.tsx` (neu) | 1h |
| **PKG-9** | **Integration: Review-Detailseite** — In `/reviews/[slug]/page.tsx`: Server-seitig `fetchReviewWithCompatibility()` → Props an `HardwareCompatibilityBadge`. Nur bei `category === 'hardware'` || `hardwareType`. Feature-Flag Check. | `src/app/reviews/[slug]/page.tsx` (geändert), `src/lib/reviews.ts` (fetchReviewWithCompatibility neu) | 0.5h |
| **PKG-10** | **Integration: Profil-Seite** — Tab "Hardware" auf `/u/[username]` (nur Owner). Read-only Anzeige + Link zu Einstellungen. | `src/app/u/[username]/page.tsx` (geändert), `src/components/profile/HardwareProfileTab.tsx` (neu) | 0.5h |
| **PKG-11** | **Tests** — Unit: hardware-db (15), hardware-compatibility (25). Integration: user/hardware-profile (8), reviews/compatibility (12). E2E: settings flow, review badge. | `tests/lib/hardware-db.test.ts`, `tests/lib/hardware-compatibility.test.ts`, `tests/api/user/hardware-profile.test.ts`, `tests/api/reviews/compatibility.test.ts`, `tests/e2e/hardware-compatibility.test.ts` | 1.5h |
| **PKG-12** | **Doku & Flag** — CHANGELOG.md, README.md, ROADMAP.md, .env.example, PROGRESS.md, DECISIONS.md. Feature-Flag Default `false`. | `CHANGELOG.md`, `README.md`, `ROADMAP.md`, `.env.example`, `docs/PROGRESS.md`, `docs/features/hardware-compatibility.md` (Review-Sektion) | 0.5h |

**Gesamt-Aufwand:** ~12h (verteilt auf mehrere Iterationen)

---

## 5. Cache-Strategie Details

| Cache-Key | TTL | Tags | Invaliderung |
|-----------|-----|------|--------------|
| `compatibility:${reviewId}:${userId}` | 5 Min | `review:${reviewId}`, `user:${userId}:hardware` | Review-Update, User-Hardware-Update |
| `user:hardware:${userId}` | 10 Min | `user:${userId}:hardware` | User-Hardware-Update |
| `hardware-db:cpu` / `hardware-db:gpu` | Build-time (statisch) | — | Nie (Build-time Konstante) |

---

## 6. Hardware-DB Design (PKG-2)

```ts
// src/lib/hardware-db.ts
interface CpuEntry {
  name: string;           // "Intel Core i5-12400"
  brand: 'intel' | 'amd';
  tier: 'entry' | 'mid' | 'high' | 'enthusiast';  // für Bottleneck-Faktor
  cores: number;
  threads: number;
  baseClock: number;      // GHz
  boostClock: number;
  tdp: number;            // Watt
  releaseYear: number;
  socket: string;
  benchmarkIndex: number; // PassMark Single Thread relativ (i5-12400 = 100)
}

interface GpuEntry {
  name: string;           // "NVIDIA GeForce RTX 3070"
  brand: 'nvidia' | 'amd' | 'intel';
  tier: 'entry' | 'mid' | 'high' | 'enthusiast';
  vram: number;           // GB
  vramType: 'GDDR6' | 'GDDR6X' | 'HBM2' | 'GDDR5';
  tdp: number;
  releaseYear: number;
  benchmarkIndex: number; // 3DMark Time Spy relativ (RTX 3070 = 100)
}
```

**Bottleneck-Heuristik (einfach, erweiterbar):**
- CPU-Faktor = `min(1.0, cpuBenchmarkIndex / gpuBenchmarkIndex * 1.2)`
- Wenn CPU-Faktor < 0.85 → `BOTTLENECK_WARNING` (CPU limitiert GPU)
- RAM: < 16GB → Warning bei modernen Spielen, < 8GB → `INCOMPATIBLE` für AAA
- Netzteil: TDP(CPU) + TDP(GPU) + 100W (Rest) > PSU-Watt → Warning

---

## 7. Feature-Flag Konfiguration

```ts
// src/lib/feature-flags.ts
export const FEATURE_HARDWARE_COMPATIBILITY = process.env.FEATURE_HARDWARE_COMPATIBILITY === 'true';
// Default: false (Opt-in für Datenschutz)
```

`.env.example`:
```
FEATURE_HARDWARE_COMPATIBILITY=false
```

---

## 8. UI-Komponenten Struktur

```
src/components/
├── settings/
│   └── HardwareProfileForm.tsx      # Formular mit Autocomplete, Toggle, Actions
├── reviews/
│   ├── HardwareCompatibilityBadge.tsx  # Badge + Tooltip + FPS Grid
│   └── HardwareCompatibilitySkeleton.tsx # Loading-Skeleton
└── profile/
    └── HardwareProfileTab.tsx          # Read-only Anzeige auf /u/[username]
```

---

## 9. Barrierefreiheit (a11y) Checkliste

- [ ] Autocomplete: `role="combobox"`, `aria-expanded`, `aria-activedescendant`, Pfeil-Navigation, Escape schließt
- [ ] Form-Labels: `<label htmlFor>` für alle Inputs
- [ ] Toggle: `role="switch"`, `aria-checked`, `aria-describedby` für Hilfetext
- [ ] Badge: Farbkontrast (WCAG AA), Icon + Text (nicht nur Farbe), `aria-label` für Screen-Reader
- [ ] FPS-Grid: Tabelle mit `<th scope="col">`, responsive Scroll-Container mit `tabindex=0`
- [ ] Focus-Order: Logisch (CPU → GPU → RAM → Monitor → PSU → Toggle → Speichern)
- [ ] Reduced Motion: Tooltip/Animationen respektieren `prefers-reduced-motion`

---

## 10. Rollout- & Feature-Flag-Strategie

| Phase | Flag-Wert | Zielgruppe | Dauer |
|-------|-----------|------------|-------|
| Dev | `true` | Team | Dauerhaft |
| Staging | `true` | Team + Beta-Tester | 1 Woche |
| Production Beta | `true` (Cookie `hw_compat_beta=1`) | 10% Nutzer (opt-in via Banner) | 2 Wochen |
| Production Full | `true` (Default) | Alle | Nach Beta-Freigabe |

**Rollback:** Flag auf `false` setzen → sofort deaktiviert, keine DB-Migration nötig.

---

## 11. Abhängigkeiten & Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Hardware-DB unvollständig (neue CPUs/GPUs) | Mittel | Niedrig | Fuzzy-Match + Generische Tier-Fallbacks; DB wartbar als JSON-File |
| Benchmark-Daten in Reviews lückenhaft | Hoch | Mittel | Graceful Degradation: "Keine FPS-Daten verfügbar", nur Badge anzeigen |
| FPS-Schätzung ungenau → Nutzer-Vertrauensverlust | Mittel | Hoch | Prominenter Disclaimer, "Schätzung", nicht "Garantie"; Nutzer-Feedback sammeln |
| Performance: Compatibility-Check bei jeder Review-Load | Niedrig | Mittel | Cache 5 Min, Berechnung < 5ms, nur bei Hardware-Reviews |
| Datenschutz-Bedenken (Hardware-Profil) | Niedrig | Hoch | Opt-in Default false, löschbar, DSGVO-Hinweis in Privacy Policy |

---

## 12. Definition of Done (Feature)

- [ ] Spec vollständig (`docs/features/hardware-compatibility.md`)
- [ ] Design vollständig (`docs/features/hardware-compatibility-design.md`)
- [ ] Alle 12 PKGs implementiert, committed, gepushed
- [ ] Unit-Tests: hardware-db ≥ 15, hardware-compatibility ≥ 25 — alle grün
- [ ] Integration-Tests: user/hardware-profile ≥ 8, reviews/compatibility ≥ 12 — alle grün
- [ ] E2E-Tests: Settings-Flow, Review-Badge — grün
- [ ] Self-Review (F6) ohne offene Befunde
- [ ] Build, Type-Check, Lint, Tests (gesamt) grün
- [ ] Doku & Changelog aktualisiert
- [ ] Migration reversibel getestet (up + down)
- [ ] Keine Secrets im Diff
- [ ] Alles auf `auto/dev` gepusht