import type { CitiesDataset } from "@/lib/schema";
import { cohortPm25Mean, formatPm25, trendDirection } from "@/lib/format";
import { generateInsights } from "@/lib/insights";
import { MetricCard } from "@/components/cards/MetricCard";
import { InsightCard } from "@/components/cards/InsightCard";
import { CitySummaryCard } from "@/components/cards/CitySummaryCard";
import { ComparePanel } from "@/components/compare/ComparePanel";
import { TrendChart } from "@/components/trends/TrendChart";
import { MapPanel } from "@/components/map/MapPanel";

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
  const improving = cities.filter(
    (c) => trendDirection(c.airQuality.trendPercent3Mo) === "improving"
  ).length;
  const defaultTrendIds = ["stockholm", "tokyo", "delhi"].filter((id) =>
    cities.some((c) => c.id === id)
  );
  const insights = generateInsights(cities);
  const sortedByEffective = [...cities].sort(
    (a, b) => a.airQuality.effectiveRank - b.airQuality.effectiveRank
  );

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      {/* Overview */}
      <section id="overview" className="space-y-8">
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
            label="Improving trends"
            value={String(improving)}
            detail={`Of ${cities.length} cities · data through ${generatedAt}`}
          />
        </div>

        <div>
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--ink)]">
                Intelligence brief
              </h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                What matters for citizens and municipal decision-makers
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {insights.map((insight) => (
              <InsightCard
                key={insight.title}
                tag={insight.tag}
                title={insight.title}
                body={insight.body}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--ink)]">
              City overview
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              How is each city doing — exposure, trend, and rank impact
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedByEffective.map((city) => (
              <CitySummaryCard key={city.id} city={city} />
            ))}
          </div>
        </div>
      </section>

      {/* Compare */}
      <ComparePanel cities={cities} />

      {/* Trends + Map */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart cities={cities} defaultSelectedIds={defaultTrendIds} />
        <MapPanel cities={cities} />
      </div>

      <footer className="border-t border-[var(--line)] pt-6 text-xs leading-relaxed text-[var(--ink-muted)]">
        <p>
          <strong className="text-[var(--ink)]">Methodology.</strong> {methodology.airQuality}.{" "}
          {methodology.whoThresholds}. {methodology.livabilityBaseline}.
        </p>
        <p className="mt-2">
          Refresh data:{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
            npm run data:fetch
          </code>
        </p>
      </footer>
    </div>
  );
}
