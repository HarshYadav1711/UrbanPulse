import Link from "next/link";
import { SCREENS } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface-elevated)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white">
            UP
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[var(--ink)]">UrbanPulse</p>
            <p className="text-xs text-[var(--ink-muted)]">Environmental intelligence layer</p>
          </div>
        </div>
        <nav className="hidden items-center gap-5 text-xs font-medium text-[var(--ink-muted)] sm:flex">
          {SCREENS.map((screen) => (
            <Link key={screen.id} href={`#${screen.id}`} className="hover:text-[var(--ink)]">
              {screen.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-[var(--line)] bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-light)]">
            Global city cohort · 24 markets
          </p>
          <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
            Livability scores tell one story. Air quality tells another.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)]">
            UrbanPulse overlays public PM2.5 exposure on baseline city rankings so planners,
            policymakers, and residents see where environmental risk changes the picture.
          </p>
        </div>
      </div>
    </header>
  );
}
