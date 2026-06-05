import type { TrendStatus } from "@/lib/status";
import type { PlaceholderVariant } from "@/components/ui/StatePlaceholder";
import { StatePlaceholder } from "@/components/ui/StatePlaceholder";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface InsightCardProps {
  tag?: string;
  title?: string;
  body?: string;
  rule?: string;
  trendStatus?: TrendStatus;
  state?: PlaceholderVariant;
}

export function InsightCard({
  tag,
  title,
  body,
  rule,
  trendStatus,
  state = "ready",
}: InsightCardProps) {
  if (state !== "ready") {
    return (
      <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 shadow-sm">
        <StatePlaceholder
          variant={state}
          title={
            state === "loading"
              ? "Computing insights from city data"
              : state === "empty"
                ? "No insights match current data"
                : "Insights unavailable"
          }
          message={body}
        />
      </article>
    );
  }

  return (
    <article className="flex h-full flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {tag && (
          <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-800">
            {tag}
          </span>
        )}
        {trendStatus && <StatusBadge status={trendStatus} />}
      </div>
      <h3 className="text-sm font-semibold leading-snug text-[var(--ink)]">{title}</h3>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-[var(--ink-secondary)]">{body}</p>
      {rule && (
        <p className="mt-3 border-t border-[var(--line)] pt-3 text-[10px] leading-relaxed text-[var(--ink-muted)]">
          <span className="font-semibold text-[var(--ink-secondary)]">Rule: </span>
          {rule}
        </p>
      )}
    </article>
  );
}
