import type { CitiesDataset } from "@/lib/schema";
import { cohortPm25Mean, formatPm25 } from "@/lib/format";
import { generateInsights } from "@/lib/insights";
import { countByTrend, trendRuleText } from "@/lib/status";
import { MetricCard } from "@/components/cards/MetricCard";
import { InsightCard } from "@/components/cards/InsightCard";
import { CitySummaryCard } from "@/components/cards/CitySummaryCard";
import { ComparePanel } from "@/components/compare/ComparePanel";
import { TrendChart } from "@/components/trends/TrendChart";
import { MapPanel } from "@/components/map/MapPanel";
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
  const trendCounts = countByTrend(cities);
  const defaultTrendIds = ["stockholm", "tokyo", "delhi"].filter((id) =>
    cities.some((c) => c.id === id)
  );
  const insights = generateInsights(cities);
  const sortedByEffective = [...cities].sort(
    (a, b) => a.airQuality.effectiveRank - b.airQuality.effectiveRank
  );

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <section id="overview" className="space-y-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Cohort PM2.5 mean"
            value={formatPm25(avgPm25)}
            detail={`${aboveWho} of ${cities.length} above WHO 5 µg/m³ target`}
          />
          <MetricCard
            label="Trend split"
            value={`${trendCounts.improving} / ${trendCounts.stable} / ${trendCounts.worsening}`}
            detail="Improving · stable · worsening (3-mo rule)"
          />
          <MetricCard
            label="Rank adjustments"
            value={String(rankShifts)}
            detail="Cities where exposure changes effective rank"
          />
          <MetricCard
            label="Elevated exposure"
            value={String(highExposure)}
            detail={`Data through ${generatedAt}`}
          />
        </div>

        <div>
          <div className="mb-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--ink)]">
              Insights
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
              Rule-based signals from PM2.5 trends, exposure bands, and rank adjustments
            </p>
          </div>

          {insights.length === 0 ? (
            <StatePlaceholder
              variant="empty"
              title="No insights generated"
              message="Insights require at least one city with valid air quality and trend fields."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  tag={insight.tag}
                  title={insight.title}
                  body={insight.body}
                  rule={insight.rule}
                  trendStatus={insight.trendStatus}
                />
              ))}
            </div>
          )}

          <p className="mt-3 text-[10px] leading-relaxed text-[var(--ink-muted)]">
            {trendRuleText()} Each card states the rule that selected it.
          </p>
        </div>

        <div>
          <div className="mb-4">
            <h2 className="text-sm font-semibold tracking-tight text-[var(--ink)]">
              City overview
            </h2>
            <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
              Status, exposure, and quarter trend for each market — expand “Why this status” for the underlying rules
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedByEffective.map((city) => (
              <CitySummaryCard key={city.id} city={city} />
            ))}
          </div>
        </div>
      </section>

      <ComparePanel cities={cities} />

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
