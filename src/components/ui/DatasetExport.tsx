interface DatasetExportProps {
  generatedAt: string;
}

const EXPORT_LINK_CLASS =
  "inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]";

export function DatasetExport({ generatedAt }: DatasetExportProps) {
  const dateSlug = generatedAt;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-[var(--ink-muted)]">
        Download the cleaned cohort for spreadsheet analysis, briefing packs, or pipeline audit.
      </p>
      <div className="flex flex-wrap gap-2">
        <a
          href="/data/cities.csv"
          download={`urbanpulse-cities-${dateSlug}.csv`}
          className={EXPORT_LINK_CLASS}
        >
          <DownloadIcon />
          CSV
        </a>
        <a
          href="/data/cities.json"
          download={`urbanpulse-cities-${dateSlug}.json`}
          className={EXPORT_LINK_CLASS}
        >
          <DownloadIcon />
          JSON
        </a>
        <a
          href="/data/data_quality.json"
          download={`urbanpulse-quality-${dateSlug}.json`}
          className={EXPORT_LINK_CLASS}
        >
          <DownloadIcon />
          Quality report
        </a>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className="shrink-0 text-[var(--ink-secondary)]"
    >
      <path
        d="M6 1v6.5M6 7.5L3.5 5M6 7.5L8.5 5M2 10h8"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
