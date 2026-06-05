import type { WhoBand } from "@/lib/schema";
import { WHO_BAND_META } from "@/lib/constants";

interface WhoBandBadgeProps {
  band: WhoBand;
  size?: "sm" | "md";
}

export function WhoBandBadge({ band, size = "sm" }: WhoBandBadgeProps) {
  const meta = WHO_BAND_META[band];
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClass} ${meta.bg} ${meta.border} ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}
