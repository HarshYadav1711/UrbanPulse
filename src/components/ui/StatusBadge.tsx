import type { TrendStatus } from "@/lib/status";

interface StatusBadgeProps {
  status: TrendStatus;
  size?: "sm" | "md";
}

const STATUS_META: Record<
  TrendStatus,
  { label: string; bg: string; border: string; color: string }
> = {
  improving: {
    label: "Improving",
    bg: "bg-emerald-100",
    border: "border-emerald-400",
    color: "text-emerald-950",
  },
  stable: {
    label: "Stable",
    bg: "bg-slate-100",
    border: "border-slate-400",
    color: "text-slate-900",
  },
  worsening: {
    label: "Worsening",
    bg: "bg-rose-100",
    border: "border-rose-400",
    color: "text-rose-950",
  },
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${sizeClass} ${meta.bg} ${meta.border} ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

export { STATUS_META };
