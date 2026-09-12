"use client";

import { useState, useEffect, useCallback } from "react";
import { useFilterStore } from "@/store/filterStore";
import type {
  AggregateResponse,
  FiltersResponse,
  InsightResponse,
} from "@/lib/schemas/insight";

interface UseInsightsDataReturn {
  aggregateData: AggregateResponse | null;
  filtersData: FiltersResponse | null;
  insightsList: InsightResponse[];
  totalFilteredCount: number;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useInsightsData(): UseInsightsDataReturn {
  const [aggregateData, setAggregateData] = useState<AggregateResponse | null>(null);
  const [filtersData, setFiltersData] = useState<FiltersResponse | null>(null);
  const [insightsList, setInsightsList] = useState<InsightResponse[]>([]);
  const [totalFilteredCount, setTotalFilteredCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useFilterStore((s) => s.getQueryString());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const qs = queryString ? `?${queryString}` : "";

      const [aggRes, filterRes, listRes] = await Promise.all([
        fetch(`/api/insights/aggregate${qs}`),
        fetch(`/api/insights/filters`),
        fetch(`/api/insights${qs}`),
      ]);

      if (!aggRes.ok) throw new Error(`Aggregate API failed: ${aggRes.status}`);
      if (!filterRes.ok) throw new Error(`Filters API failed: ${filterRes.status}`);
      if (!listRes.ok) throw new Error(`Insights List API failed: ${listRes.status}`);

      const [aggData, filterData, listData] = await Promise.all([
        aggRes.json(),
        filterRes.json(),
        listRes.json(),
      ]);

      setAggregateData(aggData);
      setFiltersData(filterData);
      setInsightsList(listData.data || []);
      setTotalFilteredCount(listData.count || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useInsightsData] Error:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    aggregateData,
    filtersData,
    insightsList,
    totalFilteredCount,
    isLoading,
    error,
    retry: fetchData,
  };
}
