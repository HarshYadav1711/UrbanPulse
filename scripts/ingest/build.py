#!/usr/bin/env python3
"""
UrbanPulse dataset builder — acquire CAMS PM2.5, transform, export.

Usage: python scripts/ingest/build.py [--days 365]
Outputs:
  public/data/cities.json
  public/data/cities.csv
  public/data/data_quality.json
  docs/DATA_QUALITY.md
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
REGISTRY_PATH = ROOT / "scripts" / "config" / "cities_registry.json"
OUT_JSON = ROOT / "public" / "data" / "cities.json"
OUT_CSV = ROOT / "public" / "data" / "cities.csv"
OUT_QUALITY_JSON = ROOT / "public" / "data" / "data_quality.json"
OUT_QUALITY_MD = ROOT / "docs" / "DATA_QUALITY.md"

sys.path.insert(0, str(ROOT / "scripts"))

from ingest.acquire import fetch_all_cities  # noqa: E402
from ingest.transform import (  # noqa: E402
    MAX_PM25_SANITY,
    MIN_OBSERVATION_COVERAGE,
    transform_all,
)


def load_registry() -> list[dict]:
    data = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    cities = data["cities"]
    seen_ids: set[str] = set()
    for city in cities:
        if city["id"] in seen_ids:
            raise ValueError(f"Duplicate city id in registry: {city['id']}")
        seen_ids.add(city["id"])
    return cities


def write_csv(city_records: list[dict], path: Path) -> None:
    fields = [
        "id",
        "name",
        "country",
        "region",
        "lat",
        "lon",
        "livabilityScore",
        "livabilityRank",
        "pm25AnnualMean",
        "pm25Rolling90Day",
        "observationCoverage",
        "whoBand",
        "trendPercent3Mo",
        "effectiveRank",
        "rankDelta",
        "periodStart",
        "periodEnd",
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for c in city_records:
            aq = c["airQuality"]
            writer.writerow(
                {
                    "id": c["id"],
                    "name": c["name"],
                    "country": c["country"],
                    "region": c["region"],
                    "lat": c["lat"],
                    "lon": c["lon"],
                    "livabilityScore": c["livabilityScore"],
                    "livabilityRank": c["livabilityRank"],
                    "pm25AnnualMean": aq["pm25AnnualMean"],
                    "pm25Rolling90Day": aq["pm25Rolling90Day"],
                    "observationCoverage": aq["observationCoverage"],
                    "whoBand": aq["whoBand"],
                    "trendPercent3Mo": aq["trendPercent3Mo"],
                    "effectiveRank": aq["effectiveRank"],
                    "rankDelta": aq["rankDelta"],
                    "periodStart": aq["periodStart"],
                    "periodEnd": aq["periodEnd"],
                }
            )


def build_quality_report(
    generated_at: str,
    observation_days: int,
    registry_count: int,
    transform_result,
) -> dict:
    totals = {
        "hours_total": 0,
        "hours_valid": 0,
        "hours_missing": 0,
        "hours_discarded_sanity": 0,
        "duplicate_timestamps_merged": 0,
    }
    per_city = []
    for city_id, stats in transform_result.quality_by_city.items():
        totals["hours_total"] += stats.hours_total
        totals["hours_valid"] += stats.hours_valid
        totals["hours_missing"] += stats.hours_missing
        totals["hours_discarded_sanity"] += stats.hours_discarded_sanity
        totals["duplicate_timestamps_merged"] += stats.duplicate_timestamps_merged
        per_city.append(
            {
                "city_id": city_id,
                "hours_total": stats.hours_total,
                "hours_valid": stats.hours_valid,
                "hours_missing": stats.hours_missing,
                "hours_discarded_sanity": stats.hours_discarded_sanity,
                "duplicate_timestamps_merged": stats.duplicate_timestamps_merged,
                "coverage": round(stats.hours_valid / stats.hours_total, 4) if stats.hours_total else 0,
                "excluded": stats.excluded,
                "exclusion_reason": stats.exclusion_reason,
            }
        )

    return {
        "generatedAt": generated_at,
        "source": {
            "institution": "Copernicus Atmosphere Monitoring Service (CAMS)",
            "gateway": "Open-Meteo Air Quality API",
            "endpoint": "https://air-quality-api.open-meteo.com/v1/air-quality",
            "variable": "pm2_5",
        },
        "observationWindowDays": observation_days,
        "registryCities": registry_count,
        "includedCities": len(transform_result.city_records),
        "excludedCities": transform_result.excluded_cities,
        "totals": totals,
        "perCity": per_city,
        "processing": {
            "discarded": [
                f"Hourly PM2.5 > {MAX_PM25_SANITY} µg/m³ (sanity ceiling)",
                f"Cities with observation coverage < {MIN_OBSERVATION_COVERAGE:.0%}",
                "Cities with acquisition failures (network/API errors)",
                "Null/missing hourly values (not imputed)",
            ],
            "aggregated": [
                "Hourly → daily mean (UTC calendar day)",
                "Daily → monthly mean (YYYY-MM)",
                "Window mean over full observation period (pm25AnnualMean)",
                "Trailing 90-day daily rolling mean (pm25Rolling90Day)",
            ],
            "assumptions": [
                "City exposure represented by single centroid lat/lon from registry",
                "CAMS model concentrations used for cross-city comparability",
                "Duplicate timestamps averaged (rare)",
                "WHO 2021 bands applied to window mean PM2.5",
                "Trend = last 3 monthly means vs prior 3 monthly means (% change)",
                "Effective rank = baseline livability rank + exposure band penalty",
            ],
            "limitations": [
                "Model/reanalysis values — not municipal monitor readings",
                "Point estimate may not reflect intra-city variation",
                "Livability baseline is static, not co-fetched with air quality",
                "Rolling 90-day metric requires sufficient daily coverage at window start",
            ],
        },
    }


def write_quality_markdown(report: dict, path: Path) -> None:
    proc = report["processing"]
    lines = [
        "# Data quality note",
        "",
        f"*Auto-generated {report['generatedAt']} by `scripts/ingest/build.py`*",
        "",
        "## Summary",
        "",
        f"- **Source:** {report['source']['institution']} via {report['source']['gateway']}",
        f"- **Window:** {report['observationWindowDays']} days",
        f"- **Registry:** {report['registryCities']} cities · **Included:** {report['includedCities']} · **Excluded:** {len(report['excludedCities'])}",
        "",
        "## What was discarded",
        "",
    ]
    for item in proc["discarded"]:
        lines.append(f"- {item}")
    if report["excludedCities"]:
        lines.extend(["", "### Excluded cities", ""])
        for ex in report["excludedCities"]:
            lines.append(f"- **{ex['name']}** (`{ex['id']}`): {ex['reason']}")

    lines.extend(["", "## What was aggregated", ""])
    for item in proc["aggregated"]:
        lines.append(f"- {item}")

    lines.extend(["", "## Assumptions", ""])
    for item in proc["assumptions"]:
        lines.append(f"- {item}")

    lines.extend(["", "## Limitations", ""])
    for item in proc["limitations"]:
        lines.append(f"- {item}")

    lines.extend(
        [
            "",
            "## Hourly totals",
            "",
            f"| Metric | Count |",
            f"|--------|------:|",
            f"| Total hours requested | {report['totals']['hours_total']} |",
            f"| Valid after cleaning | {report['totals']['hours_valid']} |",
            f"| Missing (null from source) | {report['totals']['hours_missing']} |",
            f"| Discarded (sanity ceiling) | {report['totals']['hours_discarded_sanity']} |",
            f"| Duplicate timestamps merged | {report['totals']['duplicate_timestamps_merged']} |",
            "",
        ]
    )
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build UrbanPulse city air quality dataset")
    parser.add_argument("--days", type=int, default=365, help="Observation window in days (default 365)")
    args = parser.parse_args()

    end = date.today()
    start = end - timedelta(days=args.days)
    generated_at = end.isoformat()

    print(f"UrbanPulse dataset build - {start} to {end}")
    registry = load_registry()
    print(f"Registry: {len(registry)} cities")

    print("\n[1/3] Acquire")
    raw = fetch_all_cities(registry, start, end)

    print("\n[2/3] Transform")
    transformed = transform_all(registry, raw)

    if not transformed.city_records:
        print("\nERROR: No cities passed quality gates.", file=sys.stderr)
        sys.exit(1)

    payload = {
        "generatedAt": generated_at,
        "methodology": {
            "airQuality": "Copernicus CAMS PM2.5 via Open-Meteo — hourly observations cleaned and aggregated to city-level metrics",
            "whoThresholds": "Excellent ≤5, Moderate ≤15, Elevated ≤35, High >35 µg/m³ (WHO 2021)",
            "livabilityBaseline": "Static composite from public urban quality indicators (scripts/config/cities_registry.json)",
        },
        "cities": transformed.city_records,
    }

    quality = build_quality_report(generated_at, args.days, len(registry), transformed)

    print("\n[3/3] Export")
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    write_csv(transformed.city_records, OUT_CSV)
    OUT_QUALITY_JSON.write_text(json.dumps(quality, indent=2, ensure_ascii=False), encoding="utf-8")
    write_quality_markdown(quality, OUT_QUALITY_MD)

    print(f"  OK {OUT_JSON}")
    print(f"  OK {OUT_CSV}")
    print(f"  OK {OUT_QUALITY_JSON}")
    print(f"  OK {OUT_QUALITY_MD}")
    print(f"\nDone - {len(transformed.city_records)} cities included, {len(transformed.excluded_cities)} excluded")


if __name__ == "__main__":
    main()
