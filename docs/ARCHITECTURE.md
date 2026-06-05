# UrbanPulse — Architecture

## 1. User problem

City ranking dashboards (livability indices, quality-of-life scores) help compare metros, but they rarely surface **environmental exposure** — the air citizens actually breathe. A planner comparing two cities ranked #8 and #12 cannot see that one exceeds WHO PM2.5 targets by 3×, or that a “top 10” city’s recent trend is worsening.

**UrbanPulse solves:** overlay public air-quality intelligence on a baseline city ranking so citizens and municipal decision-makers can spot rank–exposure mismatches, regional gaps, and trend risk — without a paid data vendor or backend.

---

## 2. Selected public dataset

| Attribute | Value |
|-----------|--------|
| **Institutional source** | [Copernicus Atmosphere Monitoring Service (CAMS)](https://atmosphere.copernicus.eu/) — EU ECMWF-operated atmospheric composition service |
| **Acquisition gateway** | [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (free, no API key) |
| **Variable** | Hourly PM2.5 (µg/m³) at city centroid coordinates |
| **Documentation** | [`docs/DATA_SOURCE.md`](DATA_SOURCE.md) · quality note [`docs/DATA_QUALITY.md`](DATA_QUALITY.md) |

**Secondary (static baseline):** Livability rank and score per city — compiled once from public indicator bands (OECD, UN-Habitat, Mercer QoL ranges). Not fetched live; documented in pipeline README. Keeps the **environmental** dataset auditable as the single dynamic source.

---

## 3. Data model

### Entities

```
CitiesDataset
├── generatedAt: ISO date
├── methodology: { airQuality, whoThresholds, livabilityBaseline }
└── cities: CityRecord[]

CityRecord
├── id, name, country, region
├── lat, lon
├── livabilityScore, livabilityRank
└── airQuality: AirQuality

AirQuality
├── pm25AnnualMean
├── whoBand: excellent | moderate | elevated | high
├── riskLabel
├── trendPercent3Mo
├── monthlySeries: { month, pm25 }[]
├── effectiveRank, rankDelta
├── dataSource, periodStart, periodEnd
```

### Field semantics

| Field | Type | Meaning |
|-------|------|---------|
| `pm25AnnualMean` | number | Mean PM2.5 over observation window |
| `whoBand` | enum | WHO 2021 tier: ≤5 / ≤15 / ≤35 / >35 µg/m³ |
| `trendPercent3Mo` | number | % change: recent 3-mo avg vs prior 3-mo |
| `effectiveRank` | number | Baseline rank adjusted for exposure band |
| `rankDelta` | number | `effectiveRank − livabilityRank` (positive = worse after env) |
| `monthlySeries` | array | `YYYY-MM` → monthly mean PM2.5 for trends |

**Single source of truth (runtime):** `public/data/cities.json`  
**Single source of truth (contract):** `src/lib/schema.ts` (Zod) — all loaders validate against this.

---

## 4. Transformation pipeline

```
Copernicus CAMS (via Open-Meteo Air Quality API)
        │
        ▼
scripts/ingest/acquire.py
  • Hourly pm2_5 per city centroid (config registry)
        │
        ▼
scripts/ingest/transform.py
  • Normalize timestamps (UTC)
  • Dedupe hours · discard sanity outliers · no imputation
  • Aggregate daily → monthly · window mean · 90-day rolling
  • WHO band · trend · effective rank
        │
        ▼
scripts/ingest/build.py
  • public/data/cities.json + cities.csv + data_quality.json
  • docs/DATA_QUALITY.md (auto-generated)
        │
        ▼
src/lib/cities.ts
  • Read JSON (server) or fetch (client future)
  • Validate with schema.ts (Zod)
  • Export typed CitiesDataset
        │
        ▼
React app shell (panels consume CityRecord[])
```

**Reproduce:** `npm run data:fetch` or `python scripts/ingest/build.py`

---

## 5. Minimal prototype screens

| Screen | Purpose | Shell component |
|--------|---------|-----------------|
| **Overview** | Cohort summary + intelligence brief | `AppShell` → metric + insight card slots |
| **Compare** | Baseline vs env-adjusted ranking | Compare panel (table TBD) |
| **Trends** | Monthly PM2.5 vs WHO target | `TrendPanelShell` |
| **Map** | Geospatial exposure view | `MapPanelShell` |

No auth, no backend, no LLM. One page (`/`) with anchored sections.

---

## Folder structure

```
UrbanPulse/
├── docs/
│   └── ARCHITECTURE.md          ← this file
├── public/
│   └── data/
│       └── cities.json          ← validated app data (SSOT on disk)
├── scripts/
│   ├── config/
│   │   └── cities_registry.json ← canonical city names + coordinates
│   └── ingest/
│       ├── acquire.py           ← CAMS via Open-Meteo HTTP
│       ├── transform.py         ← clean · aggregate · metrics
│       └── build.py             ← CLI entry · JSON/CSV export
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   └── SiteHeader.tsx
│   │   ├── ui/
│   │   │   ├── Panel.tsx
│   │   │   └── StatePlaceholder.tsx
│   │   ├── cards/
│   │   │   ├── MetricCard.tsx
│   │   │   └── InsightCard.tsx
│   │   ├── trends/
│   │   │   └── TrendPanel.tsx
│   │   └── map/
│   │       └── MapPanel.tsx
│   └── lib/
│       ├── schema.ts            ← data contract (Zod)
│       ├── cities.ts            ← load + validate
│       ├── constants.ts         ← WHO bands, display tokens
│       └── format.ts              ← formatters
├── package.json
└── README.md
```

---

## Next steps (after contract sign-off)

1. Wire `TrendPanel` to Recharts using `monthlySeries`
2. Wire `MapPanel` to react-leaflet using `lat/lon` + `whoBand`
3. Implement compare table with rank toggle
4. Replace insight card placeholders with computed briefs

Do not extend until `schema.ts` and sample `cities.json` pass validation in CI.
