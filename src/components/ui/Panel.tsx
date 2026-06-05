import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  description?: string;
  id?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, description, id, action, children }: PanelProps) {
  return (
    <section
      id={id}
      className="rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-[var(--ink)]">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
