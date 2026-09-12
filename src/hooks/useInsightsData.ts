"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  isInitialLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useInsightsData(): UseInsightsDataReturn {
  const [aggregateData, setAggregateData] = useState<AggregateResponse | null>(null);
  const [filtersData, setFiltersData] = useState<FiltersResponse | null>(null);
  const [insightsList, setInsightsList] = useState<InsightResponse[]>([]);
  const [totalFilteredCount, setTotalFilteredCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useFilterStore((s) => s.getQueryString());
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch available filter options ONCE on mount (static metadata, never changes per filter)
  useEffect(() => {
    let active = true;
    async function fetchFiltersOnce() {
      try {
        const res = await fetch("/api/insights/filters");
        if (!res.ok) throw new Error(`Filters API failed: ${res.status}`);
        const data = await res.json();
        if (active) {
          setFiltersData(data);
        }
      } catch (err) {
        console.error("[useInsightsData] Failed to load filter options:", err);
      }
    }
    fetchFiltersOnce();
    return () => {
      active = false;
    };
  }, []);

  // 2. Fetch filtered aggregate & insight rows whenever active filters change
  const fetchData = useCallback(async () => {
    // Abort any in-flight request if the user clicked another filter
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const qs = queryString ? `?${queryString}` : "";
      const listQs = queryString ? `?${queryString}&limit=100` : "?limit=100";

      const [aggRes, listRes] = await Promise.all([
        fetch(`/api/insights/aggregate${qs}`, { signal: controller.signal }),
        fetch(`/api/insights${listQs}`, { signal: controller.signal }),
      ]);

      if (!aggRes.ok) throw new Error(`Aggregate API failed: ${aggRes.status}`);
      if (!listRes.ok) throw new Error(`Insights List API failed: ${listRes.status}`);

      const [aggData, listData] = await Promise.all([
        aggRes.json(),
        listRes.json(),
      ]);

      setAggregateData(aggData);
      setInsightsList(listData.data || []);
      setTotalFilteredCount(listData.count || 0);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Request was superseded by a newer filter click
      }
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("[useInsightsData] Error:", message);
      setError(message);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
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
    isInitialLoading,
    error,
    retry: fetchData,
  };
}
