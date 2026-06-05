"""Fetch hourly PM2.5 from Open-Meteo (Copernicus CAMS delivery gateway)."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date

CAMS_GATEWAY = "https://air-quality-api.open-meteo.com/v1/air-quality"
USER_AGENT = "UrbanPulse/1.0 (research prototype; +https://github.com/urbanpulse)"
REQUEST_DELAY_SEC = 0.6


@dataclass
class RawObservationSeries:
    city_id: str
    times: list[str]
    values: list[float | None]
    source_url: str
    error: str | None = None


def build_request_url(lat: float, lon: float, start: str, end: str) -> str:
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
    return f"{CAMS_GATEWAY}?{params}"


def fetch_hourly_pm25(
    city_id: str,
    lat: float,
    lon: float,
    start: date,
    end: date,
    *,
    retries: int = 3,
) -> RawObservationSeries:
    start_s = start.isoformat()
    end_s = end.isoformat()
    url = build_request_url(lat, lon, start_s, end_s)

    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=120) as resp:
                payload = json.loads(resp.read().decode())
            hourly = payload.get("hourly", {})
            return RawObservationSeries(
                city_id=city_id,
                times=list(hourly.get("time", [])),
                values=list(hourly.get("pm2_5", [])),
                source_url=url,
            )
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
            if attempt == retries - 1:
                return RawObservationSeries(
                    city_id=city_id,
                    times=[],
                    values=[],
                    source_url=url,
                    error=str(exc),
                )
            time.sleep(2 ** attempt)

    return RawObservationSeries(city_id=city_id, times=[], values=[], source_url=url, error="unknown")


def fetch_all_cities(registry: list[dict], start: date, end: date) -> list[RawObservationSeries]:
    results: list[RawObservationSeries] = []
    for city in registry:
        print(f"  acquire - {city['canonicalName']} ...")
        series = fetch_hourly_pm25(city["id"], city["lat"], city["lon"], start, end)
        results.append(series)
        time.sleep(REQUEST_DELAY_SEC)
    return results
