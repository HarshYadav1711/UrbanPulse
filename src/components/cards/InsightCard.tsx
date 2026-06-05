import type { PlaceholderVariant } from "@/components/ui/StatePlaceholder";
import { StatePlaceholder } from "@/components/ui/StatePlaceholder";

interface InsightCardProps {
  tag?: string;
  title?: string;
  body?: string;
  state?: PlaceholderVariant;
}

export function InsightCard({ tag, title, body, state = "ready" }: InsightCardProps) {
  if (state !== "ready") {
    return (
      <article className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 shadow-sm">
        <StatePlaceholder
          variant={state}
          title={
            state === "loading"
              ? "Generating insights…"
              : state === "empty"
                ? "No insights yet"
                : "Insights unavailable"
          }
          message={body}
        />
      </article>
    );
  }

  return (
    <article className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 shadow-sm">
      {tag && (
        <span className="mb-3 w-fit rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          {tag}
        </span>
      )}
      <h3 className="text-sm font-semibold leading-snug text-[var(--ink)]">
        {title ?? "Insight placeholder"}
      </h3>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-[var(--ink-muted)]">
        {body ??
          "Computed briefs will appear here once the insight engine is wired to the data contract."}
      </p>
    </article>
  );
}
