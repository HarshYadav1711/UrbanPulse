import type { PlaceholderVariant } from "@/components/ui/StatePlaceholder";
import { StatePlaceholder } from "@/components/ui/StatePlaceholder";

interface MetricCardProps {
  label: string;
  value?: string;
  detail?: string;
  state?: PlaceholderVariant;
}

export function MetricCard({ label, value, detail, state = "ready" }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] px-4 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </p>
      {state === "ready" && value ? (
        <>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-[var(--accent)]">
            {value}
          </p>
          {detail && <p className="mt-1 text-xs text-[var(--ink-muted)]">{detail}</p>}
        </>
      ) : state === "loading" ? (
        <StatePlaceholder variant="loading" title="Loading metric…" />
      ) : state === "empty" ? (
        <StatePlaceholder variant="empty" title="No data" message={detail} />
      ) : (
        <StatePlaceholder variant="error" title="Metric unavailable" message={detail} />
      )}
    </article>
  );
}
