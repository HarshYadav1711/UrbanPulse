"""Clean, aggregate, and derive city-level air quality metrics."""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from statistics import mean

# Conservative quality gates
MIN_OBSERVATION_COVERAGE = 0.50  # exclude city if <50% hourly values present
MAX_PM25_SANITY = 500.0  # discard hourly values above this (µg/m³)
WHO_EXCELLENT = 5.0
WHO_MODERATE = 15.0
WHO_ELEVATED = 35.0


@dataclass
class CityQualityStats:
    city_id: str
    hours_total: int = 0
    hours_valid: int = 0
    hours_missing: int = 0
    hours_discarded_sanity: int = 0
    duplicate_timestamps_merged: int = 0
    excluded: bool = False
    exclusion_reason: str | None = None


@dataclass
class TransformResult:
    city_records: list[dict] = field(default_factory=list)
    monthly_rows: list[dict] = field(default_factory=list)
    quality_by_city: dict[str, CityQualityStats] = field(default_factory=dict)
    excluded_cities: list[dict] = field(default_factory=list)


def who_band(pm25: float) -> str:
    if pm25 <= WHO_EXCELLENT:
        return "excellent"
    if pm25 <= WHO_MODERATE:
        return "moderate"
    if pm25 <= WHO_ELEVATED:
        return "elevated"
    return "high"


def risk_label(band: str) -> str:
    return {
        "excellent": "Low exposure risk",
        "moderate": "Watch — above WHO target",
        "elevated": "Elevated — policy attention",
        "high": "High — public health priority",
    }[band]


def normalize_timestamp(ts: str) -> str:
    """Normalize to UTC ISO8601 hour: YYYY-MM-DDTHH:00:00Z"""
    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    return dt.strftime("%Y-%m-%dT%H:00:00Z")


def dedupe_hourly(
    times: list[str], values: list[float | None]
) -> tuple[dict[str, list[float]], int]:
    """
    Merge duplicate timestamps by averaging valid values at the same hour.
    Returns mapping hour -> list of valid readings (usually length 1).
    """
    buckets: dict[str, list[float]] = defaultdict(list)
    duplicates = 0
    for t, v in zip(times, values):
        if v is None:
            continue
        key = normalize_timestamp(t)
        if key in buckets:
            duplicates += 1
        buckets[key].append(float(v))
    return buckets, duplicates


def clean_hourly(buckets: dict[str, list[float]], stats: CityQualityStats) -> dict[str, float]:
    """Average duplicates; discard sanity outliers; do not impute missing hours."""
    cleaned: dict[str, float] = {}
    for hour, readings in sorted(buckets.items()):
        avg = mean(readings)
        if avg > MAX_PM25_SANITY:
            stats.hours_discarded_sanity += 1
            continue
        cleaned[hour] = round(avg, 3)
    return cleaned


def aggregate_daily(hourly: dict[str, float]) -> dict[str, float]:
    buckets: dict[str, list[float]] = defaultdict(list)
    for hour, val in hourly.items():
        day = hour[:10]
        buckets[day].append(val)
    return {d: round(mean(vals), 3) for d, vals in sorted(buckets.items())}


def aggregate_monthly(daily: dict[str, float]) -> list[dict]:
    buckets: dict[str, list[float]] = defaultdict(list)
    for day, val in daily.items():
        month = day[:7]
        buckets[month].append(val)
    return [{"month": m, "pm25": round(mean(vals), 2)} for m, vals in sorted(buckets.items())]


def window_mean(daily: dict[str, float], last_n_days: int) -> float | None:
    if not daily:
        return None
    days = sorted(daily.keys())
    slice_days = days[-last_n_days:]
    vals = [daily[d] for d in slice_days]
    if len(vals) < max(7, last_n_days // 4):
        return None
    return round(mean(vals), 2)


def rolling_daily_series(daily: dict[str, float], window: int = 90) -> list[dict]:
    """Trailing rolling mean over calendar days (requires full window)."""
    days = sorted(daily.keys())
    out: list[dict] = []
    for i in range(window - 1, len(days)):
        window_days = days[i - window + 1 : i + 1]
        vals = [daily[d] for d in window_days]
        out.append({"date": days[i], "pm25Rolling90Day": round(mean(vals), 2)})
    return out


def compute_trend_pct(monthly: list[dict]) -> float:
    """Compare mean of last 3 complete months vs prior 3 months."""
    if len(monthly) < 4:
        return 0.0
    recent = monthly[-3:]
    prior = monthly[-6:-3] if len(monthly) >= 6 else monthly[:-3]
    if not prior:
        return 0.0
    recent_avg = mean(m["pm25"] for m in recent)
    prior_avg = mean(m["pm25"] for m in prior)
    if prior_avg == 0:
        return 0.0
    return round(((recent_avg - prior_avg) / prior_avg) * 100, 1)


def rank_adjustment(livability_rank: int, pm25: float) -> int:
    band = who_band(pm25)
    penalty = {"excellent": -2, "moderate": 0, "elevated": 4, "high": 8}[band]
    return max(1, livability_rank + penalty)


def transform_city(city: dict, times: list[str], values: list[float | None]) -> tuple[dict | None, CityQualityStats]:
    stats = CityQualityStats(city_id=city["id"])
    stats.hours_total = len(times)

    if not times:
        stats.excluded = True
        stats.exclusion_reason = "No observations returned from source"
        return None, stats

    buckets, dupes = dedupe_hourly(times, values)
    stats.duplicate_timestamps_merged = dupes
    stats.hours_missing = stats.hours_total - len([v for v in values if v is not None])

    hourly_clean = clean_hourly(buckets, stats)
    stats.hours_valid = len(hourly_clean)

    coverage = stats.hours_valid / stats.hours_total if stats.hours_total else 0
    if coverage < MIN_OBSERVATION_COVERAGE:
        stats.excluded = True
        stats.exclusion_reason = f"Coverage {coverage:.1%} below {MIN_OBSERVATION_COVERAGE:.0%} threshold"
        return None, stats

    daily = aggregate_daily(hourly_clean)
    monthly = aggregate_monthly(daily)
    if not monthly:
        stats.excluded = True
        stats.exclusion_reason = "No monthly aggregates after cleaning"
        return None, stats

    pm25_window_mean = round(mean(hourly_clean.values()), 2)
    pm25_rolling_90 = window_mean(daily, 90) or pm25_window_mean
    trend_pct = compute_trend_pct(monthly)
    band = who_band(pm25_window_mean)
    effective = rank_adjustment(city["livabilityRank"], pm25_window_mean)

    period_start = min(hourly_clean.keys())[:10]
    period_end = max(hourly_clean.keys())[:10]

    record = {
        "id": city["id"],
        "name": city["canonicalName"],
        "country": city["country"],
        "region": city["region"],
        "lat": city["lat"],
        "lon": city["lon"],
        "livabilityScore": city["livabilityScore"],
        "livabilityRank": city["livabilityRank"],
        "airQuality": {
            "pm25AnnualMean": pm25_window_mean,
            "pm25Rolling90Day": pm25_rolling_90,
            "observationCoverage": round(coverage, 4),
            "whoBand": band,
            "riskLabel": risk_label(band),
            "trendPercent3Mo": trend_pct,
            "monthlySeries": monthly,
            "effectiveRank": effective,
            "rankDelta": effective - city["livabilityRank"],
            "dataSource": "Copernicus CAMS via Open-Meteo Air Quality API",
            "periodStart": period_start,
            "periodEnd": period_end,
        },
    }
    return record, stats


def transform_all(registry: list[dict], raw_series: list) -> TransformResult:
    result = TransformResult()
    raw_by_id = {s.city_id: s for s in raw_series}

    for city in registry:
        raw = raw_by_id.get(city["id"])
        if raw is None or raw.error:
            stats = CityQualityStats(
                city_id=city["id"],
                excluded=True,
                exclusion_reason=raw.error if raw else "Missing acquisition result",
            )
            result.excluded_cities.append({"id": city["id"], "name": city["canonicalName"], "reason": stats.exclusion_reason})
            result.quality_by_city[city["id"]] = stats
            print(f"  exclude - {city['canonicalName']}: {stats.exclusion_reason}")
            continue

        record, stats = transform_city(city, raw.times, raw.values)
        result.quality_by_city[city["id"]] = stats

        if record is None:
            result.excluded_cities.append(
                {"id": city["id"], "name": city["canonicalName"], "reason": stats.exclusion_reason}
            )
            print(f"  exclude - {city['canonicalName']}: {stats.exclusion_reason}")
            continue

        result.city_records.append(record)
        for row in record["airQuality"]["monthlySeries"]:
            result.monthly_rows.append(
                {
                    "city_id": city["id"],
                    "city_name": city["canonicalName"],
                    "month": row["month"],
                    "pm25_monthly_mean": row["pm25"],
                }
            )
        print(f"  ok - {city['canonicalName']} - coverage {stats.hours_valid}/{stats.hours_total}")

    return result
