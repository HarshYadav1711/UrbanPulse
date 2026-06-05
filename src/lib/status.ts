import type { CityRecord, WhoBand } from "@/lib/schema";
import { formatPm25, trendDirection } from "@/lib/format";

export type TrendStatus = "improving" | "stable" | "worsening";

/** Published thresholds — mirrored in transform.py trend logic. */
export const TREND_RULES = {
  improvingMaxPercent: -5,
  worseningMinPercent: 5,
  label: "3-month PM2.5 change vs the prior 3-month average",
} as const;

export const EXPOSURE_STATUS: Record<
  WhoBand,
  { label: string; rule: string }
> = {
  excellent: {
    label: "Within target",
    rule: "Annual mean PM2.5 ≤ 5 µg/m³ (WHO excellent band)",
  },
  moderate: {
    label: "Watch",
    rule: "Annual mean PM2.5 > 5 and ≤ 15 µg/m³ (WHO moderate band)",
  },
  elevated: {
    label: "Concern",
    rule: "Annual mean PM2.5 > 15 and ≤ 35 µg/m³ (WHO elevated band)",
  },
  high: {
    label: "Critical",
    rule: "Annual mean PM2.5 > 35 µg/m³ (WHO high band)",
  },
};

export interface CityStatus {
  trend: TrendStatus;
  exposureLabel: string;
  headline: string;
  rationale: string;
}

export function classifyTrend(percent: number): TrendStatus {
  return trendDirection(percent);
}

export function trendRuleText(): string {
  return `Improving when change ≤ ${TREND_RULES.improvingMaxPercent}%. Worsening when change ≥ +${TREND_RULES.worseningMinPercent}%. Otherwise stable. Based on ${TREND_RULES.label}.`;
}

export function classifyCity(city: CityRecord): CityStatus {
  const aq = city.airQuality;
  const trend = classifyTrend(aq.trendPercent3Mo);
  const exposure = EXPOSURE_STATUS[aq.whoBand];

  let headline: string;
  if (trend === "worsening" && (aq.whoBand === "high" || aq.whoBand === "elevated")) {
    headline = "Pollution is rising in an already stressed market";
  } else if (trend === "worsening") {
    headline = "Quarter trend is moving away from WHO targets";
  } else if (trend === "improving" && aq.whoBand === "excellent") {
    headline = "Improving and within WHO annual target";
  } else if (trend === "improving") {
    headline = "Trending cleaner, but annual exposure still elevated";
  } else if (aq.rankDelta >= 4) {
    headline = "Flat trend, but livability rank penalized for exposure";
  } else if (aq.whoBand === "excellent") {
    headline = "Holding steady near WHO target levels";
  } else {
    headline = "No material change over the last quarter";
  }

  const pctSign = aq.trendPercent3Mo > 0 ? "+" : "";
  const rankNote =
    aq.rankDelta === 0
      ? "Effective rank unchanged — exposure band matches baseline assumption."
      : `Effective rank ${aq.rankDelta > 0 ? "falls" : "rises"} ${Math.abs(aq.rankDelta)} places (${aq.rankDelta > 0 ? "+" : ""}${aq.rankDelta}) after PM2.5 band adjustment.`;

  const rationale = [
    `${exposure.label}: ${formatPm25(aq.pm25AnnualMean)}. ${exposure.rule}.`,
    `Trend: ${pctSign}${aq.trendPercent3Mo.toFixed(1)}% (${classifyTrend(aq.trendPercent3Mo)}). ${trendRuleText()}`,
    rankNote,
  ].join(" ");

  return {
    trend,
    exposureLabel: exposure.label,
    headline,
    rationale,
  };
}

export function countByTrend(cities: CityRecord[]): Record<TrendStatus, number> {
  const counts: Record<TrendStatus, number> = { improving: 0, stable: 0, worsening: 0 };
  for (const city of cities) {
    counts[classifyTrend(city.airQuality.trendPercent3Mo)] += 1;
  }
  return counts;
}
