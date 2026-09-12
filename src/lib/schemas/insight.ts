import { z } from "zod";

// --- Filterable field names ---
export const FILTER_FIELDS = [
  "topic",
  "sector",
  "region",
  "pestle",
  "source",
  "country",
  "end_year",
] as const;

export type FilterField = (typeof FILTER_FIELDS)[number];

// --- API Query Params Schema ---
export const InsightQuerySchema = z
  .object({
    topic: z.string().optional(),
    sector: z.string().optional(),
    region: z.string().optional(),
    pestle: z.string().optional(),
    source: z.string().optional(),
    country: z.string().optional(),
    end_year: z
      .string()
      .refine(
        (val) => {
          if (!val) return true;
          return val.split(",").every((y) => !isNaN(Number(y.trim())) && Number(y.trim()) > 0);
        },
        { message: "end_year must be valid comma-separated numeric years" }
      )
      .optional(),
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(1000).optional(),
    page: z.coerce.number().int().min(1).optional(),
    cacheBust: z.string().optional(),
  })
  .strict();

export type InsightQuery = z.infer<typeof InsightQuerySchema>;

// --- Single Insight Response ---
export const InsightResponseSchema = z.object({
  _id: z.string(),
  end_year: z.number().nullable(),
  intensity: z.number().nullable(),
  sector: z.string(),
  topic: z.string(),
  insight: z.string(),
  url: z.string(),
  region: z.string(),
  start_year: z.number().nullable(),
  impact: z.number().nullable(),
  added: z.string(),
  published: z.string(),
  country: z.string(),
  relevance: z.number().nullable(),
  pestle: z.string(),
  source: z.string(),
  title: z.string(),
  likelihood: z.number().nullable(),
});

export type InsightResponse = z.infer<typeof InsightResponseSchema>;

// --- Filters Response ---
export const FiltersResponseSchema = z.object({
  topics: z.array(z.string()),
  sectors: z.array(z.string()),
  regions: z.array(z.string()),
  pestles: z.array(z.string()),
  sources: z.array(z.string()),
  countries: z.array(z.string()),
  end_years: z.array(z.number()),
});

export type FiltersResponse = z.infer<typeof FiltersResponseSchema>;

// --- Aggregation Response ---
export const IntensityByYearSchema = z.object({
  year: z.number(),
  avgIntensity: z.number(),
  avgLikelihood: z.number().optional(),
  count: z.number(),
});

export const TopicCountSchema = z.object({
  topic: z.string(),
  count: z.number(),
});

export const RegionYearIntensitySchema = z.object({
  region: z.string(),
  year: z.number(),
  avgIntensity: z.number(),
  count: z.number(),
});

export const CountryLikelihoodSchema = z.object({
  country: z.string(),
  avgLikelihood: z.number(),
  count: z.number(),
});

export const SectorCountSchema = z.object({
  sector: z.string(),
  count: z.number(),
});

export const AggregateResponseSchema = z.object({
  totalCount: z.number().optional(),
  intensityByYear: z.array(IntensityByYearSchema),
  topicCounts: z.array(TopicCountSchema),
  regionYearIntensity: z.array(RegionYearIntensitySchema),
  countryLikelihood: z.array(CountryLikelihoodSchema),
  sectorCounts: z.array(SectorCountSchema),
});

export type AggregateResponse = z.infer<typeof AggregateResponseSchema>;

// --- Helper: Build MongoDB match query from query params ---
export function buildMatchQuery(
  params: InsightQuery
): Record<string, unknown> {
  const match: Record<string, unknown> = {};

  for (const field of FILTER_FIELDS) {
    const value = params[field];
    if (value && value.trim() !== "") {
      const values = value.split(",").map((v) => v.trim()).filter(Boolean);
      if (field === "end_year") {
        const numericValues = values.map(Number).filter((n) => !isNaN(n));
        if (numericValues.length > 0) {
          match[field] = { $in: numericValues };
        }
      } else {
        match[field] = { $in: values };
      }
    }
  }

  if (params.search && params.search.trim() !== "") {
    const q = params.search.trim();
    const regex = { $regex: q, $options: "i" };
    match.$or = [
      { title: regex },
      { insight: regex },
      { topic: regex },
      { sector: regex },
      { country: regex },
      { region: regex },
      { pestle: regex },
      { source: regex },
    ];
  }

  return match;
}
