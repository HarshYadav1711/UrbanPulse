import type { AirQuality, CityRecord } from "@/lib/schema";

export function formatPm25(value: number): string {
  return `${value.toFixed(1)} µg/m³`;
}

export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const names = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${names[parseInt(m, 10) - 1]} ${year.slice(2)}`;
}

export function trendDirection(pct: number): "improving" | "worsening" | "stable" {
  if (pct <= -5) return "improving";
  if (pct >= 5) return "worsening";
  return "stable";
}

export function cohortPm25Mean(cities: CityRecord[]): number {
  if (cities.length === 0) return 0;
  return cities.reduce((s, c) => s + c.airQuality.pm25AnnualMean, 0) / cities.length;
}

export function formatRollingVsAnnual(aq: AirQuality, variant: "against" | "vs" = "against"): string {
  const rolling = formatPm25(aq.pm25Rolling90Day);
  const annual = formatPm25(aq.pm25AnnualMean);
  if (variant === "vs") {
    return `Rolling 90-day mean is ${rolling} vs ${annual} annual average`;
  }
  return `Rolling 90-day mean is ${rolling} against an annual average of ${annual}`;
}
