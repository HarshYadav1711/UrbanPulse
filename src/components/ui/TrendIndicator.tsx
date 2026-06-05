import { trendDirection } from "@/lib/format";

interface TrendIndicatorProps {
  percent: number;
  showLabel?: boolean;
}

const CONFIG = {
  improving: { label: "Improving", color: "text-emerald-700", icon: "↓" },
  worsening: { label: "Worsening", color: "text-rose-700", icon: "↑" },
  stable: { label: "Stable", color: "text-slate-600", icon: "→" },
} as const;

export function TrendIndicator({ percent, showLabel = true }: TrendIndicatorProps) {
  const direction = trendDirection(percent);
  const config = CONFIG[direction];
  const sign = percent > 0 ? "+" : "";

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs ${config.color}`}>
      <span aria-hidden="true">{config.icon}</span>
      <span>{sign}{percent.toFixed(1)}%</span>
      {showLabel && (
        <span className="font-sans font-normal text-[var(--ink-muted)]">· {config.label}</span>
      )}
    </span>
  );
}
