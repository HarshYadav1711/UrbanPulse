import type { TrendStatus } from "@/lib/status";
import { classifyTrend } from "@/lib/status";

interface TrendIndicatorProps {
  percent: number;
  showLabel?: boolean;
}

const CONFIG: Record<
  TrendStatus,
  { label: string; color: string; icon: string }
> = {
  improving: { label: "Improving", color: "text-emerald-800", icon: "↓" },
  worsening: { label: "Worsening", color: "text-rose-800", icon: "↑" },
  stable: { label: "Stable", color: "text-slate-700", icon: "→" },
};

export function TrendIndicator({ percent, showLabel = true }: TrendIndicatorProps) {
  const direction = classifyTrend(percent);
  const config = CONFIG[direction];
  const sign = percent > 0 ? "+" : "";

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs ${config.color}`}>
      <span aria-hidden="true">{config.icon}</span>
      <span>{sign}{percent.toFixed(1)}%</span>
      {showLabel && (
        <span className="sr-only">{config.label}</span>
      )}
      {showLabel && (
        <span className="font-sans font-normal text-[var(--ink-secondary)]" aria-hidden="true">
          · {config.label}
        </span>
      )}
    </span>
  );
}
