"use client";

import { useMemo, useState } from "react";
import type { CityRecord } from "@/lib/schema";
import { WHO_BAND_META } from "@/lib/constants";
import { formatPm25 } from "@/lib/format";
import { classifyTrend } from "@/lib/status";
import { WhoBandBadge } from "@/components/ui/WhoBandBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { Panel } from "@/components/ui/Panel";
import { StatePlaceholder } from "@/components/ui/StatePlaceholder";

type SortKey = "name" | "baselineRank" | "effectiveRank" | "pm25" | "trend" | "rankDelta" | "status";
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
  status: "Status",
};

const TREND_ORDER = { improving: 0, stable: 1, worsening: 2 };

function rankToggleClass(active: boolean) {
  return `rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)] ${
    active
      ? "bg-[var(--accent)] text-white"
      : "text-[var(--ink-secondary)] hover:bg-slate-100 hover:text-[var(--ink)]"
  }`;
}

interface RankViewToggleProps {
  rankView: RankView;
  onBaseline: () => void;
  onEffective: () => void;
}

function RankViewToggle({ rankView, onBaseline, onEffective }: RankViewToggleProps) {
  const baselineActive = rankView === "baseline";

  return (
    <div
      className="flex rounded-lg border border-[var(--line)] p-0.5"
      role="group"
      aria-label="Rank display mode"
    >
      {baselineActive ? (
        <>
          <button
            type="button"
            onClick={onBaseline}
            aria-pressed="true"
            className={rankToggleClass(true)}
          >
            Baseline
          </button>
          <button
            type="button"
            onClick={onEffective}
            aria-pressed="false"
            className={rankToggleClass(false)}
          >
            Effective
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onBaseline}
            aria-pressed="false"
            className={rankToggleClass(false)}
          >
            Baseline
          </button>
          <button
            type="button"
            onClick={onEffective}
            aria-pressed="true"
            className={rankToggleClass(true)}
          >
            Effective
          </button>
        </>
      )}
    </div>
  );
}

function SortableColumnHeader({
  columnKey,
  sortKey,
  sortDir,
  onSort,
}: {
  columnKey: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const label = SORT_LABELS[columnKey];
  const indicator = sortKey === columnKey ? (sortDir === "asc" ? " ↑" : " ↓") : "";
  const button = (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className="rounded hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
    >
      {label}
      {indicator}
    </button>
  );

  if (sortKey !== columnKey) {
    return (
      <th className="px-3 py-2 font-medium" aria-sort="none">
        {button}
      </th>
    );
  }

  if (sortDir === "asc") {
    return (
      <th className="px-3 py-2 font-medium" aria-sort="ascending">
        {button}
      </th>
    );
  }

  return (
    <th className="px-3 py-2 font-medium" aria-sort="descending">
      {button}
    </th>
  );
}

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
        case "status":
          cmp =
            TREND_ORDER[classifyTrend(a.airQuality.trendPercent3Mo)] -
            TREND_ORDER[classifyTrend(b.airQuality.trendPercent3Mo)];
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
      setSortDir(key === "name" || key === "status" ? "asc" : key === "pm25" || key === "trend" ? "desc" : "asc");
    }
  }

  function clearFilters() {
    setRegionFilter("all");
    setShowShiftsOnly(false);
  }

  const rankShifts = cities.filter((c) => c.airQuality.rankDelta !== 0).length;

  return (
    <Panel
      id="compare"
      title="City comparison"
      description="Side-by-side ranks, exposure, and trend status across the cohort"
      action={
        <RankViewToggle
          rankView={rankView}
          onBaseline={() => setRankView("baseline")}
          onEffective={() => setRankView("effective")}
        />
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label
          htmlFor="compare-region-filter"
          className="flex items-center gap-2 text-xs text-[var(--ink-secondary)]"
        >
          Region
          <select
            id="compare-region-filter"
            aria-label="Filter by region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)]"
          >
            <option value="all">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--ink-secondary)]">
          <input
            type="checkbox"
            checked={showShiftsOnly}
            onChange={(e) => setShowShiftsOnly(e.target.checked)}
            className="rounded border-[var(--line)] text-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus-ring)]"
          />
          Rank shifts only ({rankShifts})
        </label>

        <span className="w-full text-xs text-[var(--ink-muted)] sm:ml-auto sm:w-auto">
          {filtered.length} of {cities.length} cities
        </span>
      </div>

      {filtered.length === 0 ? (
        <StatePlaceholder
          variant="empty"
          title="No cities match these filters"
          message="Try clearing the region filter or unchecking “Rank shifts only” to restore the full cohort."
          action={
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[800px] text-left text-xs">
            <caption className="sr-only">
              City comparison table with sortable columns for rank, PM2.5, trend, and status
            </caption>
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--ink-secondary)]">
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                  <SortableColumnHeader
                    key={key}
                    columnKey={key}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
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
                const trend = classifyTrend(aq.trendPercent3Mo);

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
                      <span
                        className={
                          rankView === "effective" ? "font-semibold text-[var(--accent)]" : ""
                        }
                      >
                        #{aq.effectiveRank}
                      </span>
                      {rankView === "effective" && hasShift && (
                        <span
                          className={`ml-1.5 ${aq.rankDelta > 0 ? "text-rose-800" : "text-emerald-800"}`}
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
                        <span className={aq.rankDelta > 0 ? "text-rose-800" : "text-emerald-800"}>
                          {aq.rankDelta > 0 ? "+" : ""}
                          {aq.rankDelta}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={trend} />
                    </td>
                    <td className="px-3 py-2.5">
                      <WhoBandBadge band={aq.whoBand} />
                    </td>
                    <td className="max-w-[160px] px-3 py-2.5 text-[var(--ink-secondary)]">
                      {aq.riskLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-[var(--ink-muted)]">
        Status uses fixed thresholds: improving ≤ −5%, worsening ≥ +5% on 3-month PM2.5 change.
        Effective rank applies band penalties to baseline livability rank.
      </p>
    </Panel>
  );
}
