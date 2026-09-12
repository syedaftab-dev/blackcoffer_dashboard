"use client";

import React, { Suspense } from "react";
import { useInsightsData } from "@/hooks/useInsightsData";
import { useUrlSync } from "@/hooks/useUrlSync";
import { useFilterStore } from "@/store/filterStore";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import KpiCards from "@/components/KpiCards";
import IntensityTrendChart from "@/components/charts/IntensityTrendChart";
import InsightsTable from "@/components/InsightsTable";
import SectorBreakdownChart from "@/components/charts/SectorBreakdownChart";
import TopicDistributionChart from "@/components/charts/TopicDistributionChart";
import CountryLikelihoodChart from "@/components/charts/CountryLikelihoodChart";
import RegionYearHeatmap from "@/components/charts/RegionYearHeatmap";
import type { FilterField } from "@/lib/schemas/insight";

function DashboardContent() {
  useUrlSync();
  const {
    aggregateData,
    filtersData,
    insightsList,
    totalFilteredCount,
    isLoading,
    isInitialLoading,
    error,
    retry,
  } = useInsightsData();

  const { filters, search, setSearch, clearFilters, toggleFilterValue } =
    useFilterStore();

  // Compute active filters list
  const activeFiltersList: { field: FilterField; value: string }[] = [];
  (Object.keys(filters) as FilterField[]).forEach((field) => {
    filters[field].forEach((val) => {
      activeFiltersList.push({ field, value: val });
    });
  });

  const hasAnyFilters = activeFiltersList.length > 0 || search.trim() !== "";

  return (
    <div
      className="min-h-screen flex font-sans"
      style={{
        background: "var(--bg-page)",
        color: "var(--text-primary)",
      }}
    >
      {/* Left Sidebar (fixed width ~230px) */}
      <Sidebar filtersData={filtersData} isLoading={!filtersData} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with real working search and refresh */}
        <TopBar isLoading={isLoading} onRefresh={retry} />

        {/* Subtle non-blocking progress bar during filter changes */}
        {isLoading && !isInitialLoading && (
          <div className="h-0.5 w-full bg-transparent overflow-hidden">
            <div
              className="h-full w-full animate-pulse"
              style={{ background: "var(--accent-sage)" }}
            />
          </div>
        )}

        {/* Dashboard Content Container */}
        <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Active filter chips bar */}
          {hasAnyFilters && (
            <div
              className="p-3.5 rounded-2xl border shadow-sm flex flex-wrap items-center gap-2"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <span
                className="text-xs font-semibold mr-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Active filters:
              </span>

              {/* Search keyword chip */}
              {search.trim() !== "" && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium group transition-all"
                  style={{
                    background: "var(--accent-sage-dim)",
                    border: "1px solid var(--accent-sage-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span
                    className="text-[10px] uppercase font-bold"
                    style={{ color: "var(--accent-sage)" }}
                  >
                    keyword:
                  </span>
                  <span>&quot;{search}&quot;</span>
                  <button
                    onClick={() => setSearch("")}
                    className="ml-1 rounded focus:outline-none hover:opacity-70"
                    style={{ color: "var(--accent-sage)" }}
                    title="Clear search keyword"
                  >
                    &times;
                  </button>
                </span>
              )}

              {/* Dimension filter chips */}
              {activeFiltersList.map(({ field, value }) => (
                <span
                  key={`${field}-${value}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium group transition-all"
                  style={{
                    background: "var(--accent-rose-dim)",
                    border: "1px solid var(--accent-rose-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <span
                    className="text-[10px] uppercase font-bold"
                    style={{ color: "var(--accent-rose)" }}
                  >
                    {field}:
                  </span>
                  <span>{value}</span>
                  <button
                    onClick={() => toggleFilterValue(field, value)}
                    className="ml-1 rounded focus:outline-none hover:opacity-70"
                    style={{ color: "var(--accent-rose)" }}
                    title={`Remove ${value}`}
                  >
                    &times;
                  </button>
                </span>
              ))}

              <button
                onClick={clearFilters}
                className="text-xs underline underline-offset-2 ml-auto transition-colors font-medium hover:opacity-80"
                style={{ color: "var(--text-secondary)" }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Top Row: 2x2 KPI Cards (left block) beside larger Trend Chart Card (right block) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Top-Left: 2x2 KPI Card Grid (5 cols on lg) */}
            <div className="lg:col-span-5 h-full">
              <KpiCards
                aggregateData={aggregateData}
                totalFilteredCount={totalFilteredCount}
                isLoading={isInitialLoading}
              />
            </div>

            {/* Top-Right: Larger Trend Chart Card (7 cols on lg, spans taller) */}
            <div className="lg:col-span-7 h-full">
              <IntensityTrendChart
                data={aggregateData?.intensityByYear}
                isLoading={isInitialLoading}
                error={error}
                onRetry={retry}
                onYearClick={(year) => toggleFilterValue("end_year", String(year))}
              />
            </div>
          </div>

          {/* Second Row: Topic Distribution Bars (7 cols) and Donut Chart Card (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Topic Distribution Chart (7 cols on lg) */}
            <div className="lg:col-span-7 h-full">
              <TopicDistributionChart
                data={aggregateData?.topicCounts}
                isLoading={isInitialLoading}
                error={error}
                onRetry={retry}
                onTopicClick={(topic) => toggleFilterValue("topic", topic)}
              />
            </div>

            {/* Sector Breakdown Donut Card (5 cols on lg) */}
            <div className="lg:col-span-5 h-full">
              <SectorBreakdownChart
                data={aggregateData?.sectorCounts}
                isLoading={isInitialLoading}
                error={error}
                onRetry={retry}
                onSectorClick={(sector) => toggleFilterValue("sector", sector)}
              />
            </div>
          </div>

          {/* Third Row: Data Table Card (7 cols) and Country Likelihood Chart (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Bottom-Left: Data Table Card (7 cols on lg) */}
            <div className="lg:col-span-7 h-full">
              <InsightsTable
                insights={insightsList}
                totalCount={totalFilteredCount}
                isLoading={isLoading}
              />
            </div>

            {/* Country Likelihood Chart (5 cols on lg) */}
            <div className="lg:col-span-5 h-full">
              <CountryLikelihoodChart
                data={aggregateData?.countryLikelihood}
                isLoading={isInitialLoading}
                error={error}
                onRetry={retry}
                onCountryClick={(country) => toggleFilterValue("country", country)}
              />
            </div>
          </div>

          {/* Bottom Row: Region x Year Heatmap (full width card below the two-column row) */}
          <div className="w-full">
            <RegionYearHeatmap
              data={aggregateData?.regionYearIntensity}
              isLoading={isInitialLoading}
              error={error}
              onRetry={retry}
              onCellClick={(region, year) => {
                toggleFilterValue("region", region);
                toggleFilterValue("end_year", String(year));
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center text-sm"
          style={{
            background: "var(--bg-page)",
            color: "var(--text-secondary)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--loader-border)", borderTopColor: "transparent" }}
            />
            <span>Loading Insights Dashboard...</span>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
