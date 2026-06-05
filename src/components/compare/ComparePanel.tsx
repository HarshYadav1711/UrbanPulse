"use client";

import { useMemo, useState } from "react";
import type { CityRecord } from "@/lib/schema";
import { WHO_BAND_META } from "@/lib/constants";
import { formatPm25 } from "@/lib/format";
import { WhoBandBadge } from "@/components/ui/WhoBandBadge";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { Panel } from "@/components/ui/Panel";

type SortKey = "name" | "baselineRank" | "effectiveRank" | "pm25" | "trend" | "rankDelta";
type SortDir = "asc" | "desc";
type RankView = "baseline" | "effective";

interface ComparePanelProps {
  cities: CityRecord[];
}

const SORT_LABELS: Record<SortKey, string> = {
  name: "City",
  baselineRank: "Baseline rank",
  effectiveRank: "Effective rank",
  pm25: "PM2.5",
  trend: "3-mo trend",
  rankDelta: "Rank shift",
};

export function ComparePanel({ cities }: ComparePanelProps) {
  const [sortKey, setSortKey] = useState<SortKey>("effectiveRank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [rankView, setRankView] = useState<RankView>("effective");
  const [showShiftsOnly, setShowShiftsOnly] = useState(false);

  const regions = useMemo(
    () => [...new Set(cities.map((c) => c.region))].sort(),
    [cities]
  );

  const filtered = useMemo(() => {
    let list = [...cities];

    if (regionFilter !== "all") {
      list = list.filter((c) => c.region === regionFilter);
    }

    if (showShiftsOnly) {
      list = list.filter((c) => c.airQuality.rankDelta !== 0);
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "baselineRank":
          cmp = a.livabilityRank - b.livabilityRank;
          break;
        case "effectiveRank":
          cmp = a.airQuality.effectiveRank - b.airQuality.effectiveRank;
          break;
        case "pm25":
          cmp = a.airQuality.pm25AnnualMean - b.airQuality.pm25AnnualMean;
          break;
        case "trend":
          cmp = a.airQuality.trendPercent3Mo - b.airQuality.trendPercent3Mo;
          break;
        case "rankDelta":
          cmp = a.airQuality.rankDelta - b.airQuality.rankDelta;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [cities, regionFilter, showShiftsOnly, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : key === "pm25" || key === "trend" ? "desc" : "asc");
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  const rankShifts = cities.filter((c) => c.airQuality.rankDelta !== 0).length;

  return (
    <Panel
      id="compare"
      title="City comparison"
      description="Baseline livability rank against environment-adjusted effective rank"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-[var(--line)] p-0.5">
            <button
              type="button"
              onClick={() => setRankView("baseline")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                rankView === "baseline"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              Baseline
            </button>
            <button
              type="button"
              onClick={() => setRankView("effective")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                rankView === "effective"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
              }`}
            >
              Effective
            </button>
          </div>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label htmlFor="compare-region-filter" className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
          Region
          <select
            id="compare-region-filter"
            aria-label="Filter by region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-[var(--ink)]"
          >
            <option value="all">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--ink-muted)]">
          <input
            type="checkbox"
            checked={showShiftsOnly}
            onChange={(e) => setShowShiftsOnly(e.target.checked)}
            className="rounded border-[var(--line)]"
          />
          Rank shifts only ({rankShifts})
        </label>

        <span className="ml-auto text-xs text-[var(--ink-muted)]">
          {filtered.length} of {cities.length} cities
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--line)] text-[var(--ink-muted)]">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <th key={key} className="px-3 py-2 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(key)}
                    className="hover:text-[var(--ink)]"
                  >
                    {SORT_LABELS[key]}
                    {sortIndicator(key)}
                  </button>
                </th>
              ))}
              <th className="px-3 py-2 font-medium">WHO band</th>
              <th className="px-3 py-2 font-medium">Risk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((city) => {
              const aq = city.airQuality;
              const hasShift = aq.rankDelta !== 0;
              const band = WHO_BAND_META[aq.whoBand];

              return (
                <tr
                  key={city.id}
                  className={`border-b border-[var(--line)] last:border-0 ${
                    hasShift && Math.abs(aq.rankDelta) >= 4 ? band.bg : ""
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-[var(--ink)]">{city.name}</span>
                    <span className="ml-1.5 text-[var(--ink-muted)]">{city.region}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono">#{city.livabilityRank}</td>
                  <td className="px-3 py-2.5 font-mono">
                    <span className={rankView === "effective" ? "font-semibold text-[var(--accent)]" : ""}>
                      #{aq.effectiveRank}
                    </span>
                    {rankView === "effective" && hasShift && (
                      <span
                        className={`ml-1.5 ${aq.rankDelta > 0 ? "text-rose-600" : "text-emerald-600"}`}
                      >
                        ({aq.rankDelta > 0 ? "+" : ""}
                        {aq.rankDelta})
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono">{formatPm25(aq.pm25AnnualMean)}</td>
                  <td className="px-3 py-2.5">
                    <TrendIndicator percent={aq.trendPercent3Mo} showLabel={false} />
                  </td>
                  <td className="px-3 py-2.5 font-mono">
                    {aq.rankDelta === 0 ? (
                      <span className="text-[var(--ink-muted)]">—</span>
                    ) : (
                      <span className={aq.rankDelta > 0 ? "text-rose-600" : "text-emerald-600"}>
                        {aq.rankDelta > 0 ? "+" : ""}
                        {aq.rankDelta}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <WhoBandBadge band={aq.whoBand} />
                  </td>
                  <td className="max-w-[140px] px-3 py-2.5 text-[var(--ink-muted)]">
                    {aq.riskLabel}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-[var(--ink-muted)]">
        Effective rank adjusts baseline livability for PM2.5 exposure band. Rows highlighted when
        rank shift is ±4 or more. Currently sorted by {SORT_LABELS[sortKey].toLowerCase()}
        {rankView === "effective" ? " · effective rank view active" : ""}.
      </p>
    </Panel>
  );
}
