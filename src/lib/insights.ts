import type { AirQuality, CityRecord } from "@/lib/schema";
import { cohortPm25Mean, formatPm25, formatRollingVsAnnual } from "@/lib/format";
import {
  classifyTrend,
  countByTrend,
  EXPOSURE_STATUS,
  trendRuleText,
  type TrendStatus,
} from "@/lib/status";

export interface Insight {
  id: string;
  tag: string;
  trendStatus?: TrendStatus;
  title: string;
  body: string;
  /** Plain-language description of the rule that triggered this insight. */
  rule: string;
}

function trendInsight(
  id: string,
  tag: string,
  trendStatus: TrendStatus,
  title: string,
  body: string,
  rule: string
): Insight {
  return { id, tag, trendStatus, title, body, rule };
}

export function generateInsights(cities: CityRecord[]): Insight[] {
  if (cities.length === 0) return [];

  const counts = countByTrend(cities);
  const cohortMean = cohortPm25Mean(cities);
  const insights: Insight[] = [];

  insights.push(
    trendInsight(
      "cohort-trend-split",
      "Trend summary",
      counts.worsening > counts.improving ? "worsening" : counts.improving > counts.worsening ? "improving" : "stable",
      `${counts.improving} improving · ${counts.stable} stable · ${counts.worsening} worsening`,
      `${counts.worsening} ${counts.worsening === 1 ? "city needs" : "cities need"} attention on rising PM2.5. ${counts.improving} ${counts.improving === 1 ? "is" : "are"} posting quarter-over-quarter gains. The rest are within ±5% — no clear directional shift yet.`,
      trendRuleText()
    )
  );

  const worsening = cities.filter((c) => classifyTrend(c.airQuality.trendPercent3Mo) === "worsening");
  if (worsening.length > 0) {
    const worst = worsening.reduce((a, b) =>
      b.airQuality.trendPercent3Mo > a.airQuality.trendPercent3Mo ? b : a
    );
    const aq: AirQuality = worst.airQuality;
    insights.push(
      trendInsight(
        "fastest-worsening",
        "Trend alert",
        "worsening",
        `${worst.name} leads declines at +${aq.trendPercent3Mo.toFixed(1)}% over 3 months`,
        `${formatRollingVsAnnual(aq)}. ${EXPOSURE_STATUS[aq.whoBand].label} exposure band — ${aq.riskLabel}.`,
        `Selected city with highest trendPercent3Mo among those classified worsening (≥ +5%). ${worst.name}: +${aq.trendPercent3Mo.toFixed(1)}%.`
      )
    );
  }

  const improving = cities.filter((c) => classifyTrend(c.airQuality.trendPercent3Mo) === "improving");
  if (improving.length > 0) {
    const best = improving.reduce((a, b) =>
      b.airQuality.trendPercent3Mo < a.airQuality.trendPercent3Mo ? b : a
    );
    const aq: AirQuality = best.airQuality;
    insights.push(
      trendInsight(
        "fastest-improving",
        "Trend gain",
        "improving",
        `${best.name} down ${Math.abs(aq.trendPercent3Mo).toFixed(1)}% — largest quarter improvement`,
        `${formatRollingVsAnnual(aq, "vs")}. ${counts.improving - 1 > 0 ? `${counts.improving - 1} other ${counts.improving - 1 === 1 ? "city also shows" : "cities also show"} improving trends.` : "Only city in the cohort currently improving."}`,
        `Selected city with lowest (most negative) trendPercent3Mo among those classified improving (≤ −5%). ${best.name}: ${aq.trendPercent3Mo.toFixed(1)}%.`
      )
    );
  }

  const rankMismatch = [...cities]
    .filter((c) => c.airQuality.rankDelta !== 0)
    .sort((a, b) => Math.abs(b.airQuality.rankDelta) - Math.abs(a.airQuality.rankDelta))[0];

  if (rankMismatch) {
    const aq = rankMismatch.airQuality;
    const delta = aq.rankDelta;
    insights.push({
      id: "rank-exposure-gap",
      tag: "Rank adjustment",
      title: `${rankMismatch.name}: #${rankMismatch.livabilityRank} baseline → #${aq.effectiveRank} effective`,
      body: `${delta > 0 ? "Livability rank drops" : "Livability rank rises"} ${Math.abs(delta)} after PM2.5 band penalty. Annual exposure ${formatPm25(aq.pm25AnnualMean)} (${EXPOSURE_STATUS[aq.whoBand].label}). Headline rankings understate ${delta > 0 ? "environmental risk" : "air quality strength"} here.`,
      rule: `Largest |rankDelta| in cohort. Effective rank = baseline rank ${delta > 0 ? "+" : ""}${delta} based on WHO band adjustment rules (excellent −2, moderate 0, elevated +4, high +8).`,
    });
  }

  const highBand = cities.filter((c) => c.airQuality.whoBand === "high");
  if (highBand.length > 0 && insights.length < 5) {
    const names = highBand.map((c) => c.name).join(", ");
    insights.push({
      id: "high-exposure",
      tag: "Exposure",
      title: `${highBand.length} ${highBand.length === 1 ? "market exceeds" : "markets exceed"} the WHO high band`,
      body: `${names} — annual PM2.5 above 35 µg/m³. These cities carry the largest effective-rank penalties (+8) regardless of trend direction.`,
      rule: "Count of cities where whoBand = high (annual mean PM2.5 > 35 µg/m³ per WHO 2021 thresholds).",
    });
  }

  const regionStats = new Map<string, { total: number; count: number }>();
  for (const city of cities) {
    const entry = regionStats.get(city.region) ?? { total: 0, count: 0 };
    entry.total += city.airQuality.pm25AnnualMean;
    entry.count += 1;
    regionStats.set(city.region, entry);
  }
  const [highestRegion, highestStats] = [...regionStats.entries()].sort(
    (a, b) => b[1].total / b[1].count - a[1].total / a[1].count
  )[0];
  const regionalMean = highestStats.total / highestStats.count;
  const diffPct = ((regionalMean - cohortMean) / cohortMean) * 100;

  if (insights.length < 5 && diffPct > 10) {
    insights.push({
      id: "regional-benchmark",
      tag: "Regional",
      title: `${highestRegion} runs ${diffPct.toFixed(0)}% above cohort PM2.5 average`,
      body: `Regional mean ${formatPm25(regionalMean)} vs cohort ${formatPm25(cohortMean)} across ${cities.length} cities. Useful baseline when comparing policy outcomes across geographies.`,
      rule: `Region with highest average pm25AnnualMean. ${highestRegion}: mean of ${highestStats.count} cities compared to cohort mean.`,
    });
  }

  return insights.slice(0, 5);
}

export function generateCityInsight(city: CityRecord): Pick<Insight, "title" | "rule"> {
  const aq = city.airQuality;
  const trend = classifyTrend(aq.trendPercent3Mo);
  const pctSign = aq.trendPercent3Mo > 0 ? "+" : "";

  return {
    title: `${pctSign}${aq.trendPercent3Mo.toFixed(1)}% quarter change · ${EXPOSURE_STATUS[aq.whoBand].label} exposure`,
    rule: `${trend} by trend rules. ${EXPOSURE_STATUS[aq.whoBand].rule}.`,
  };
}
