# Methodology — dataset and cleaning pipeline

*Companion to the auto-generated [`DATA_QUALITY.md`](DATA_QUALITY.md) report.*

---

## Scope

UrbanPulse treats **one dynamic public dataset** as the environmental source of truth: hourly PM2.5 from Copernicus CAMS, delivered through the Open-Meteo Air Quality API. Everything else in the app—livability rank, score, city names, coordinates—comes from a static registry compiled once and version-controlled.

That separation keeps the pipeline auditable. You can re-run acquisition, inspect what was discarded, and compare output files without touching the UI.

---

## Acquisition

For each of 24 cities in `scripts/config/cities_registry.json`:

1. Request hourly `pm2_5` at the city's centroid `(lat, lon)`
2. Use a 365-day observation window ending on the build date
3. Set `timezone=UTC` so timestamps align across geographies
4. Wait 0.6 s between requests (polite rate limiting)
5. Optionally cache raw JSON under `data/raw/` (gitignored)

Cities with network failures or empty API responses are excluded and logged—not silently filled with defaults.

---

## Cleaning rules

Applied in `scripts/ingest/transform.py`:

| Step | Rule | Rationale |
|------|------|-----------|
| Timestamp normalization | All hours → `YYYY-MM-DDTHH:00:00Z` | Consistent UTC calendar days for aggregation |
| Duplicate hours | Average valid readings at the same timestamp | Rare API edge cases; preserve rather than drop |
| Sanity ceiling | Discard hourly values > 500 µg/m³ | Physically implausible for urban background; likely artefact |
| Missing values | Not imputed | Imputation would invent exposure the source did not provide |
| Coverage gate | Exclude city if valid hours < 50% of requested | Partial windows produce misleading annual means |

---

## Aggregation and derived metrics

From cleaned hourly values:

1. **Daily mean** — average of valid hours per UTC calendar day
2. **Monthly mean** — average of daily values per `YYYY-MM` (feeds trend chart)
3. **Window mean** (`pm25AnnualMean`) — mean of all valid hourly values in the observation period
4. **90-day rolling mean** (`pm25Rolling90Day`) — trailing daily average over the last 90 calendar days with sufficient coverage
5. **3-month trend %** (`trendPercent3Mo`) — percent change between the mean of the last 3 complete months and the prior 3 months

---

## Classification

**WHO 2021 bands** (applied to window mean PM2.5):

| Band | Threshold (µg/m³) |
|------|-------------------|
| Excellent | ≤ 5 |
| Moderate | ≤ 15 |
| Elevated | ≤ 35 |
| High | > 35 |

**Effective rank** adjusts baseline livability rank by exposure band:

| Band | Rank adjustment |
|------|-----------------|
| Excellent | −2 |
| Moderate | 0 |
| Elevated | +4 |
| High | +8 |

`rankDelta = effectiveRank − livabilityRank`. A positive delta means environmental exposure pushes the city down relative to its headline ranking.

**Trend status** (UI layer, `src/lib/status.ts`):

- Improving: 3-month trend ≤ −5%
- Worsening: 3-month trend ≥ +5%
- Stable: between those bounds

---

## Outputs

`scripts/ingest/build.py` writes:

| File | Contents |
|------|----------|
| `public/data/cities.json` | Nested dataset validated by `src/lib/schema.ts` |
| `public/data/cities.csv` | Flat export for spreadsheet audit |
| `public/data/data_quality.json` | Per-city hour counts, exclusions, assumptions |
| `docs/DATA_QUALITY.md` | Human-readable summary of the latest build |

The Next.js app loads `cities.json` at request time and refuses to render if the Zod contract fails.

---

## Assumptions and limits

- **Point estimate:** Each city is represented by a single centroid coordinate. Intra-city variation (industrial corridors vs. parks) is not captured.
- **Model data:** CAMS concentrations are reanalysis/model output, not ground-truth monitor readings. Appropriate for relative comparison; not for compliance.
- **Static baseline:** Livability scores do not update when air quality is refreshed. Rank adjustments reflect exposure only.
- **No forecasting:** Trends describe recent historical change, not projected future levels.

---

## Reproduce

```bash
npm run data:fetch
# or
python scripts/ingest/build.py --days 365
```

Compare the generated `docs/DATA_QUALITY.md` with the previous version to verify coverage and exclusion counts.
