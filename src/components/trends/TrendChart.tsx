"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CityRecord } from "@/lib/schema";
import { WHO_BAND_META } from "@/lib/constants";
import { formatMonthLabel } from "@/lib/format";
import { Panel } from "@/components/ui/Panel";
import { StatePlaceholder } from "@/components/ui/StatePlaceholder";

const LINE_COLORS = ["#1e3a5f", "#1d4ed8", "#047857", "#b45309", "#be123c", "#6d28d9"];

interface TrendChartProps {
  cities: CityRecord[];
  defaultSelectedIds?: string[];
}

function cityChipClass(active: boolean) {
  return `rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${
    active
      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
      : "border-[var(--line)] bg-white text-[var(--ink-secondary)] hover:border-slate-400"
  }`;
}

function CityToggleButton({
  city,
  active,
  onToggle,
}: {
  city: CityRecord;
  active: boolean;
  onToggle: () => void;
}) {
  const band = WHO_BAND_META[city.airQuality.whoBand];

  if (active) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed="true"
        aria-label={`Remove ${city.name} from chart`}
        className={cityChipClass(true)}
      >
        <span
          className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-white/90"
          aria-hidden="true"
        />
        {city.name}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed="false"
      aria-label={`Add ${city.name} from chart`}
      className={cityChipClass(false)}
    >
      <span
        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${band.swatch}`}
        aria-hidden="true"
      />
      {city.name}
    </button>
  );
}

export function TrendChart({ cities, defaultSelectedIds = [] }: TrendChartProps) {
  const initialIds =
    defaultSelectedIds.length > 0
      ? defaultSelectedIds
      : cities.slice(0, 3).map((c) => c.id);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [limitHint, setLimitHint] = useState(false);

  const chartData = useMemo(() => {
    const selected = cities.filter((c) => selectedIds.includes(c.id));
    if (selected.length === 0) return [];

    const months = selected[0].airQuality.monthlySeries.map((m) => m.month);

    return months.map((month) => {
      const point: Record<string, string | number> = {
        month,
        label: formatMonthLabel(month),
      };
      for (const city of selected) {
        const entry = city.airQuality.monthlySeries.find((m) => m.month === month);
        if (entry) point[city.id] = entry.pm25;
      }
      return point;
    });
  }, [cities, selectedIds]);

  function toggleCity(id: string) {
    setLimitHint(false);
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
      }
      if (prev.length >= 6) {
        setLimitHint(true);
        return prev;
      }
      return [...prev, id];
    });
  }

  const selectedCities = cities.filter((c) => selectedIds.includes(c.id));
  const atMinimum = selectedIds.length === 1;

  if (cities.length === 0) {
    return (
      <Panel id="trends" title="PM2.5 trends" description="Monthly mean vs WHO guideline targets">
        <StatePlaceholder
          variant="empty"
          title="No trend data available"
          message="City records must include monthlySeries to render this chart."
        />
      </Panel>
    );
  }

  return (
    <Panel
      id="trends"
      title="PM2.5 trends"
      description="Monthly mean concentration against WHO guideline targets"
    >
      <div
        className="mb-2 flex max-h-32 flex-wrap gap-1.5 overflow-y-auto sm:max-h-none"
        role="group"
        aria-label="Select cities to plot"
      >
        {cities.map((city) => (
          <CityToggleButton
            key={city.id}
            city={city}
            active={selectedIds.includes(city.id)}
            onToggle={() => toggleCity(city.id)}
          />
        ))}
      </div>

      {atMinimum && (
        <p className="mb-3 text-[10px] text-[var(--ink-muted)]" role="status">
          At least one city must remain selected.
        </p>
      )}
      {limitHint && (
        <p className="mb-3 text-[10px] text-amber-800" role="status">
          Maximum 6 cities on chart — deselect one to add another.
        </p>
      )}

      <div className="h-64 w-full sm:h-72">
        {chartData.length === 0 ? (
          <StatePlaceholder
            variant="empty"
            title="Select a city to view trends"
            message="Choose one or more cities from the list above."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
                width={36}
                label={{
                  value: "µg/m³",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 10, fill: "#475569" },
                }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
                formatter={(value: number) => [`${value.toFixed(1)} µg/m³`, "PM2.5"]}
              />
              <ReferenceLine
                y={5}
                stroke="#047857"
                strokeDasharray="4 4"
                label={{
                  value: "WHO 5",
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "#047857",
                }}
              />
              <ReferenceLine
                y={15}
                stroke="#b45309"
                strokeDasharray="4 4"
                label={{
                  value: "Moderate 15",
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "#b45309",
                }}
              />
              {selectedCities.map((city, i) => (
                <Line
                  key={city.id}
                  type="monotone"
                  dataKey={city.id}
                  name={city.name}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} iconType="line" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="mt-3 text-xs text-[var(--ink-muted)]">
        Dashed lines: WHO 2021 thresholds at 5 µg/m³ (target) and 15 µg/m³ (moderate band upper bound).
      </p>
    </Panel>
  );
}
