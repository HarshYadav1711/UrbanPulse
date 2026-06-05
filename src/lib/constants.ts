import type { WhoBand } from "@/lib/schema";

export const WHO_BAND_META: Record<
  WhoBand,
  { label: string; color: string; mapColor: string; swatch: string; bg: string; border: string }
> = {
  excellent: {
    label: "Excellent",
    color: "text-emerald-900",
    mapColor: "#047857",
    swatch: "bg-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
  },
  moderate: {
    label: "Moderate",
    color: "text-amber-900",
    mapColor: "#b45309",
    swatch: "bg-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-300",
  },
  elevated: {
    label: "Elevated",
    color: "text-orange-900",
    mapColor: "#c2410c",
    swatch: "bg-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-300",
  },
  high: {
    label: "High",
    color: "text-rose-900",
    mapColor: "#be123c",
    swatch: "bg-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-300",
  },
};

export const DATA_PATH = "/data/cities.json";

export const SCREENS = [
  { id: "overview", label: "Overview" },
  { id: "compare", label: "Compare" },
  { id: "trends", label: "Trends" },
  { id: "map", label: "Map" },
] as const;
