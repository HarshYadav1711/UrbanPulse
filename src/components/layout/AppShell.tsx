import type { CitiesDataset } from "@/lib/schema";
import { WHO_BAND_META } from "@/lib/constants";
import { cohortPm25Mean, formatPm25 } from "@/lib/format";
import { MetricCard } from "@/components/cards/MetricCard";
import { InsightCard } from "@/components/cards/InsightCard";
import { TrendPanel } from "@/components/trends/TrendPanel";
import { MapPanel } from "@/components/map/MapPanel";
import { Panel } from "@/components/ui/Panel";
import { StatePlaceholder } from "@/components/ui/StatePlaceholder";

interface AppShellProps {
  data: CitiesDataset;
}

export function AppShell({ data }: AppShellProps) {
  const { cities, generatedAt, methodology } = data;
  const avgPm25 = cohortPm25Mean(cities);
  const aboveWho = cities.filter((c) => c.airQuality.pm25AnnualMean > 5).length;
  const rankShifts = cities.filter((c) => c.airQuality.rankDelta !== 0).length;
  const highExposure = cities.filter(
    (c) => c.airQuality.whoBand === "elevated" || c.airQuality.whoBand === "high"
  ).length;
  const defaultTrendIds = cities.slice(0, 3).map((c) => c.id);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Overview */}
      <section id="overview" className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Cohort PM2.5 mean"
            value={formatPm25(avgPm25)}
            detail={`${aboveWho} of ${cities.length} above WHO 5 µg/m³ target`}
          />
          <MetricCard
            label="Rank adjustments"
            value={String(rankShifts)}
            detail="Cities whose effective rank differs from baseline"
          />
          <MetricCard
            label="Elevated / high exposure"
            value={String(highExposure)}
            detail="Markets flagged by WHO band"
          />
          <MetricCard
            label="Dataset"
            value={`${cities.length} cities`}
            detail={`Generated ${generatedAt}`}
          />
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold tracking-tight">Intelligence brief</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InsightCard tag="Shell" title="Insight engine not wired" />
            <InsightCard tag="Shell" title="Regional benchmarks pending" />
            <InsightCard tag="Shell" title="Exposure leaders pending" />
            <InsightCard tag="Shell" title="Trend alerts pending" />
          </div>
        </div>
      </section>

      {/* Compare */}
      <Panel
        id="compare"
        title="City comparison"
        description="Baseline livability rank vs environment-adjusted effective rank — table pending"
      >
        <StatePlaceholder
          variant="loading"
          title="Compare table shell"
          message="Will consume livabilityRank, effectiveRank, rankDelta, and whoBand from CityRecord."
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--ink-muted)]">
                <th className="px-3 py-2 font-medium">City</th>
                <th className="px-3 py-2 font-medium">Baseline rank</th>
                <th className="px-3 py-2 font-medium">PM2.5</th>
                <th className="px-3 py-2 font-medium">WHO band</th>
                <th className="px-3 py-2 font-medium">Effective rank</th>
              </tr>
            </thead>
            <tbody>
              {cities.slice(0, 8).map((city) => {
                const band = WHO_BAND_META[city.airQuality.whoBand];
                return (
                  <tr key={city.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="px-3 py-2 font-medium">{city.name}</td>
                    <td className="px-3 py-2 font-mono">#{city.livabilityRank}</td>
                    <td className="px-3 py-2 font-mono">
                      {formatPm25(city.airQuality.pm25AnnualMean)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 ${band.bg} ${band.border} ${band.color}`}
                      >
                        {band.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">#{city.airQuality.effectiveRank}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {cities.length > 8 && (
            <p className="mt-2 text-xs text-[var(--ink-muted)]">
              Preview shows 8 of {cities.length} cities
            </p>
          )}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendPanel cities={cities} selectedCityIds={defaultTrendIds} />
        <MapPanel cities={cities} />
      </div>

      <footer className="border-t border-[var(--line)] pt-6 text-xs leading-relaxed text-[var(--ink-muted)]">
        <p>
          <strong className="text-[var(--ink)]">Data contract.</strong> {methodology.airQuality}.{" "}
          {methodology.whoThresholds}. {methodology.livabilityBaseline}.
        </p>
        <p className="mt-2">
          Regenerate:{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
            npm run data:fetch
          </code>
        </p>
      </footer>
    </div>
  );
}
