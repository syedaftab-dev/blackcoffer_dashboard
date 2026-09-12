"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useFilterStore } from "@/store/filterStore";
import { FILTER_FIELDS, type FilterField } from "@/lib/schemas/insight";

export function useUrlSync() {
  const searchParams = useSearchParams();
  const { filters, setFilter, search, setSearch } = useFilterStore();
  const isInitialized = useRef(false);

  // On mount: read URL params → store
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    for (const field of FILTER_FIELDS) {
      const value = searchParams.get(field);
      if (value) {
        const values = value.split(",").filter(Boolean);
        if (values.length > 0) {
          setFilter(field as FilterField, values);
        }
      }
    }

    const searchVal = searchParams.get("search");
    if (searchVal) {
      setSearch(searchVal);
    }
  }, [searchParams, setFilter, setSearch]);

  // On filter change: store → URL
  useEffect(() => {
    if (!isInitialized.current) return;

    const params = new URLSearchParams();
    let hasFilters = false;

    for (const field of FILTER_FIELDS) {
      if (filters[field].length > 0) {
        params.set(field, filters[field].join(","));
        hasFilters = true;
      }
    }

    if (search && search.trim() !== "") {
      params.set("search", search.trim());
      hasFilters = true;
    }

    const newUrl = hasFilters ? `?${params.toString()}` : "/";
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", newUrl);
    }
  }, [filters, search]);
}
