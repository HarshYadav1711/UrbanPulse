import type { WhoBand } from "@/lib/schema";

export const WHO_BAND_META: Record<
  WhoBand,
  { label: string; color: string; mapColor: string; swatch: string; bg: string; border: string }
> = {
  excellent: {
    label: "Excellent",
    color: "text-emerald-700",
    mapColor: "#059669",
    swatch: "bg-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  moderate: {
    label: "Moderate",
    color: "text-amber-700",
    mapColor: "#d97706",
    swatch: "bg-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  elevated: {
    label: "Elevated",
    color: "text-orange-700",
    mapColor: "#ea580c",
    swatch: "bg-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  high: {
    label: "High",
    color: "text-rose-700",
    mapColor: "#e11d48",
    swatch: "bg-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

export const DATA_PATH = "/data/cities.json";

export const SCREENS = [
  { id: "overview", label: "Overview" },
  { id: "compare", label: "Compare" },
  { id: "trends", label: "Trends" },
  { id: "map", label: "Map" },
] as const;
