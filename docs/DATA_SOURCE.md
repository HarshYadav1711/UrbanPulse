# Data source — UrbanPulse air quality

## Authoritative source

| Field | Value |
|-------|--------|
| **Institutional origin** | [Copernicus Atmosphere Monitoring Service (CAMS)](https://atmosphere.copernicus.eu/) — EU Earth observation programme operated by ECMWF |
| **Acquisition gateway** | [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) |
| **Endpoint** | `GET https://air-quality-api.open-meteo.com/v1/air-quality` |
| **Variable** | `pm2_5` — particulate matter ≤2.5 µm (µg/m³) |
| **Licence / cost** | Free for non-commercial use; no API key; no billing |
| **Update cadence** | CAMS global reanalysis/forecast mix; hourly granularity |

### Why this source

- **Institutional:** CAMS is the EU’s operational atmospheric composition service — not a scraped or commercial feed.
- **Global coverage:** Single consistent model at city coordinates worldwide (vs. stitching dozens of national APIs).
- **Reproducible:** Parameterised HTTP requests with documented fields; no credentials to expire.
- **Decision-relevant:** PM2.5 is the WHO’s primary urban air health indicator.

### What it is not

CAMS values at a lat/lon point are **modelled/reanalysis concentrations**, not readings from a specific municipal monitor. They are appropriate for **cross-city comparison and trend screening**, not for regulatory compliance or block-level exposure assessment.

---

## Acquisition method

```
For each city in scripts/config/cities_registry.json:
  1. Request hourly pm2_5 for (lat, lon) over OBSERVATION_DAYS (default 365)
  2. timezone=UTC for consistent timestamps
  3. Rate-limit 0.6 s between requests (polite use)
  4. Raw response cached optionally under data/raw/ (gitignored)
```

Example request:

```
https://air-quality-api.open-meteo.com/v1/air-quality
  ?latitude=51.5074
  &longitude=-0.1278
  &hourly=pm2_5
  &start_date=2025-06-06
  &end_date=2026-06-06
  &timezone=UTC
```

---

## Secondary static data (not ingested live)

**Livability baseline** (`livabilityScore`, `livabilityRank`) — compiled once from public indicator bands (OECD regional statistics, UN-Habitat urban metrics, Mercer QoL proxy ranges). Stored in the city registry; not fetched from a paid API.

---

## Regeneration

```bash
npm run data:fetch
# equivalent:
python scripts/ingest/build.py
```

Outputs:

| File | Purpose |
|------|---------|
| `public/data/cities.json` | App-ready nested dataset (validated by Zod schema) |
| `public/data/cities.csv` | Flat export for audit / spreadsheets |
| `public/data/data_quality.json` | Machine-readable quality report |
| `docs/DATA_QUALITY.md` | Human-readable quality note (auto-generated) |

---

## References

- CAMS: https://atmosphere.copernicus.eu/
- Open-Meteo docs: https://open-meteo.com/en/docs/air-quality-api
- WHO PM2.5 guidelines (2021): https://www.who.int/news-room/feature-stories/detail/what-are-the-who-air-quality-guidelines
