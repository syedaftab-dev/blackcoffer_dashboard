import { unstable_cache } from "next/cache";
import { fetchInsights, fetchAggregateData, fetchFiltersData } from "@/lib/dataService";
import type {
  InsightQuery,
  AggregateResponse,
  FiltersResponse,
  InsightResponse,
} from "@/lib/schemas/insight";

/**
 * Built-in Next.js caching layer using next/cache `unstable_cache`.
 * Caches query results directly inside Next.js's native Data Cache,
 * eliminating any external Redis dependency while preserving high-speed responses.
 */

export const getCachedInsights = (
  query: InsightQuery
): Promise<{ data: InsightResponse[]; count: number }> => {
  const queryKey = JSON.stringify(query);
  return unstable_cache(
    async () => fetchInsights(query),
    ["insights-data", queryKey],
    {
      revalidate: 300, // 5 minutes
      tags: ["insights"],
    }
  )();
};

export const getCachedAggregateData = (
  query: InsightQuery
): Promise<AggregateResponse> => {
  const queryKey = JSON.stringify(query);
  return unstable_cache(
    async () => fetchAggregateData(query),
    ["insights-aggregate", queryKey],
    {
      revalidate: 300, // 5 minutes
      tags: ["aggregate", "insights"],
    }
  )();
};

export const getCachedFiltersData = (): Promise<FiltersResponse> => {
  return unstable_cache(
    async () => fetchFiltersData(),
    ["insights-filters"],
    {
      revalidate: 600, // 10 minutes
      tags: ["filters", "insights"],
    }
  )();
};

/**
 * Standard HTTP Cache-Control headers for browser and Edge CDN caching
 */
export const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};
