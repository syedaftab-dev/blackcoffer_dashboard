"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useFilterStore } from "@/store/filterStore";
import type { FilterField } from "@/lib/schemas/insight";
import type { FiltersResponse } from "@/lib/schemas/insight";

interface FilterPanelProps {
  filtersData: FiltersResponse | null;
  isLoading: boolean;
}

const FILTER_CONFIG: {
  field: FilterField;
  label: string;
  searchable: boolean;
}[] = [
  { field: "end_year", label: "End Year", searchable: false },
  { field: "topic", label: "Topic", searchable: true },
  { field: "sector", label: "Sector", searchable: false },
  { field: "region", label: "Region", searchable: false },
  { field: "pestle", label: "PEST", searchable: false },
  { field: "source", label: "Source", searchable: true },
  { field: "country", label: "Country", searchable: false },
];

function getOptionsForField(
  field: FilterField,
  filtersData: FiltersResponse | null
): string[] {
  if (!filtersData) return [];
  switch (field) {
    case "topic":
      return filtersData.topics;
    case "sector":
      return filtersData.sectors;
    case "region":
      return filtersData.regions;
    case "pestle":
      return filtersData.pestles;
    case "source":
      return filtersData.sources;
    case "country":
      return filtersData.countries;
    case "end_year":
      return filtersData.end_years.map(String);
    default:
      return [];
  }
}

// --- Multi-select dropdown component ---
function MultiSelectDropdown({
  field,
  label,
  options,
  searchable,
}: {
  field: FilterField;
  label: string;
  options: string[];
  searchable: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useFilterStore((s) => s.filters[field]);
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const clearFilter = useFilterStore((s) => s.clearFilter);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-150"
        style={{
          background: "var(--bg-secondary)",
          border: `1px solid ${selected.length > 0 ? "var(--border-active)" : "var(--border-subtle)"}`,
          color: selected.length > 0 ? "var(--accent)" : "var(--text-secondary)",
        }}
      >
        <span className="truncate">
          {selected.length === 0
            ? label
            : `${label} (${selected.length})`}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`ml-2 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
          style={{ fill: "currentColor" }}
        >
          <path d="M2 4L6 8L10 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.slice(0, 3).map((val) => (
            <span
              key={val}
              className="filter-tag"
              onClick={() => toggleFilterValue(field, val)}
            >
              {val.length > 16 ? val.slice(0, 16) + "…" : val}
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path
                  d="M2 2L8 8M8 2L2 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </span>
          ))}
          {selected.length > 3 && (
            <span
              className="filter-tag"
              onClick={() => clearFilter(field)}
            >
              +{selected.length - 3} more ×
            </span>
          )}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="dropdown-menu absolute z-50 w-full mt-1" style={{ minWidth: "200px" }}>
          {searchable && (
            <div className="p-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full px-2 py-1.5 rounded text-sm outline-none"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-subtle)",
                }}
              />
            </div>
          )}
          <div className="max-h-[240px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No matches
              </div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt}
                  className={`dropdown-item ${selected.includes(opt) ? "selected" : ""}`}
                  onClick={() => toggleFilterValue(field, opt)}
                >
                  <div
                    className="w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: selected.includes(opt)
                        ? "var(--accent)"
                        : "var(--text-muted)",
                      background: selected.includes(opt)
                        ? "var(--accent)"
                        : "transparent",
                    }}
                  >
                    {selected.includes(opt) && (
                      <svg width="8" height="8" viewBox="0 0 8 8">
                        <path
                          d="M1.5 4L3 5.5L6.5 2"
                          stroke="var(--bg-primary)"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="truncate">{opt}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FilterPanel({ filtersData, isLoading }: FilterPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const clearFilters = useFilterStore((s) => s.clearFilters);
  const filters = useFilterStore((s) => s.filters);

  const hasActiveFilters = Object.values(filters).some((v) => v.length > 0);
  const activeCount = Object.values(filters).reduce(
    (acc, v) => acc + v.length,
    0
  );

  const handleClearAll = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  return (
    <aside
      className="w-full lg:w-64 xl:w-72 flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Filters
          </h2>
          {activeCount > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
              }}
            >
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="text-xs transition-colors duration-150 hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden p-1 rounded"
            style={{ color: "var(--text-muted)" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className={`transition-transform ${isCollapsed ? "" : "rotate-180"}`}
            >
              <path
                d="M4 6L8 10L12 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter dropdowns */}
      <div
        className={`space-y-3 ${isCollapsed ? "hidden" : "block"} lg:block`}
      >
        {isLoading
          ? FILTER_CONFIG.map((cfg) => (
              <div key={cfg.field}>
                <div
                  className="skeleton h-10 w-full"
                  style={{ borderRadius: "8px" }}
                />
              </div>
            ))
          : FILTER_CONFIG.map((cfg) => (
              <MultiSelectDropdown
                key={cfg.field}
                field={cfg.field}
                label={cfg.label}
                options={getOptionsForField(cfg.field, filtersData)}
                searchable={cfg.searchable}
              />
            ))}
      </div>
    </aside>
  );
}
