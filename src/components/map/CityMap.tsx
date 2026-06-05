"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { CityRecord, WhoBand } from "@/lib/schema";
import { WHO_BAND_META } from "@/lib/constants";
import { formatPm25 } from "@/lib/format";
import { WhoBandBadge } from "@/components/ui/WhoBandBadge";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import "leaflet/dist/leaflet.css";

interface CityMapProps {
  cities: CityRecord[];
}

function FitBounds({ cities }: { cities: CityRecord[] }) {
  const map = useMap();

  useEffect(() => {
    if (cities.length === 0) return;
    const lats = cities.map((c) => c.lat);
    const lons = cities.map((c) => c.lon);
    map.fitBounds(
      [
        [Math.min(...lats) - 5, Math.min(...lons) - 10],
        [Math.max(...lats) + 5, Math.max(...lons) + 10],
      ],
      { padding: [24, 24] }
    );
  }, [cities, map]);

  return null;
}

function markerRadius(band: WhoBand): number {
  switch (band) {
    case "excellent":
      return 7;
    case "moderate":
      return 8;
    case "elevated":
      return 10;
    case "high":
      return 12;
  }
}

export function CityMap({ cities }: CityMapProps) {
  const center = useMemo(() => {
    const lat = cities.reduce((s, c) => s + c.lat, 0) / cities.length;
    const lon = cities.reduce((s, c) => s + c.lon, 0) / cities.length;
    return [lat, lon] as [number, number];
  }, [cities]);

  return (
    <div className="h-80 w-full overflow-hidden rounded-lg border border-[var(--line)]">
      <MapContainer
        center={center}
        zoom={2}
        scrollWheelZoom={false}
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds cities={cities} />
        {cities.map((city) => {
          const band = WHO_BAND_META[city.airQuality.whoBand];
          return (
            <CircleMarker
              key={city.id}
              center={[city.lat, city.lon]}
              radius={markerRadius(city.airQuality.whoBand)}
              pathOptions={{
                color: band.mapColor,
                fillColor: band.mapColor,
                fillOpacity: 0.75,
                weight: 2,
              }}
            >
              <Popup>
                <div className="min-w-[180px] space-y-2 text-xs">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{city.name}</p>
                    <p className="text-[var(--ink-muted)]">{city.country}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold">
                      {formatPm25(city.airQuality.pm25AnnualMean)}
                    </span>
                    <WhoBandBadge band={city.airQuality.whoBand} />
                  </div>
                  <p className="text-[var(--ink-muted)]">{city.airQuality.riskLabel}</p>
                  <TrendIndicator percent={city.airQuality.trendPercent3Mo} />
                  <p className="border-t border-[var(--line)] pt-2 text-[var(--ink-muted)]">
                    Rank #{city.livabilityRank} → #{city.airQuality.effectiveRank}
                    {city.airQuality.rankDelta !== 0 && (
                      <span className={city.airQuality.rankDelta > 0 ? " text-rose-600" : " text-emerald-600"}>
                        {" "}({city.airQuality.rankDelta > 0 ? "+" : ""}
                        {city.airQuality.rankDelta})
                      </span>
                    )}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
