import Link from "next/link";
import { SCREENS } from "@/lib/constants";

const SCREEN_COUNT = SCREENS.length;

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface-elevated)]">
      <a
        href="#overview"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to overview
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-sm font-bold text-white"
            aria-hidden="true"
          >
            UP
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[var(--ink)]">UrbanPulse</p>
            <p className="text-xs text-[var(--ink-secondary)]">Environmental intelligence layer</p>
          </div>
        </div>
        <nav
          className="hidden items-center gap-5 text-xs font-medium text-[var(--ink-secondary)] sm:flex"
          aria-label="Main sections"
        >
          {SCREENS.map((screen) => (
            <Link
              key={screen.id}
              href={`#${screen.id}`}
              className="rounded hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              {screen.label}
            </Link>
          ))}
        </nav>
      </div>
      <nav
        className="flex gap-2 overflow-x-auto border-t border-[var(--line)] px-4 py-2 sm:hidden"
        aria-label="Main sections"
      >
        {SCREENS.map((screen) => (
          <Link
            key={screen.id}
            href={`#${screen.id}`}
            className="shrink-0 rounded-full border border-[var(--line)] px-3 py-1 text-[11px] font-medium text-[var(--ink-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            {screen.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-[var(--line)] bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-light)]">
            {SCREEN_COUNT} views · PM2.5 + livability cohort
          </p>
          <h1 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">
            See where air quality changes the city ranking story
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-secondary)]">
            UrbanPulse combines public PM2.5 data with baseline livability scores. Each status and
            insight is computed from published thresholds — no black-box scoring.
          </p>
        </div>
      </div>
    </header>
  );
}
