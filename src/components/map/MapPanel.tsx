"use client";

import dynamic from "next/dynamic";
import type { CityRecord } from "@/lib/schema";
import { WHO_BAND_META } from "@/lib/constants";
import { Panel } from "@/components/ui/Panel";
import type { WhoBand } from "@/lib/schema";

const CityMap = dynamic(
  () => import("@/components/map/CityMap").then((m) => m.CityMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-[var(--line)] bg-slate-50 text-xs text-[var(--ink-muted)]">
        Loading map…
      </div>
    ),
  }
);

interface MapPanelProps {
  cities: CityRecord[];
}

const LEGEND_BANDS: WhoBand[] = ["excellent", "moderate", "elevated", "high"];

export function MapPanel({ cities }: MapPanelProps) {
  return (
    <Panel
      id="map"
      title="Exposure map"
      description="City-centroid PM2.5 exposure — click markers for detail"
    >
      <CityMap cities={cities} />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
          WHO band
        </span>
        {LEGEND_BANDS.map((band) => {
          const meta = WHO_BAND_META[band];
          return (
            <span key={band} className="flex items-center gap-1.5 text-xs text-[var(--ink-muted)]">
              <span className={`h-2.5 w-2.5 rounded-full ${meta.swatch}`} />
              {meta.label}
            </span>
          );
        })}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[var(--ink-muted)]">
        Marker size reflects exposure severity. Data represents city-centroid model estimates from
        Copernicus CAMS — not individual monitoring stations.
      </p>
    </Panel>
  );
}
