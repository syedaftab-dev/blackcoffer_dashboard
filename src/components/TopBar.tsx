"use client";

import React, { useState, useEffect } from "react";
import { useFilterStore } from "@/store/filterStore";
import { useTheme } from "@/components/ThemeProvider";

interface TopBarProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TopBar({
  isLoading,
  onRefresh,
}: TopBarProps) {
  const { filters, search, setSearch, toggleMobileSidebar } = useFilterStore();
  const [localSearch, setLocalSearch] = useState(search);
  const { theme, toggleTheme } = useTheme();

  // Keep local search in sync with store
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce search input to avoid re-fetching on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearch]);

  // Current year filter badge summary
  const selectedYears = filters.end_year || [];
  const yearSummary =
    selectedYears.length === 0
      ? "End Year: All"
      : selectedYears.length === 1
      ? `End Year: ${selectedYears[0]}`
      : `Years: ${selectedYears.slice(0, 2).join(", ")}${
          selectedYears.length > 2 ? ` (+${selectedYears.length - 2})` : ""
        }`;

  const activeFilterCount =
    Object.values(filters).reduce((acc, arr) => acc + arr.length, 0) +
    (search.trim() ? 1 : 0);

  return (
    <header
      className="h-16 px-4 sm:px-6 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md gap-3"
      style={{
        background: "var(--bg-page)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Left: Mobile menu toggle, Title & Context Pill */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden p-2 rounded-xl border flex items-center justify-center transition-colors"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
          title="Open filters menu"
          aria-label="Open filters"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1
          className="text-sm sm:text-xl font-bold tracking-tight truncate max-w-[140px] sm:max-w-none"
          style={{ color: "var(--text-primary)" }}
        >
          Insights Dashboard
        </h1>

        {/* Date / Context Pill */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          <svg className="w-3.5 h-3.5" style={{ color: "var(--accent-sage)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>{yearSummary}</span>
          {activeFilterCount > 0 && (
            <>
              <span style={{ color: "var(--text-muted)" }}>&bull;</span>
              <span className="font-semibold" style={{ color: "var(--accent-sage)" }}>
                {activeFilterCount} active
              </span>
            </>
          )}
        </div>
      </div>

      {/* Center/Right: Search, Theme Toggle & Refresh */}
      <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
        {/* Real Functional Search Bar */}
        <div className="relative w-full max-w-xs sm:max-w-sm">
          <svg
            className="w-4 h-4 absolute left-3 top-2.5 pointer-events-none"
            style={{ color: "var(--text-secondary)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search keywords, topics, sectors..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 rounded-full border text-xs focus:outline-none transition-colors shadow-inner"
            style={{
              background: "var(--bg-input)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch("");
                setSearch("");
              }}
              title="Clear search"
              className="absolute right-2.5 top-2 text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ color: "var(--text-secondary)" }}
            >
              &times;
            </button>
          )}
        </div>

        {/* Theme Toggle: Sun/Moon */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          className="h-9 w-9 rounded-full border flex items-center justify-center transition-all hover:scale-105"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {theme === "dark" ? (
            /* Sun icon - shown in dark mode to switch to light */
            <svg
              className="w-4 h-4 theme-toggle-icon"
              style={{ color: "var(--accent-rose)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            /* Moon icon - shown in light mode to switch to dark */
            <svg
              className="w-4 h-4 theme-toggle-icon"
              style={{ color: "var(--accent-sage)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh dashboard data"
          className="h-9 px-3 rounded-full border flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50 shrink-0 hover:opacity-80"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            style={{ color: isLoading ? "var(--accent-sage)" : "currentColor" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="hidden sm:inline font-medium">Refresh</span>
        </button>
      </div>
    </header>
  );
}
