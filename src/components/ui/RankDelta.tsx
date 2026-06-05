interface RankDeltaProps {
  delta: number;
  baselineRank: number;
  effectiveRank: number;
}

export function RankDelta({ delta, baselineRank, effectiveRank }: RankDeltaProps) {
  if (delta === 0) {
    return (
      <span className="font-mono text-xs text-[var(--ink-muted)]">
        #{baselineRank} → #{effectiveRank}
      </span>
    );
  }

  const isPenalty = delta > 0;
  const color = isPenalty ? "text-rose-800" : "text-emerald-800";
  const arrow = isPenalty ? "↓" : "↑";

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${color}`}>
      <span>
        #{baselineRank} → #{effectiveRank}
      </span>
      <span
        className={`rounded px-1.5 py-0.5 font-sans font-medium ${isPenalty ? "bg-rose-100" : "bg-emerald-100"}`}
      >
        {arrow} {Math.abs(delta)}
      </span>
    </span>
  );
}
