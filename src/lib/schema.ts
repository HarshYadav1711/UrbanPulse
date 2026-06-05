import { z } from "zod";

/** WHO 2021 PM2.5 exposure tier derived from annual mean concentration. */
export const whoBandSchema = z.enum(["excellent", "moderate", "elevated", "high"]);

export const monthlyPm25Schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM"),
  pm25: z.number().nonnegative(),
});

export const airQualitySchema = z.object({
  pm25AnnualMean: z.number().nonnegative(),
  pm25Rolling90Day: z.number().nonnegative(),
  observationCoverage: z.number().min(0).max(1),
  whoBand: whoBandSchema,
  riskLabel: z.string().min(1),
  trendPercent3Mo: z.number(),
  monthlySeries: z.array(monthlyPm25Schema).min(1),
  effectiveRank: z.number().int().positive(),
  rankDelta: z.number().int(),
  dataSource: z.string().min(1),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const cityRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string().min(1),
  region: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  livabilityScore: z.number().min(0).max(100),
  livabilityRank: z.number().int().positive(),
  airQuality: airQualitySchema,
});

export const citiesDatasetSchema = z.object({
  generatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  methodology: z.object({
    airQuality: z.string().min(1),
    whoThresholds: z.string().min(1),
    livabilityBaseline: z.string().min(1),
  }),
  cities: z.array(cityRecordSchema).min(1),
});

export type WhoBand = z.infer<typeof whoBandSchema>;
export type MonthlyPm25 = z.infer<typeof monthlyPm25Schema>;
export type AirQuality = z.infer<typeof airQualitySchema>;
export type CityRecord = z.infer<typeof cityRecordSchema>;
export type CitiesDataset = z.infer<typeof citiesDatasetSchema>;

export function parseCitiesDataset(raw: unknown): CitiesDataset {
  return citiesDatasetSchema.parse(raw);
}

export function safeParseCitiesDataset(raw: unknown) {
  return citiesDatasetSchema.safeParse(raw);
}
