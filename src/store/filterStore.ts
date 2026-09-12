"use client";

import { create } from "zustand";
import { FILTER_FIELDS, type FilterField } from "@/lib/schemas/insight";

export interface FilterState {
  filters: Record<FilterField, string[]>;
  search: string;
  isMobileSidebarOpen: boolean;
  setFilter: (field: FilterField, values: string[]) => void;
  toggleFilterValue: (field: FilterField, value: string) => void;
  setSearch: (search: string) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  clearFilters: () => void;
  clearFilter: (field: FilterField) => void;
  getQueryString: () => string;
}

function createEmptyFilters(): Record<FilterField, string[]> {
  const filters: Partial<Record<FilterField, string[]>> = {};
  for (const field of FILTER_FIELDS) {
    filters[field] = [];
  }
  return filters as Record<FilterField, string[]>;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  filters: createEmptyFilters(),
  search: "",
  isMobileSidebarOpen: false,

  setFilter: (field, values) =>
    set((state) => ({
      filters: { ...state.filters, [field]: values },
    })),

  toggleFilterValue: (field, value) =>
    set((state) => {
      const current = state.filters[field];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { filters: { ...state.filters, [field]: next } };
    }),

  setSearch: (search) => set({ search }),

  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),

  toggleMobileSidebar: () =>
    set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),

  clearFilters: () => set({ filters: createEmptyFilters(), search: "" }),

  clearFilter: (field) =>
    set((state) => ({
      filters: { ...state.filters, [field]: [] },
    })),

  getQueryString: () => {
    const { filters, search } = get();
    const params = new URLSearchParams();
    for (const field of FILTER_FIELDS) {
      if (filters[field].length > 0) {
        params.set(field, filters[field].join(","));
      }
    }
    if (search && search.trim() !== "") {
      params.set("search", search.trim());
    }
    return params.toString();
  },
}));
