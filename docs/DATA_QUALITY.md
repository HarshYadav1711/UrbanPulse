# Data quality note

*Auto-generated 2026-06-06 by `scripts/ingest/build.py`*

## Summary

- **Source:** Copernicus Atmosphere Monitoring Service (CAMS) via Open-Meteo Air Quality API
- **Window:** 365 days
- **Registry:** 24 cities · **Included:** 24 · **Excluded:** 0

## What was discarded

- Hourly PM2.5 > 500.0 µg/m³ (sanity ceiling)
- Cities with observation coverage < 50%
- Cities with acquisition failures (network/API errors)
- Null/missing hourly values (not imputed)

## What was aggregated

- Hourly → daily mean (UTC calendar day)
- Daily → monthly mean (YYYY-MM)
- Window mean over full observation period (pm25AnnualMean)
- Trailing 90-day daily rolling mean (pm25Rolling90Day)

## Assumptions

- City exposure represented by single centroid lat/lon from registry
- CAMS model concentrations used for cross-city comparability
- Duplicate timestamps averaged (rare)
- WHO 2021 bands applied to window mean PM2.5
- Trend = last 3 monthly means vs prior 3 monthly means (% change)
- Effective rank = baseline livability rank + exposure band penalty

## Limitations

- Model/reanalysis values — not municipal monitor readings
- Point estimate may not reflect intra-city variation
- Livability baseline is static, not co-fetched with air quality
- Rolling 90-day metric requires sufficient daily coverage at window start

## Hourly totals

| Metric | Count |
|--------|------:|
| Total hours requested | 210816 |
| Valid after cleaning | 210816 |
| Missing (null from source) | 0 |
| Discarded (sanity ceiling) | 0 |
| Duplicate timestamps merged | 0 |
