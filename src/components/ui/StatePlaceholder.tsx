export type PlaceholderVariant = "loading" | "empty" | "error" | "ready";

interface StatePlaceholderProps {
  variant: Exclude<PlaceholderVariant, "ready">;
  title: string;
  message?: string;
}

const VARIANT_STYLES = {
  loading: {
    border: "border-slate-200",
    bg: "bg-slate-50",
    dot: "bg-slate-400 animate-pulse",
  },
  empty: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  error: {
    border: "border-rose-200",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
  },
} as const;

export function StatePlaceholder({ variant, title, message }: StatePlaceholderProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      role="status"
      className={`flex min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center ${styles.border} ${styles.bg}`}
    >
      <span className={`mb-3 inline-block h-2 w-2 rounded-full ${styles.dot}`} />
      <p className="text-sm font-medium text-[var(--ink)]">{title}</p>
      {message && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-[var(--ink-muted)]">
          {message}
        </p>
      )}
    </div>
  );
}
