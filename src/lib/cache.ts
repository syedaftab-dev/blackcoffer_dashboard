import { unstable_cache } from "next/cache";
import { fetchInsights, fetchAggregateData, fetchFiltersData } from "@/lib/dataService";
import type {
  InsightQuery,
  AggregateResponse,
  FiltersResponse,
  InsightResponse,
} from "@/lib/schemas/insight";

/**
 * High-performance dual-tier caching layer:
 * Tier 1: In-memory LRU/TTL cache for sub-millisecond warm-lambda responses.
 * Tier 2: Next.js Data Cache (`unstable_cache`) across serverless invocations.
 * Tier 3: Edge CDN & Browser HTTP Cache-Control headers.
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();

function getFromMemory<T>(key: string): T | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memoryStore.delete(key);
    return null;
  }
  return entry.data as T;
}

function setToMemory<T>(key: string, data: T, ttlSeconds: number): void {
  if (memoryStore.size > 250) {
    const firstKey = memoryStore.keys().next().value;
    if (firstKey) memoryStore.delete(firstKey);
  }
  memoryStore.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

export const getCachedInsights = async (
  query: InsightQuery
): Promise<{ data: InsightResponse[]; count: number }> => {
  const queryKey = JSON.stringify(query);
  const memKey = `insights:${queryKey}`;
  const inMem = getFromMemory<{ data: InsightResponse[]; count: number }>(memKey);
  if (inMem) return inMem;

  const result = await unstable_cache(
    async () => fetchInsights(query),
    ["insights-data", queryKey],
    {
      revalidate: 300, // 5 minutes
      tags: ["insights"],
    }
  )();

  setToMemory(memKey, result, 300);
  return result;
};

export const getCachedAggregateData = async (
  query: InsightQuery
): Promise<AggregateResponse> => {
  const queryKey = JSON.stringify(query);
  const memKey = `aggregate:${queryKey}`;
  const inMem = getFromMemory<AggregateResponse>(memKey);
  if (inMem) return inMem;

  const result = await unstable_cache(
    async () => fetchAggregateData(query),
    ["insights-aggregate", queryKey],
    {
      revalidate: 300, // 5 minutes
      tags: ["aggregate", "insights"],
    }
  )();

  setToMemory(memKey, result, 300);
  return result;
};

export const getCachedFiltersData = async (): Promise<FiltersResponse> => {
  const memKey = "filters:static";
  const inMem = getFromMemory<FiltersResponse>(memKey);
  if (inMem) return inMem;

  const result = await unstable_cache(
    async () => fetchFiltersData(),
    ["insights-filters"],
    {
      revalidate: 600, // 10 minutes
      tags: ["filters", "insights"],
    }
  )();

  setToMemory(memKey, result, 600);
  return result;
};

/**
 * Standard HTTP Cache-Control headers for browser and Edge CDN caching
 */
export const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};
