import type { CityRecord } from "@/lib/schema";
import { formatPm25 } from "@/lib/format";
import { classifyCity } from "@/lib/status";
import { WhoBandBadge } from "@/components/ui/WhoBandBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { RankDelta } from "@/components/ui/RankDelta";

interface CitySummaryCardProps {
  city: CityRecord;
}

export function CitySummaryCard({ city }: CitySummaryCardProps) {
  const { airQuality } = city;
  const status = classifyCity(city);

  return (
    <article className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[var(--ink)]">{city.name}</h3>
          <p className="truncate text-xs text-[var(--ink-secondary)]">
            {city.country} · {city.region}
          </p>
        </div>
        <WhoBandBadge band={airQuality.whoBand} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={status.trend} />
        <span className="text-[10px] font-medium text-[var(--ink-muted)]">
          {status.exposureLabel}
        </span>
      </div>

      <p className="mt-2 text-xs font-medium leading-snug text-[var(--ink)]">{status.headline}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            Annual PM2.5
          </p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-[var(--accent)]">
            {formatPm25(airQuality.pm25AnnualMean)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--ink-muted)]">
            90-day rolling
          </p>
          <p className="mt-0.5 font-mono text-lg font-semibold text-[var(--ink)]">
            {formatPm25(airQuality.pm25Rolling90Day)}
          </p>
        </div>
      </div>

      <div className="mt-3 border-t border-[var(--line)] pt-3">
        <TrendIndicator percent={airQuality.trendPercent3Mo} />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <RankDelta
          delta={airQuality.rankDelta}
          baselineRank={city.livabilityRank}
          effectiveRank={airQuality.effectiveRank}
        />
        <span className="text-[10px] text-[var(--ink-muted)]">Score {city.livabilityScore}</span>
      </div>

      <details className="mt-3 group">
        <summary className="cursor-pointer text-[10px] font-medium text-[var(--accent-light)] hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]">
          Why this status
        </summary>
        <p className="mt-2 text-[10px] leading-relaxed text-[var(--ink-secondary)]">
          {status.rationale}
        </p>
      </details>
    </article>
  );
}
