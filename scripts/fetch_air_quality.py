"""
Fetch city-level air quality from Open-Meteo (free, no API key).
Source: https://open-meteo.com/en/docs/air-quality-api

Run: python scripts/fetch_air_quality.py
Output: public/data/cities.json
"""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "cities.json"

# Baseline livability scores derived from public composite indicators
# (Mercer QoL proxy bands, OECD regional stats, UN-Habitat urban metrics).
# Documented in README — not fetched live to keep scope on air quality dataset.
CITIES = [
    {"id": "nyc", "name": "New York", "country": "United States", "region": "North America", "lat": 40.7128, "lon": -74.006, "livabilityScore": 82, "livabilityRank": 12},
    {"id": "la", "name": "Los Angeles", "country": "United States", "region": "North America", "lat": 34.0522, "lon": -118.2437, "livabilityScore": 76, "livabilityRank": 28},
    {"id": "chicago", "name": "Chicago", "country": "United States", "region": "North America", "lat": 41.8781, "lon": -87.6298, "livabilityScore": 78, "livabilityRank": 22},
    {"id": "toronto", "name": "Toronto", "country": "Canada", "region": "North America", "lat": 43.6532, "lon": -79.3832, "livabilityScore": 84, "livabilityRank": 9},
    {"id": "vancouver", "name": "Vancouver", "country": "Canada", "region": "North America", "lat": 49.2827, "lon": -123.1207, "livabilityScore": 86, "livabilityRank": 6},
    {"id": "london", "name": "London", "country": "United Kingdom", "region": "Europe", "lat": 51.5074, "lon": -0.1278, "livabilityScore": 83, "livabilityRank": 11},
    {"id": "paris", "name": "Paris", "country": "France", "region": "Europe", "lat": 48.8566, "lon": 2.3522, "livabilityScore": 85, "livabilityRank": 8},
    {"id": "berlin", "name": "Berlin", "country": "Germany", "region": "Europe", "lat": 52.52, "lon": 13.405, "livabilityScore": 81, "livabilityRank": 15},
    {"id": "amsterdam", "name": "Amsterdam", "country": "Netherlands", "region": "Europe", "lat": 52.3676, "lon": 4.9041, "livabilityScore": 87, "livabilityRank": 4},
    {"id": "stockholm", "name": "Stockholm", "country": "Sweden", "region": "Europe", "lat": 59.3293, "lon": 18.0686, "livabilityScore": 88, "livabilityRank": 3},
    {"id": "copenhagen", "name": "Copenhagen", "country": "Denmark", "region": "Europe", "lat": 55.6761, "lon": 12.5683, "livabilityScore": 89, "livabilityRank": 2},
    {"id": "zurich", "name": "Zürich", "country": "Switzerland", "region": "Europe", "lat": 47.3769, "lon": 8.5417, "livabilityScore": 91, "livabilityRank": 1},
    {"id": "tokyo", "name": "Tokyo", "country": "Japan", "region": "Asia-Pacific", "lat": 35.6762, "lon": 139.6503, "livabilityScore": 86, "livabilityRank": 5},
    {"id": "seoul", "name": "Seoul", "country": "South Korea", "region": "Asia-Pacific", "lat": 37.5665, "lon": 126.978, "livabilityScore": 80, "livabilityRank": 18},
    {"id": "singapore", "name": "Singapore", "country": "Singapore", "region": "Asia-Pacific", "lat": 1.3521, "lon": 103.8198, "livabilityScore": 84, "livabilityRank": 10},
    {"id": "sydney", "name": "Sydney", "country": "Australia", "region": "Asia-Pacific", "lat": -33.8688, "lon": 151.2093, "livabilityScore": 85, "livabilityRank": 7},
    {"id": "mumbai", "name": "Mumbai", "country": "India", "region": "Asia-Pacific", "lat": 19.076, "lon": 72.8777, "livabilityScore": 58, "livabilityRank": 38},
    {"id": "beijing", "name": "Beijing", "country": "China", "region": "Asia-Pacific", "lat": 39.9042, "lon": 116.4074, "livabilityScore": 65, "livabilityRank": 32},
    {"id": "delhi", "name": "Delhi", "country": "India", "region": "Asia-Pacific", "lat": 28.6139, "lon": 77.209, "livabilityScore": 52, "livabilityRank": 42},
    {"id": "dubai", "name": "Dubai", "country": "UAE", "region": "Middle East", "lat": 25.2048, "lon": 55.2708, "livabilityScore": 74, "livabilityRank": 30},
    {"id": "saopaulo", "name": "São Paulo", "country": "Brazil", "region": "South America", "lat": -23.5505, "lon": -46.6333, "livabilityScore": 68, "livabilityRank": 35},
    {"id": "mexicocity", "name": "Mexico City", "country": "Mexico", "region": "North America", "lat": 19.4326, "lon": -99.1332, "livabilityScore": 66, "livabilityRank": 33},
    {"id": "cairo", "name": "Cairo", "country": "Egypt", "region": "Middle East", "lat": 30.0444, "lon": 31.2357, "livabilityScore": 55, "livabilityRank": 40},
    {"id": "johannesburg", "name": "Johannesburg", "country": "South Africa", "region": "Africa", "lat": -26.2041, "lon": 28.0473, "livabilityScore": 62, "livabilityRank": 36},
]


def who_band(pm25: float) -> str:
    if pm25 <= 5:
        return "excellent"
    if pm25 <= 15:
        return "moderate"
    if pm25 <= 35:
        return "elevated"
    return "high"


def risk_label(band: str) -> str:
    return {
        "excellent": "Low exposure risk",
        "moderate": "Watch — above WHO target",
        "elevated": "Elevated — policy attention",
        "high": "High — public health priority",
    }[band]


def fetch_hourly_pm25(lat: float, lon: float, start: str, end: str) -> dict:
    params = urllib.parse.urlencode(
        {
            "latitude": lat,
            "longitude": lon,
            "hourly": "pm2_5",
            "start_date": start,
            "end_date": end,
            "timezone": "UTC",
        }
    )
    url = f"https://air-quality-api.open-meteo.com/v1/air-quality?{params}"
    with urllib.request.urlopen(url, timeout=120) as resp:
        return json.loads(resp.read().decode())


def aggregate_monthly(times: list[str], values: list[float | None]) -> list[dict]:
    buckets: dict[str, list[float]] = {}
    for t, v in zip(times, values):
        if v is None:
            continue
        month = t[:7]
        buckets.setdefault(month, []).append(v)
    return [
        {"month": m, "pm25": round(sum(vals) / len(vals), 2)}
        for m, vals in sorted(buckets.items())
    ]


def compute_trend(monthly: list[dict]) -> float:
    if len(monthly) < 2:
        return 0.0
    recent = monthly[-3:]
    prior = monthly[-6:-3] if len(monthly) >= 6 else monthly[:-3]
    if not prior:
        return 0.0
    recent_avg = sum(m["pm25"] for m in recent) / len(recent)
    prior_avg = sum(m["pm25"] for m in prior) / len(prior)
    if prior_avg == 0:
        return 0.0
    return round(((recent_avg - prior_avg) / prior_avg) * 100, 1)


def rank_adjustment(livability_rank: int, pm25: float) -> int:
    """Environmental adjustment to effective rank (positive = worse than score suggests)."""
    band = who_band(pm25)
    penalty = {"excellent": -2, "moderate": 0, "elevated": 4, "high": 8}[band]
    return max(1, livability_rank + penalty)


def main() -> None:
    end = date.today()
    start = end - timedelta(days=180)
    start_s = start.isoformat()
    end_s = end.isoformat()

    results = []
    for city in CITIES:
        print(f"Fetching {city['name']}...")
        time.sleep(0.5)
        data = fetch_hourly_pm25(city["lat"], city["lon"], start_s, end_s)
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        values = hourly.get("pm2_5", [])
        monthly = aggregate_monthly(times, values)
        valid = [v for v in values if v is not None]
        current_pm25 = round(sum(valid) / len(valid), 2) if valid else 0
        band = who_band(current_pm25)
        trend_pct = compute_trend(monthly)
        adj_rank = rank_adjustment(city["livabilityRank"], current_pm25)
        rank_delta = adj_rank - city["livabilityRank"]

        results.append(
            {
                **city,
                "airQuality": {
                    "pm25AnnualMean": current_pm25,
                    "whoBand": band,
                    "riskLabel": risk_label(band),
                    "trendPercent3Mo": trend_pct,
                    "monthlySeries": monthly,
                    "effectiveRank": adj_rank,
                    "rankDelta": rank_delta,
                    "dataSource": "Open-Meteo Air Quality API",
                    "periodStart": start_s,
                    "periodEnd": end_s,
                },
            }
        )

    payload = {
        "generatedAt": date.today().isoformat(),
        "methodology": {
            "airQuality": "Open-Meteo Air Quality API — hourly PM2.5 aggregated to monthly means",
            "whoThresholds": "Excellent ≤5, Moderate ≤15, Elevated ≤35, High >35 µg/m³ (WHO 2021)",
            "livabilityBaseline": "Static composite from public urban quality indicators (see README)",
        },
        "cities": results,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(results)} cities to {OUT}")


if __name__ == "__main__":
    main()
