"use client";

import React, { useState, useRef, useEffect } from "react";
import { useFilterStore } from "@/store/filterStore";
import type { FilterField, FiltersResponse } from "@/lib/schemas/insight";

interface SidebarProps {
  filtersData: FiltersResponse | null;
  isLoading: boolean;
}

interface NavCategory {
  field: FilterField;
  label: string;
  searchable: boolean;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    field: "end_year",
    label: "End Year",
    searchable: false,
    icon: (active) => (
      <svg className="w-4 h-4" style={{ color: active ? "var(--accent-sage)" : "var(--text-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    field: "topic",
    label: "Topic",
    searchable: true,
    icon: (active) => (
      <svg className="w-4 h-4" style={{ color: active ? "var(--accent-sage)" : "var(--text-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    field: "sector",
    label: "Sector",
    searchable: false,
    icon: (active) => (
      <svg className="w-4 h-4" style={{ color: active ? "var(--accent-sage)" : "var(--text-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    field: "region",
    label: "Region",
    searchable: false,
    icon: (active) => (
      <svg className="w-4 h-4" style={{ color: active ? "var(--accent-sage)" : "var(--text-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    field: "pestle",
    label: "Pestle",
    searchable: false,
    icon: (active) => (
      <svg className="w-4 h-4" style={{ color: active ? "var(--accent-sage)" : "var(--text-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    field: "source",
    label: "Source",
    searchable: true,
    icon: (active) => (
      <svg className="w-4 h-4" style={{ color: active ? "var(--accent-sage)" : "var(--text-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    field: "country",
    label: "Country",
    searchable: false,
    icon: (active) => (
      <svg className="w-4 h-4" style={{ color: active ? "var(--accent-sage)" : "var(--text-secondary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
      </svg>
    ),
  },
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

export default function Sidebar({ filtersData, isLoading }: SidebarProps) {
  const [activeCategory, setActiveCategory] = useState<FilterField | null>("sector");
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const {
    filters,
    toggleFilterValue,
    clearFilter,
    clearFilters,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  } = useFilterStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Total active filter count
  const totalActive = Object.values(filters).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  // Focus search input when changing to a searchable category
  useEffect(() => {
    if (activeCategory === "topic" || activeCategory === "source") {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [activeCategory]);

  const currentOptions = activeCategory ? getOptionsForField(activeCategory, filtersData) : [];
  const currentSearch = activeCategory ? searchQueries[activeCategory] || "" : "";
  
  const filteredOptions = currentSearch
    ? currentOptions.filter((opt) => opt.toLowerCase().includes(currentSearch.toLowerCase()))
    : currentOptions;

  const handleSearchChange = (val: string) => {
    if (!activeCategory) return;
    setSearchQueries((prev) => ({ ...prev, [activeCategory]: val }));
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 md:static md:sticky md:top-0 w-[260px] md:w-[230px] shrink-0 border-r flex flex-col h-screen select-none transition-transform duration-300 ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
        style={{
          background: "var(--bg-sidebar)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Brand area */}
        <div
          className="px-5 py-5 border-b flex items-center justify-between"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: "linear-gradient(135deg, var(--accent-sage), var(--accent-rose))",
              }}
            >
              <svg className="w-4 h-4 text-white font-bold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                Blackcoffer
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-sage)" }}></span>
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Analytics Suite</div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden w-7 h-7 rounded-lg border flex items-center justify-center text-sm transition-opacity hover:opacity-80"
            style={{
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
              background: "var(--bg-card)",
            }}
            title="Close menu"
          >
            &times;
          </button>
        </div>

      {/* Main section label */}
      <div className="px-5 pt-5 pb-2">
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Filters &amp; Dimensions
        </div>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        {NAV_CATEGORIES.map((cat) => {
          const isSelected = activeCategory === cat.field;
          const selectedValues = filters[cat.field] || [];
          const count = selectedValues.length;

          return (
            <div key={cat.field} className="relative">
              <button
                onClick={() => setActiveCategory(isSelected ? null : cat.field)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150"
                style={{
                  background: isSelected
                    ? "var(--accent-sage-dim)"
                    : count > 0
                    ? "var(--bg-card)"
                    : "transparent",
                  color: isSelected || count > 0 ? "var(--text-primary)" : "var(--text-secondary)",
                  border: isSelected
                    ? "1px solid var(--accent-sage-border)"
                    : count > 0
                    ? "1px solid var(--border-subtle)"
                    : "1px solid transparent",
                }}
              >
                <div className="flex items-center gap-2.5">
                  {cat.icon(isSelected || count > 0)}
                  <span className="truncate">{cat.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {count > 0 && (
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white leading-none"
                      style={{ background: "var(--accent-sage)" }}
                    >
                      {count}
                    </span>
                  )}
                  <svg
                    className="w-3.5 h-3.5 transition-transform duration-200"
                    style={{
                      color: isSelected ? "var(--accent-sage)" : "var(--text-secondary)",
                      transform: isSelected ? "rotate(90deg)" : "none",
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Filter Panel (Inline Drawer) */}
              {isSelected && (
                <div
                  className="mt-1.5 mb-2.5 p-2.5 rounded-xl border shadow-xl text-xs"
                  style={{
                    background: "var(--bg-page)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  {/* Category header actions */}
                  <div
                    className="flex items-center justify-between pb-2 mb-2 border-b"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {currentOptions.length} available
                    </span>
                    {selectedValues.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFilter(cat.field);
                        }}
                        className="text-[10px] hover:underline"
                        style={{ color: "var(--accent-rose)" }}
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Search input for searchable fields */}
                  {cat.searchable && (
                    <div className="relative mb-2">
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder={`Search ${cat.label.toLowerCase()}...`}
                        value={currentSearch}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-7 pr-2.5 py-1.5 rounded-lg border text-xs focus:outline-none"
                        style={{
                          background: "var(--bg-input)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-primary)",
                        }}
                      />
                      <svg
                        className="w-3.5 h-3.5 absolute left-2 top-2.5"
                        style={{ color: "var(--text-secondary)" }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  )}

                  {/* Options List */}
                  <div className="max-h-44 overflow-y-auto space-y-0.5 pr-1">
                    {isLoading ? (
                      <div className="py-4 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                        Loading...
                      </div>
                    ) : filteredOptions.length === 0 ? (
                      <div className="py-3 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
                        No matches
                      </div>
                    ) : (
                      filteredOptions.map((option) => {
                        const isChecked = selectedValues.includes(option);
                        return (
                          <div
                            key={option}
                            onClick={() => toggleFilterValue(cat.field, option)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleFilterValue(cat.field, option);
                              }
                            }}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-[11px]"
                            style={{
                              background: isChecked ? "var(--accent-sage-dim)" : "transparent",
                              color: isChecked ? "var(--text-primary)" : "var(--text-secondary)",
                              fontWeight: isChecked ? 500 : 400,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="rounded w-3 h-3 cursor-pointer pointer-events-none"
                              style={{
                                accentColor: "var(--accent-sage)",
                              }}
                            />
                            <span className="truncate">{option}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom info & reset action */}
      <div
        className="p-3 border-t space-y-2 transition-colors duration-300"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--bg-sidebar)",
        }}
      >
        {totalActive > 0 && (
          <button
            onClick={clearFilters}
            className="w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: "var(--accent-rose-dim)",
              borderColor: "var(--accent-rose-border)",
              color: "var(--accent-rose)",
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Filters ({totalActive})
          </button>
        )}

        <div className="flex items-center justify-between px-2 pt-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--status-success)" }} />
            Live DB &amp; Cache
          </span>
          <span>1,000 pts</span>
        </div>
      </div>
    </aside>
  </>
  );
}
