import fs from "fs";
import path from "path";
import {
  parseCitiesDataset,
  safeParseCitiesDataset,
  type CitiesDataset,
} from "@/lib/schema";

export type LoadResult =
  | { ok: true; data: CitiesDataset }
  | { ok: false; error: string };

function readRawDataset(): unknown {
  const filePath = path.join(process.cwd(), "public", "data", "cities.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("City data file not found at public/data/cities.json");
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/** Server-side loader — validates against schema before returning. */
export function loadCitiesDataset(): LoadResult {
  try {
    const raw = readRawDataset();
    const result = safeParseCitiesDataset(raw);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join("; ");
      return { ok: false, error: `Data contract violation: ${message}` };
    }
    return { ok: true, data: result.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown load error";
    return { ok: false, error: message };
  }
}

/** Strict parse for scripts/tests. */
export function loadCitiesDatasetStrict(): CitiesDataset {
  return parseCitiesDataset(readRawDataset());
}

export function getCityById(data: CitiesDataset, id: string) {
  return data.cities.find((c) => c.id === id);
}
