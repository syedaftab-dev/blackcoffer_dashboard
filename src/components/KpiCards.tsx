"use client";

import React from "react";
import type { AggregateResponse } from "@/lib/schemas/insight";
import { useFilterStore } from "@/store/filterStore";

interface KpiCardsProps {
  aggregateData: AggregateResponse | null;
  totalFilteredCount: number;
  isLoading: boolean;
}

export default function KpiCards({
  aggregateData,
  totalFilteredCount,
  isLoading,
}: KpiCardsProps) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);

  // Derived KPI values
  const peakIntensityYear = aggregateData?.intensityByYear?.length
    ? [...aggregateData.intensityByYear].sort((a, b) => b.avgIntensity - a.avgIntensity)[0]
    : null;

  const topSector = aggregateData?.sectorCounts?.length
    ? [...aggregateData.sectorCounts].sort((a, b) => b.count - a.count)[0]
    : null;

  const topCountry = aggregateData?.countryLikelihood?.length
    ? [...aggregateData.countryLikelihood].sort((a, b) => b.avgLikelihood - a.avgLikelihood)[0]
    : null;

  // Percentage of total dataset (1000 records)
  const totalCoveragePercent = Math.min(
    100,
    Math.round((totalFilteredCount / 1000) * 100)
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 h-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="pill-card p-5 animate-pulse flex flex-col justify-between h-[150px]"
          >
            <div className="h-3 rounded w-1/2" style={{ background: "var(--skeleton-shine)" }} />
            <div className="h-8 rounded w-3/4" style={{ background: "var(--skeleton-bright)" }} />
            <div className="h-3 rounded w-1/3" style={{ background: "var(--skeleton-shine)" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* 1. Total Records */}
      <div className="pill-card p-5 flex flex-col justify-between hover:scale-[1.01] transition-transform">
        <div>
          <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
            Total Records
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {totalFilteredCount.toLocaleString()}
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>/ 1,000</span>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-semibold mt-2" style={{ color: "var(--status-success)" }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span>{totalCoveragePercent}% coverage</span>
        </div>
      </div>

      {/* 2. Peak Intensity Year */}
      <div
        onClick={() => peakIntensityYear && toggleFilterValue("end_year", String(peakIntensityYear.year))}
        className="pill-card p-5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]"
        style={{ borderColor: undefined }}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
              Peak Intensity Year
            </span>
            {peakIntensityYear && (
              <span className="text-[10px] font-semibold" style={{ color: "var(--accent-sage)" }}>Filter &rarr;</span>
            )}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
            {peakIntensityYear ? peakIntensityYear.year : "N/A"}
          </div>
        </div>

        {/* Metric badge */}
        <div className="flex items-center gap-1.5 text-xs font-semibold mt-2" style={{ color: "var(--status-success)" }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>
            Avg Intensity: {peakIntensityYear ? peakIntensityYear.avgIntensity.toFixed(1) : "—"}
          </span>
        </div>
      </div>

      {/* 3. Dominant Sector */}
      <div
        onClick={() => topSector && toggleFilterValue("sector", topSector.sector)}
        className="pill-card p-5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
              Dominant Sector
            </span>
            {topSector && (
              <span className="text-[10px] font-semibold" style={{ color: "var(--chart-orange)" }}>Filter &rarr;</span>
            )}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight truncate capitalize" style={{ color: "var(--text-primary)" }}>
            {topSector ? topSector.sector : "N/A"}
          </div>
        </div>

        {/* Volume badge (no fabricated trend arrow) */}
        <div className="flex items-center gap-1.5 text-xs font-medium mt-2" style={{ color: "var(--text-secondary)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--chart-orange)" }}></span>
          <span>{topSector ? `${topSector.count} insights recorded` : "No data"}</span>
        </div>
      </div>

      {/* 4. Top Country by Likelihood */}
      <div
        onClick={() => topCountry && toggleFilterValue("country", topCountry.country)}
        className="pill-card p-5 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01]"
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
              Top Country (Likelihood)
            </span>
            {topCountry && (
              <span className="text-[10px] font-semibold" style={{ color: "var(--chart-blue)" }}>Filter &rarr;</span>
            )}
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-bold tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
            {topCountry ? topCountry.country : "N/A"}
          </div>
        </div>

        {/* Metric badge */}
        <div className="flex items-center gap-1.5 text-xs font-semibold mt-2" style={{ color: "var(--status-success)" }}>
          <span
            className="px-1.5 py-0.5 rounded text-[11px]"
            style={{
              background: "var(--accent-sage-dim)",
              color: "var(--status-success)",
            }}
          >
            {topCountry ? `${topCountry.avgLikelihood.toFixed(1)} / 4.0` : "—"}
          </span>
          <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {topCountry ? `(${topCountry.count} reports)` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
