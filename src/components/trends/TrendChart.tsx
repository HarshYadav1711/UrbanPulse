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

const LINE_COLORS = ["#1e3a5f", "#2563eb", "#059669", "#d97706", "#e11d48", "#7c3aed"];

interface TrendChartProps {
  cities: CityRecord[];
  defaultSelectedIds?: string[];
}

export function TrendChart({ cities, defaultSelectedIds = [] }: TrendChartProps) {
  const initialIds =
    defaultSelectedIds.length > 0
      ? defaultSelectedIds
      : cities.slice(0, 3).map((c) => c.id);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

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
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((x) => x !== id) : prev;
      }
      return prev.length < 6 ? [...prev, id] : prev;
    });
  }

  const selectedCities = cities.filter((c) => selectedIds.includes(c.id));

  return (
    <Panel
      id="trends"
      title="PM2.5 trends"
      description="Monthly mean concentration against WHO guideline targets"
    >
      <div className="mb-4 flex flex-wrap gap-1.5">
        {cities.map((city) => {
          const active = selectedIds.includes(city.id);
          const band = WHO_BAND_META[city.airQuality.whoBand];
          return (
            <button
              key={city.id}
              type="button"
              onClick={() => toggleCity(city.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink-muted)] hover:border-slate-300"
              }`}
            >
              <span
                className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${active ? "bg-white/80" : band.swatch}`}
              />
              {city.name}
            </button>
          );
        })}
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
              width={36}
              label={{
                value: "µg/m³",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 10, fill: "#64748b" },
              }}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
              formatter={(value: number) => [`${value.toFixed(1)} µg/m³`, "PM2.5"]}
            />
            <ReferenceLine
              y={5}
              stroke="#059669"
              strokeDasharray="4 4"
              label={{ value: "WHO target 5", position: "insideTopRight", fontSize: 10, fill: "#059669" }}
            />
            <ReferenceLine
              y={15}
              stroke="#d97706"
              strokeDasharray="4 4"
              label={{ value: "Moderate 15", position: "insideTopRight", fontSize: 10, fill: "#d97706" }}
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
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
              iconType="line"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-[var(--ink-muted)]">
        Select up to 6 cities. Dashed lines mark WHO 2021 PM2.5 thresholds at 5 and 15 µg/m³.
      </p>
    </Panel>
  );
}
