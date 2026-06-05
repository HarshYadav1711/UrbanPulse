import type { ReactNode } from "react";

export type PlaceholderVariant = "loading" | "empty" | "error" | "ready";

interface StatePlaceholderProps {
  variant: Exclude<PlaceholderVariant, "ready">;
  title: string;
  message?: string;
  action?: ReactNode;
}

const VARIANT_STYLES = {
  loading: {
    border: "border-slate-300",
    bg: "bg-slate-50",
    dot: "bg-slate-500 animate-pulse",
  },
  empty: {
    border: "border-amber-300",
    bg: "bg-amber-50",
    dot: "bg-amber-600",
  },
  error: {
    border: "border-rose-300",
    bg: "bg-rose-50",
    dot: "bg-rose-600",
  },
} as const;

export function StatePlaceholder({ variant, title, message, action }: StatePlaceholderProps) {
  const styles = VARIANT_STYLES[variant];
  const className = `flex min-h-[120px] flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center sm:min-h-[140px] sm:py-10 ${styles.border} ${styles.bg}`;

  const content = (
    <>
      <span className={`mb-3 inline-block h-2 w-2 rounded-full ${styles.dot}`} aria-hidden="true" />
      <p className="text-sm font-medium text-[var(--ink)]">{title}</p>
      {message && (
        <p className="mt-1 max-w-md text-xs leading-relaxed text-[var(--ink-secondary)]">
          {message}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </>
  );

  if (variant === "error") {
    return (
      <div role="alert" className={className}>
        {content}
      </div>
    );
  }

  return (
    <div role="status" className={className}>
      {content}
    </div>
  );
}
