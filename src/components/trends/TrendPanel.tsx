import { Panel } from "@/components/ui/Panel";
import { StatePlaceholder } from "@/components/ui/StatePlaceholder";
import type { CityRecord } from "@/lib/schema";
import { formatMonthLabel } from "@/lib/format";

interface TrendPanelProps {
  cities: CityRecord[];
  selectedCityIds?: string[];
}

export function TrendPanel({ cities, selectedCityIds = [] }: TrendPanelProps) {
  const selected = cities.filter((c) => selectedCityIds.includes(c.id));

  return (
    <Panel
      id="trends"
      title="PM2.5 trends"
      description="Monthly mean concentration vs WHO guideline — chart wiring pending"
    >
      {selected.length === 0 ? (
        <StatePlaceholder
          variant="empty"
          title="Select cities to compare trends"
          message="Trend visualization will render monthlySeries from the data contract."
        />
      ) : (
        <div className="space-y-4">
          <StatePlaceholder
            variant="loading"
            title="Trend chart shell"
            message={`${selected.length} cities selected · ${selected[0].airQuality.monthlySeries.length} months available per contract`}
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {selected.map((city) => {
              const latest = city.airQuality.monthlySeries.at(-1);
              return (
                <li
                  key={city.id}
                  className="rounded-lg border border-[var(--line)] bg-slate-50 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-[var(--ink)]">{city.name}</span>
                  <span className="ml-2 font-mono text-[var(--ink-muted)]">
                    latest: {latest ? formatMonthLabel(latest.month) : "—"} ·{" "}
                    {latest?.pm25.toFixed(1) ?? "—"} µg/m³
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Panel>
  );
}
