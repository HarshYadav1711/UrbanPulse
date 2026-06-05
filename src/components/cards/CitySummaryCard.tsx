import type { CityRecord } from "@/lib/schema";
import { formatPm25 } from "@/lib/format";
import { WhoBandBadge } from "@/components/ui/WhoBandBadge";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { RankDelta } from "@/components/ui/RankDelta";

interface CitySummaryCardProps {
  city: CityRecord;
}

export function CitySummaryCard({ city }: CitySummaryCardProps) {
  const { airQuality } = city;

  return (
    <article className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)]">{city.name}</h3>
          <p className="text-xs text-[var(--ink-muted)]">
            {city.country} · {city.region}
          </p>
        </div>
        <WhoBandBadge band={airQuality.whoBand} />
      </div>

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

      <div className="mt-2 flex items-center justify-between gap-2">
        <RankDelta
          delta={airQuality.rankDelta}
          baselineRank={city.livabilityRank}
          effectiveRank={airQuality.effectiveRank}
        />
        <span className="text-[10px] text-[var(--ink-muted)]">
          Score {city.livabilityScore}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[var(--ink-muted)]">
        {airQuality.riskLabel}
      </p>
    </article>
  );
}
