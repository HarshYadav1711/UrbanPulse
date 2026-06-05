import type { CityRecord } from "@/lib/schema";
import { cohortPm25Mean, formatPm25, trendDirection } from "@/lib/format";

export interface Insight {
  tag: string;
  title: string;
  body: string;
}

export function generateInsights(cities: CityRecord[]): Insight[] {
  const cohortMean = cohortPm25Mean(cities);

  const biggestMismatch = [...cities].sort(
    (a, b) => Math.abs(b.airQuality.rankDelta) - Math.abs(a.airQuality.rankDelta)
  )[0];

  const highExposure = cities.filter((c) => c.airQuality.whoBand === "high");
  const worsening = cities.filter((c) => trendDirection(c.airQuality.trendPercent3Mo) === "worsening");
  const improving = cities.filter((c) => trendDirection(c.airQuality.trendPercent3Mo) === "improving");

  const regionStats = new Map<string, { total: number; count: number }>();
  for (const city of cities) {
    const entry = regionStats.get(city.region) ?? { total: 0, count: 0 };
    entry.total += city.airQuality.pm25AnnualMean;
    entry.count += 1;
    regionStats.set(city.region, entry);
  }
  const highestRegion = [...regionStats.entries()].sort(
    (a, b) => b[1].total / b[1].count - a[1].total / a[1].count
  )[0];

  const insights: Insight[] = [];

  if (biggestMismatch && biggestMismatch.airQuality.rankDelta !== 0) {
    const delta = biggestMismatch.airQuality.rankDelta;
    const direction = delta > 0 ? "drops" : "rises";
    insights.push({
      tag: "Rank gap",
      title: `${biggestMismatch.name} ${direction} ${Math.abs(delta)} places after exposure adjustment`,
      body: `Baseline rank #${biggestMismatch.livabilityRank} becomes effective rank #${biggestMismatch.airQuality.effectiveRank}. PM2.5 at ${formatPm25(biggestMismatch.airQuality.pm25AnnualMean)} — ${biggestMismatch.airQuality.riskLabel.toLowerCase()}. Citizens comparing livability indices alone miss this environmental penalty.`,
    });
  }

  if (highExposure.length > 0) {
    const names = highExposure.map((c) => c.name).join(", ");
    insights.push({
      tag: "High exposure",
      title: `${highExposure.length} ${highExposure.length === 1 ? "city exceeds" : "cities exceed"} WHO high-exposure threshold`,
      body: `${names} ${highExposure.length === 1 ? "registers" : "register"} PM2.5 above 35 µg/m³. Municipal health teams should treat air quality as a primary planning constraint, not a secondary indicator.`,
    });
  }

  if (highestRegion) {
    const [region, stats] = highestRegion;
    const regionalMean = stats.total / stats.count;
    const diff = ((regionalMean - cohortMean) / cohortMean) * 100;
    insights.push({
      tag: "Regional",
      title: `${region} averages ${formatPm25(regionalMean)} — ${diff > 0 ? "above" : "below"} cohort mean`,
      body: `${region} cities run ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? "higher" : "lower"} than the ${cities.length}-city average of ${formatPm25(cohortMean)}. Cross-regional policy benchmarks should account for this baseline gap.`,
    });
  }

  if (worsening.length > 0) {
    const worst = [...worsening].sort(
      (a, b) => b.airQuality.trendPercent3Mo - a.airQuality.trendPercent3Mo
    )[0];
    insights.push({
      tag: "Trend alert",
      title: `${worst.name} PM2.5 rising — up ${worst.airQuality.trendPercent3Mo.toFixed(0)}% over 3 months`,
      body: `${worsening.length} ${worsening.length === 1 ? "city shows" : "cities show"} worsening 90-day trends. Early intervention on transport and industrial emissions can prevent sustained public-health impact.`,
    });
  } else if (improving.length > 0) {
    const best = [...improving].sort(
      (a, b) => a.airQuality.trendPercent3Mo - b.airQuality.trendPercent3Mo
    )[0];
    insights.push({
      tag: "Improvement",
      title: `${best.name} leads cohort with ${Math.abs(best.airQuality.trendPercent3Mo).toFixed(0)}% PM2.5 reduction`,
      body: `${improving.length} ${improving.length === 1 ? "city is" : "cities are"} trending cleaner over the last quarter. Sustained gains here translate directly to lower respiratory burden for residents.`,
    });
  }

  return insights.slice(0, 4);
}
