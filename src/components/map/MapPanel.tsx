import { Panel } from "@/components/ui/Panel";
import { StatePlaceholder } from "@/components/ui/StatePlaceholder";
import type { CityRecord } from "@/lib/schema";
import { WHO_BAND_META } from "@/lib/constants";
import { formatPm25 } from "@/lib/format";

interface MapPanelProps {
  cities: CityRecord[];
}

export function MapPanel({ cities }: MapPanelProps) {
  return (
    <Panel
      id="map"
      title="Exposure map"
      description="Geospatial view — Leaflet wiring pending"
    >
      <StatePlaceholder
        variant="loading"
        title="Map shell"
        message="Markers will use lat, lon, and whoBand from the data contract."
      />
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cities.slice(0, 6).map((city) => {
          const band = WHO_BAND_META[city.airQuality.whoBand];
          return (
            <li
              key={city.id}
              className="flex items-center gap-2 rounded-lg border border-[var(--line)] px-3 py-2 text-xs"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${band.swatch}`} />
              <span className="font-medium text-[var(--ink)]">{city.name}</span>
              <span className="ml-auto font-mono text-[var(--ink-muted)]">
                {formatPm25(city.airQuality.pm25AnnualMean)}
              </span>
            </li>
          );
        })}
      </ul>
      {cities.length > 6 && (
        <p className="mt-2 text-xs text-[var(--ink-muted)]">
          +{cities.length - 6} more cities in dataset
        </p>
      )}
    </Panel>
  );
}
