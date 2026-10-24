# Design & Plan: Erweiterte Suchfilter (Advanced Search Filters)

**Datum:** 2026-10-24  
**Basiert auf:** `docs/features/advanced-search-filters.md` (Spec F2)  
**Feature-Flag:** `FEATURE_ADVANCED_SEARCH_FILTERS` (Default: true)

---

## 1. Architektur-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                        /suche (Server Component)                │
│  - Liest searchParams                                           │
│  - Ruft API auf (fetch)                                         │
│  - Rendert SearchPageContent                                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SearchPageContent (Client Component)           │
│  - Verwaltet URL-State (useSearchParams, useRouter)             │
│  - Rendert SearchFilters + SearchResults                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │ SearchFilters   │ SearchResults │ SearchSkeleton │
    │ (Client)        │ (Client)      │ (Client)       │
    └──────┬────────┘ └──────┬────────┘ └──────┬────────┘
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────────────────────────────────────────────────┐
    │              /api/reviews/search (Server)               │
    │  - Validiert Query-Params (Zod)                         │
    │  - Baut Prisma Where-Clause (alle Filter)               │
    │  - Führt Query aus (mit Joins für Preis/Plattform)      │
    │  - Wendet Relevanz-Scoring an (falls sort=relevance)    │
    │  - Return: { reviews, pagination }                      │
    └─────────────────────────────────────────────────────────┘
                           │
                           ▼
    ┌─────────────────────────────────────────────────────────┐
    │                    Prisma / PostgreSQL                   │
    │  - Review (Haupttabelle)                                 │
    │  - PriceHistory (Preis-Filter)                           │
    │  - Deal (Deal-Filter)                                    │
    │  - Tag/ReviewTag (Tag-Filter)                            │
    │  - Hardware (Hardware-Plattform)                         │
    │  - Metadata (JSON: developer, publisher, platforms)      │
    └─────────────────────────────────────────────────────────┘
```

---

## 2. Datenfluss & Schnittstellen

### 2.1 Query-Parameter → Prisma Where-Clause

```typescript
// src/lib/search-filters.ts (neu)
interface SearchFiltersInput {
  query?: string;
  category?: string;
  minScore?: number;
  maxScore?: number;
  tags?: string[];
  sort?: SearchSort;
  limit?: number;
  page?: number;
  // NEU:
  releaseDateFrom?: Date;
  releaseDateTo?: Date;
  minPrice?: number;
  maxPrice?: number;
  platforms?: string[];
  hasVideo?: boolean;
  hasDeal?: boolean;
  developer?: string;
  publisher?: string;
}

function buildSearchWhereClause(input: SearchFiltersInput): Prisma.ReviewWhereInput {
  const where: Prisma.ReviewWhereInput = { status: "published" };
  
  // Bestehende Filter (Category, Score, Tags) – unverändert
  
  // NEU: Release-Datum
  if (input.releaseDateFrom || input.releaseDateTo) {
    where.releaseDate = {};
    if (input.releaseDateFrom) where.releaseDate.gte = input.releaseDateFrom;
    if (input.releaseDateTo) where.releaseDate.lte = input.releaseDateTo;
  }
  
  // NEU: Video
  if (input.hasVideo === true) {
    where.youtubeVideos = { not: { equals: [] } };
  }
  
  // NEU: Deal
  if (input.hasDeal === true) {
    where.deals = { some: { status: "active", expiresAt: { gt: new Date() } } };
  }
  
  // NEU: Plattform (über Metadata JSON oder Hardware)
  if (input.platforms?.length) {
    where.OR = [
      { metadata: { path: "platforms", array_contains: input.platforms } },
      { hardware: { type: { in: mapPlatformsToHardwareTypes(input.platforms) } } },
    ];
  }
  
  // NEU: Developer/Publisher (ILIKE auf JSON)
  if (input.developer) {
    where.metadata = {
      ...(where.metadata as object),
      path: "developer",
      string_contains: input.developer,
      mode: "insensitive",
    };
  }
  if (input.publisher) {
    where.metadata = {
      ...(where.metadata as object),
      path: "publisher",
      string_contains: input.publisher,
      mode: "insensitive",
    };
  }
  
  // NEU: Preis – komplexer, siehe Preis-Utils
  // Wird als Subquery/Join in der Haupt-Query gehandhabt
  
  return where;
}
```

### 2.2 Preis-Filter Implementation

```typescript
// src/lib/price-utils.ts (neu)

interface PriceInfo {
  currentPrice: number | null;
  hasDeal: boolean;
  dealPrice: number | null;
  currency: string;
}

async function getReviewPriceInfo(reviewId: string): Promise<PriceInfo> {
  // 1. Aktueller Preis aus PriceHistory (neuester Eintrag)
  const latestPrice = await prisma.priceHistory.findFirst({
    where: { reviewId },
    orderBy: { recordedAt: "desc" },
    select: { price: true, currency: true },
  });
  
  // 2. Aktueller Deal
  const activeDeal = await prisma.deal.findFirst({
    where: { 
      reviewId, 
      status: "active", 
      expiresAt: { gt: new Date() } 
    },
    orderBy: { price: "asc" }, // Günstigster Deal
    select: { price: true, currency: true },
  });
  
  // 3. Hardware MSRP (falls Hardware-Review)
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { hardware: { select: { msrp: true } } },
  });
  
  const prices = [
    latestPrice?.price,
    activeDeal?.price,
    review?.hardware?.msrp,
  ].filter((p): p is number => p !== null && p !== undefined);
  
  const currentPrice = prices.length > 0 ? Math.min(...prices) : null;
  
  return {
    currentPrice,
    hasDeal: !!activeDeal,
    dealPrice: activeDeal?.price ?? null,
    currency: latestPrice?.currency ?? activeDeal?.currency ?? "EUR",
  };
}

// Für Batch-Abfrage in Search-API: Raw SQL oder Prisma $queryRaw für Performance
async function getReviewsWithPrices(reviewIds: string[]): Promise<Map<string, PriceInfo>> {
  // Ein einziger Query mit LEFT JOINS auf PriceHistory (latest), Deal (active), Hardware
  // Return Map<reviewId, PriceInfo>
}
```

**Performance-Optimierung:** Statt N+1 Queries → **ein Raw-Query** mit `LEFT JOIN LATERAL` für neuesten Preis + aktiven Deal. Siehe PKG-4.

### 2.3 API Response (unverändert)

```typescript
// Bleibt identisch zu bestehendem Response
interface SearchResponse {
  reviews: SearchReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## 3. Bestehende Wiederverwendbare Komponenten

| Komponente | Pfad | Wiederverwendung |
|------------|------|------------------|
| `SearchFilters` | `src/components/search/SearchFilters.tsx` | **Hauptziel** – wird um neue Filter erweitert |
| `SearchResults` | `src/components/search/SearchResults.tsx` | Unverändert – bekommt nur gefilterte Daten |
| `SearchSkeleton` | `src/components/search/SearchSkeleton.tsx` | Unverändert |
| `/api/reviews/search` | `src/app/api/reviews/search/route.ts` | **Hauptziel** – wird um Parameter/Logik erweitert |
| `scoreRelevance` | `src/lib/search-relevance.ts` | Unverändert – wird nach Filter angewendet |
| `unstable_cache` | In `page.tsx` & API | Unverändert – Cache-Key enthält alle searchParams |
| `CATEGORIES`, `SORT_OPTIONS` | `page.tsx` | Unverändert |
| `SCORE_OPTIONS` | `SearchFilters.tsx` | Unverändert |

---

## 4. Neue Dateien & Module

| Datei | Zweck |
|-------|-------|
| `src/lib/search-filters.ts` | Types, `buildSearchWhereClause`, Parameter-Parsing/Validierung |
| `src/lib/search-filter-schema.ts` | Zod-Schemas für API-Input-Validierung |
| `src/lib/platform-utils.ts` | Plattform-Normalisierung, Whitelist, Hardware-Type-Mapping |
| `src/lib/price-utils.ts` | Preis-Ermittlung (PriceHistory, Deals, Hardware MSRP), Batch-Query |
| `tests/lib/advanced-search-filters.test.ts` | Unit-Tests für Filter-Logik |
| `tests/api/search-advanced-filters.test.ts` | Integration-Tests für API |
| `docs/features/advanced-search-filters.md` | Spec (bereits erstellt) |
| `docs/features/advanced-search-filters-design.md` | Dieses Dokument |

---

## 5. Arbeitspakete (Detailliert)

### PKG-1: Types & Zod-Schemas (`src/lib/search-filters.ts`, `src/lib/search-filter-schema.ts`)

**Ziel:** Zentrale Type-Definitionen und Validierung für alle Such-Parameter.

**Dateien:**
- `src/lib/search-filter-schema.ts` – Zod-Schema für `GET /api/reviews/search`
- `src/lib/search-filters.ts` – Types, `parseSearchParams`, `buildSearchWhereClause` (ohne Preis/Plattform-Logik)

**Inhalt `search-filter-schema.ts`:**
```typescript
import { z } from "zod";

export const searchParamsSchema = z.object({
  query: z.string().trim().max(200).optional(),
  category: z.enum(["game", "movie", "series", "hardware", "all"]).default("all"),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  maxScore: z.coerce.number().int().min(0).max(100).optional(),
  tags: z.string().transform(s => s.split(",").filter(Boolean)).optional(),
  sort: z.enum(["relevance", "date-desc", "date-asc", "score-desc", "score-asc"]).default("relevance"),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  page: z.coerce.number().int().min(1).default(1),
  // NEU:
  releaseDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(s => new Date(s)).optional(),
  releaseDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(s => new Date(s)).optional(),
  minPrice: z.coerce.number().min(0).max(100000).optional(),
  maxPrice: z.coerce.number().min(0).max(100000).optional(),
  platforms: z.string().transform(s => s.split(",").filter(Boolean)).optional(),
  hasVideo: z.coerce.boolean().optional(),
  hasDeal: z.coerce.boolean().optional(),
  developer: z.string().trim().max(100).optional(),
  publisher: z.string().trim().max(100).optional(),
}).refine(d => !d.minPrice || !d.maxPrice || d.minPrice <= d.maxPrice, {
  message: "minPrice muss <= maxPrice sein",
  path: ["minPrice"],
}).refine(d => !d.releaseDateFrom || !d.releaseDateTo || d.releaseDateFrom <= d.releaseDateTo, {
  message: "releaseDateFrom muss <= releaseDateTo sein",
  path: ["releaseDateFrom"],
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
```

**Inhalt `search-filters.ts`:**
- `SearchFiltersInput` Interface
- `parseSearchParams(searchParams: URLSearchParams): SearchFiltersInput`
- `buildSearchWhereClause(input: SearchFiltersInput): Prisma.ReviewWhereInput` (basis, ohne Preis)

**Tests:** `tests/lib/advanced-search-filters.test.ts` – Schema-Validierung, Where-Clause-Building

---

### PKG-2: Plattform-Utils (`src/lib/platform-utils.ts`)

**Ziel:** Kanonische Plattform-Namen, Mapping zu Hardware-Types, JSON-Array-Contains-Helper.

**Inhalt:**
```typescript
export const CANONICAL_PLATFORMS = [
  "PC", "PS5", "PS4", "Xbox Series", "Xbox One", "Switch",
] as const;

export type CanonicalPlatform = typeof CANONICAL_PLATFORMS[number];

export const PLATFORM_ALIASES: Record<string, CanonicalPlatform> = {
  "pc": "PC", "windows": "PC", "steam": "PC", "epic": "PC", "gog": "PC",
  "playstation 5": "PS5", "ps5": "PS5", "ps 5": "PS5",
  "playstation 4": "PS4", "ps4": "PS4", "ps 4": "PS4",
  "xbox series x": "Xbox Series", "xbox series s": "Xbox Series", "xbox series": "Xbox Series", "xbox series x/s": "Xbox Series",
  "xbox one": "Xbox One", "xbox 1": "Xbox One",
  "nintendo switch": "Switch", "switch": "Switch",
};

export function normalizePlatform(input: string): CanonicalPlatform | null {
  const key = input.toLowerCase().trim();
  return PLATFORM_ALIASES[key] ?? null;
}

export function mapPlatformsToHardwareTypes(platforms: CanonicalPlatform[]): string[] {
  // Hardware-Types die zu Plattformen passen
  const mapping: Record<CanonicalPlatform, string[]> = {
    PC: ["gpu", "cpu", "motherboard", "ram", "storage", "psu", "case", "cooler", "monitor", "keyboard", "mouse", "headset", "controller"],
    PS5: ["console"],
    PS4: ["console"],
    "Xbox Series": ["console"],
    "Xbox One": ["console"],
    Switch: ["console"],
  };
  return platforms.flatMap(p => mapping[p] ?? []);
}

export function buildPlatformWhereClause(platforms: CanonicalPlatform[]): Prisma.ReviewWhereInput {
  const hardwareTypes = mapPlatformsToHardwareTypes(platforms);
  return {
    OR: [
      { metadata: { path: "platforms", array_contains: platforms } },
      ...(hardwareTypes.length > 0 ? [{ hardware: { type: { in: hardwareTypes } } }] : []),
    ],
  };
}
```

**Tests:** Normalisierung, Mapping, Where-Clause-Generierung

---

### PKG-3: Preis-Utils (`src/lib/price-utils.ts`)

**Ziel:** Einheitliche Preis-Ermittlung pro Review (Batch-fähig für Search-API).

**Inhalt:**
- `getCurrentPrice(review: ReviewWithRelations): number | null` – single
- `getReviewsWithPrices(reviewIds: string[]): Promise<Map<string, PriceInfo>>` – batch (Raw SQL)
- `hasActiveDeal(review: ReviewWithRelations): boolean`
- `filterByPriceRange(reviews: ReviewWithRelations[], min?: number, max?: number): ReviewWithRelations[]` – post-filter für Relevanz-Sort

**Raw SQL Query (PostgreSQL):**
```sql
SELECT r.id,
       ph.price AS latest_price,
       ph.currency,
       d.price AS deal_price,
       h.msrp AS hardware_msrp
FROM "Review" r
LEFT JOIN LATERAL (
  SELECT price, currency
  FROM "PriceHistory"
  WHERE "reviewId" = r.id
  ORDER BY "recordedAt" DESC
  LIMIT 1
) ph ON true
LEFT JOIN LATERAL (
  SELECT price
  FROM "Deal"
  WHERE "reviewId" = r.id
    AND status = 'active'
    AND "expiresAt" > NOW()
  ORDER BY price ASC
  LIMIT 1
) d ON true
LEFT JOIN "Hardware" h ON r."hardwareId" = h.id
WHERE r.id IN ($1, $2, ...)
```

**Tests:** Preis-Logik (verschiedene Kombis), Batch-Query, Edge-Cases (kein Preis, nur Deal, nur Hardware)

---

### PKG-4: API Route erweitern (`src/app/api/reviews/search/route.ts`)

**Änderungen:**
1. Import `searchParamsSchema`, `parseSearchParams`, `buildSearchWhereClause`, `getReviewsWithPrices`
2. Feature-Flag Check: `if (!process.env.FEATURE_ADVANCED_SEARCH_FILTERS) { /* ignore new params */ }`
3. Validierung: `const parsed = searchParamsSchema.safeParse(Object.fromEntries(searchParams))`
4. Where-Clause bauen (bestehend + neu)
5. **Preis-Filter:** Wenn `minPrice`/`maxPrice` gesetzt:
   - Erst Reviews ohne Preis-Filter laden (ggf. mehr für Relevanz-Sort)
   - `getReviewsWithPrices(ids)` aufrufen
   - Post-filtern: `filterByPriceRange`
   - Dann Pagination anwenden
6. Plattform-Filter: `buildPlatformWhereClause` in Where-Clause mergen
7. Developer/Publisher: JSON-Contains in Where-Clause
8. Response unverändert

**Wichtig:** Bei `sort=relevance` + Preis-Filter → mehr Reviews fetchen (wie bisher `limit * 5`), dann preis-filtern, dann `scoreRelevance`, dann paginieren.

**Caching:** `unstable_cache` Key enthält alle Search-Params → automatisch verschiedene Cache-Einträge pro Filter-Kombi.

---

### PKG-5: Client Types & Hook (`src/hooks/useAdvancedSearchFilters.ts`)

**Ziel:** Erweitertes `useSearchParams`-Hook mit Typsicherheit für neue Parameter.

```typescript
// src/hooks/useAdvancedSearchFilters.ts
import { useSearchParams, useRouter } from "next/navigation";
import { SearchFiltersInput } from "@/lib/search-filters";

export function useAdvancedSearchFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const filters: SearchFiltersInput = {
    query: searchParams.get("q") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    // ... alle Parameter parsen
    releaseDateFrom: searchParams.get("releaseDateFrom") ?? undefined,
    releaseDateTo: searchParams.get("releaseDateTo") ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    // ...
  };
  
  const updateFilters = (newFilters: Partial<SearchFiltersInput>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    // ... alle neuen Parameter setzen/löschen
    router.push(`/suche?${params.toString()}`, { scroll: false });
  };
  
  return { filters, updateFilters };
}
```

---

### PKG-6: UI: `SearchFilters` erweitern

**Änderungen an `src/components/search/SearchFilters.tsx`:**

#### Neue State-Variablen
```typescript
const [localReleaseFrom, setLocalReleaseFrom] = useState("");
const [localReleaseTo, setLocalReleaseTo] = useState("");
const [localMinPrice, setLocalMinPrice] = useState("");
const [localMaxPrice, setLocalMaxPrice] = useState("");
const [localPlatforms, setLocalPlatforms] = useState<string[]>([]);
const [localHasVideo, setLocalHasVideo] = useState(false);
const [localHasDeal, setLocalHasDeal] = useState(false);
const [localDeveloper, setLocalDeveloper] = useState("");
const [localPublisher, setLocalPublisher] = useState("");
const [showAdvanced, setShowAdvanced] = useState(false); // Progressive Disclosure
```

#### Neue Handler
- `handleReleaseDateChange(from, to)` – validiert from <= to
- `handlePriceChange(min, max)` – validiert min <= max
- `handlePlatformToggle(platform)` – Multi-Select
- `handleHasVideoChange`, `handleHasDealChange` – Checkbox
- `handleDeveloperChange`, `handlePublisherChange` – Debounced Input (300ms)

#### UI-Struktur (erweitert)
```tsx
{/* Row 1: Bestehende + Release-Datum + Preis */}
<div className="flex flex-wrap items-center gap-2">
  {/* Category, Sort, Score – unverändert */}
  
  {/* NEU: Release-Datum Dropdown */}
  <div className="relative" ref={dateRef}>
    <button onClick={() => setShowDate(!showDate)} ...>
      <Calendar className="size-3.5" />
      <span>Release</span>
      <ChevronDown ... />
    </button>
    {showDate && (
      <div className="absolute ... p-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="releaseFrom">Von</label>
            <input type="date" id="releaseFrom" value={localReleaseFrom} onChange={...} max={today} />
          </div>
          <div>
            <label htmlFor="releaseTo">Bis</label>
            <input type="date" id="releaseTo" value={localReleaseTo} onChange={...} max={today} />
          </div>
        </div>
      </div>
    )}
  </div>
  
  {/* NEU: Preis Dropdown */}
  <div className="relative" ref={priceRef}>
    <button onClick={() => setShowPrice(!showPrice)} ...>
      <Euro className="size-3.5" /> {/* neues Icon */}
      <span>Preis</span>
      <ChevronDown ... />
    </button>
    {showPrice && (
      <div className="absolute ... p-3">
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min" value={localMinPrice} onChange={...} min={0} step={0.01} />
          <input type="number" placeholder="Max" value={localMaxPrice} onChange={...} min={0} step={0.01} />
        </div>
        <span className="text-xs text-muted-foreground">EUR</span>
      </div>
    )}
  </div>
</div>

{/* Row 2: Advanced Filter (einklappbar) */}
<button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-muted-foreground hover:text-foreground">
  {showAdvanced ? "Weniger Filter ▲" : "Weitere Filter ▼"}
</button>

{showAdvanced && (
  <div className="space-y-4 pt-4 border-t border-border">
    {/* Plattform Multi-Select */}
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-2">Plattform</label>
      <div className="flex flex-wrap gap-2">
        {CANONICAL_PLATFORMS.map(p => (
          <label key={p} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm cursor-pointer hover:bg-accent/50">
            <input type="checkbox" value={p} checked={localPlatforms.includes(p)} onChange={...} className="sr-only" />
            <span className="peer-checked:font-medium">{p}</span>
          </label>
        ))}
      </div>
    </div>
    
    {/* Checkboxen: Video, Deal */}
    <div className="flex flex-wrap items-center gap-4">
      <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm cursor-pointer hover:bg-accent/50">
        <input type="checkbox" checked={localHasVideo} onChange={...} className="sr-only" />
        <span className="flex items-center gap-1.5">
          <Film className="size-4" />
          Mit Video
        </span>
      </label>
      <label className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm cursor-pointer hover:bg-accent/50">
        <input type="checkbox" checked={localHasDeal} onChange={...} className="sr-only" />
        <span className="flex items-center gap-1.5">
          <Tag className="size-4" />
          Mit Deal
        </span>
      </label>
    </div>
    
    {/* Developer / Publisher Inputs */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label htmlFor="developer" className="text-xs font-medium text-muted-foreground block mb-1">Entwickler</label>
        <input type="text" id="developer" value={localDeveloper} onChange={...} placeholder="z. B. CD Projekt" className="w-full h-8 rounded-sm border border-border bg-background px-2 text-sm" />
      </div>
      <div>
        <label htmlFor="publisher" className="text-xs font-medium text-muted-foreground block mb-1">Publisher</label>
        <input type="text" id="publisher" value={localPublisher} onChange={...} placeholder="z. B. Bethesda" className="w-full h-8 rounded-sm border border-border bg-background px-2 text-sm" />
      </div>
    </div>
  </div>
)}

{/* Active Filter Badges – erweitert um neue Filter */}
{/* Clear All – erweitert um neue Filter */}
```

**Icons:** `Calendar`, `Euro` (aus `lucide-react`), `Film`, `Tag` – bereits importiert oder neu hinzufügen.

---

### PKG-7: Feature-Flag & Progressive Disclosure

**Feature-Flag Check:**
```typescript
// In SearchPageContent.tsx & SearchFilters.tsx
const isAdvancedEnabled = process.env.NEXT_PUBLIC_FEATURE_ADVANCED_SEARCH_FILTERS === "true";

// In SearchFilters: Nur rendern wenn isAdvancedEnabled
{isAdvancedEnabled && (
  <> {/* Advanced Filter UI */} </>
)}
```

**`.env.example` Eintrag:**
```
FEATURE_ADVANCED_SEARCH_FILTERS=true
```

**Progressive Disclosure:** "Weitere Filter" Button (siehe PKG-6) – Standard zugeklappt auf Mobile, aufgeklappt auf Desktop (>md).

---

### PKG-8: Unit-Tests (`tests/lib/advanced-search-filters.test.ts`)

```typescript
import { describe, it, expect } from "vitest";
import { searchParamsSchema } from "@/lib/search-filter-schema";
import { buildSearchWhereClause } from "@/lib/search-filters";
import { normalizePlatform, mapPlatformsToHardwareTypes, buildPlatformWhereClause } from "@/lib/platform-utils";
import { filterByPriceRange, getCurrentPrice } from "@/lib/price-utils";

describe("search-filter-schema", () => {
  it("parses all new params correctly", () => {});
  it("rejects minPrice > maxPrice", () => {});
  it("rejects releaseDateFrom > releaseDateTo", () => {});
  it("coerces boolean strings correctly", () => {});
});

describe("buildSearchWhereClause", () => {
  it("adds releaseDate gte/lte", () => {});
  it("adds youtubeVideos not empty for hasVideo", () => {});
  it("adds deals some for hasDeal", () => {});
  it("adds developer/publisher JSON contains", () => {});
});

describe("platform-utils", () => {
  it("normalizes aliases correctly", () => {});
  it("maps to hardware types", () => {});
  it("builds OR where clause", () => {});
});

describe("price-utils", () => {
  it("filters by price range correctly", () => {});
  it("excludes reviews without price when filter active", () => {});
  it("prefers deal price over regular price", () => {});
});
```

---

### PKG-9: Integration-Tests (`tests/api/search-advanced-filters.test.ts`)

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { GET } from "@/app/api/reviews/search/route";

describe("GET /api/reviews/search - Advanced Filters", () => {
  beforeAll(async () => {
    // Seed Test-Daten: 20 Reviews mit variierten Attributen
  });
  
  it("filters by releaseDateFrom", async () => {});
  it("filters by releaseDateTo", async () => {});
  it("filters by releaseDateFrom + releaseDateTo range", async () => {});
  it("filters by minPrice", async () => {});
  it("filters by maxPrice", async () => {});
  it("filters by minPrice + maxPrice range", async () => {});
  it("filters by platforms (PC, PS5)", async () => {});
  it("filters by hasVideo=true", async () => {});
  it("filters by hasDeal=true", async () => {});
  it("filters by developer (ILIKE)", async () => {});
  it("filters by publisher (ILIKE)", async () => {});
  it("combines all filters (AND)", async () => {});
  it("respects pagination with filters", async () => {});
  it("respects sort=relevance with filters", async () => {});
  it("returns 400 for invalid date format", async () => {});
  it("returns 400 for minPrice > maxPrice", async () => {});
  it("ignores unknown platforms", async () => {});
  it("feature flag false ignores new params", async () => {});
});
```

---

### PKG-10: E2E-Tests & Seed-Daten

**Seed-Daten erweitern (`prisma/seed.ts`):**
- 5 Reviews mit `releaseDate` 2023, 5 mit 2024, 5 mit 2025
- 5 Reviews mit `PriceHistory` (10€, 30€, 50€, 80€, 150€)
- 3 Reviews mit aktiven `Deal` (unterschiedliche Preise)
- 4 Reviews mit `youtubeVideos` (1–3 Videos)
- 3 Hardware-Reviews mit `hardware.msrp` und `hardware.type`
- Reviews mit `metadata: { developer: "CD Projekt", publisher: "Bandai", platforms: ["PC", "PS5"] }`

**E2E-Tests (Playwright):**
- `tests/e2e/search-advanced-filters.test.ts`
- Critical Paths: Datum-Range, Preis-Range, Plattform, Video, Deal, Kombiniert, URL-Sharing, Reset

---

### PKG-11: Doku & Flag

- `CHANGELOG.md`: `[Added] Advanced Search Filters (Release-Datum, Preis, Plattform, Video, Deal, Developer/Publisher)`
- `README.md`: Search-Sektion um neue Filter erweitern
- `.env.example`: `FEATURE_ADVANCED_SEARCH_FILTERS=true`
- `ROADMAP.md`: Feature als `erledigt` markieren
- `PROGRESS.md`: Aktuellen Stand dokumentieren

---

## 6. Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Preis-Filter Performance (Joins) | Mittel | Hoch | Raw SQL Batch-Query, Indizes prüfen, EXPLAIN ANALYZEN |
| JSON-Contains auf `metadata` langsam | Mittel | Mittel | GIN-Index auf `metadata` nachträglich, falls nötig |
| UI zu überladen (viele Filter) | Niedrig | Mittel | Progressive Disclosure, Mobile-First, Usability-Test |
| Breaking Change für bestehende API-Consumer | Niedrig | Hoch | Alle Parameter optional, Default-Verhalten identisch |
| Feature-Flag vergisst Client-seitige Prüfung | Niedrig | Mittel | E2E-Test mit Flag=false, Code-Review Checkliste |

---

## 7. Abhängigkeiten & Reihenfolge

```
PKG-1 (Types/Schema)
    ├── PKG-2 (Platform Utils)
    ├── PKG-3 (Price Utils)
    │       └── PKG-4 (API Route) ◄── PKG-2, PKG-3
    ├── PKG-5 (Client Hook)
    │       └── PKG-6 (UI SearchFilters) ◄── PKG-5, PKG-2
    │             └── PKG-7 (Feature Flag)
    ├── PKG-8 (Unit Tests) ◄── PKG-1,2,3
    ├── PKG-9 (Integration Tests) ◄── PKG-4
    ├── PKG-10 (E2E + Seed) ◄── PKG-8,9
    └── PKG-11 (Doku) ◄── PKG-10
```

**Kritischer Pfad:** PKG-1 → PKG-2/3 → PKG-4 → PKG-6 → PKG-7 → PKG-9 → PKG-10 → PKG-11

---

## 8. Definition of Done (Design Phase)

- [ ] Spec vollständig gelesen und verstanden
- [ ] Alle 11 Arbeitspakete definiert mit klaren Schnittstellen
- [ ] Bestehende Komponenten identifiziert und Wiederverwendung geplant
- [ ] Risiken bewertet, Mitigation geplant
- [ ] Abhängigkeitsgraph erstellt
- [ ] Geschätzter Gesamtaufwand: ~9h
- [ ] Commit `docs(feature): design advanced-search-filters` → push