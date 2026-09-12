"use client";

import React from "react";
import type { AggregateResponse } from "@/lib/schemas/insight";
import { useFilterStore } from "@/store/filterStore";

interface InsightCalloutsProps {
  aggregateData: AggregateResponse | null;
  isLoading: boolean;
}

export default function InsightCallouts({
  aggregateData,
  isLoading,
}: InsightCalloutsProps) {
  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const activeFilters = useFilterStore((s) => s.filters);

  // Derive insights
  const topTopic = aggregateData?.topicCounts?.[0];
  
  const peakIntensityYear = aggregateData?.intensityByYear?.length
    ? [...aggregateData.intensityByYear].sort((a, b) => b.avgIntensity - a.avgIntensity)[0]
    : null;

  const topCountryLikelihood = aggregateData?.countryLikelihood?.length
    ? [...aggregateData.countryLikelihood].sort((a, b) => b.avgLikelihood - a.avgLikelihood)[0]
    : null;

  const topSector = aggregateData?.sectorCounts?.length
    ? [...aggregateData.sectorCounts].sort((a, b) => b.count - a.count)[0]
    : null;

  const totalFilteredPoints = aggregateData?.sectorCounts?.reduce(
    (acc, curr) => acc + curr.count,
    0
  ) ?? 0;

  const activeFilterCount = Object.values(activeFilters).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-slate-900/50 border border-white/[0.06] animate-pulse h-28 flex flex-col justify-between"
          >
            <div className="h-4 bg-white/10 rounded w-1/2" />
            <div className="h-7 bg-white/15 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Metric 1: Peak Intensity Year */}
      <div
        onClick={() => peakIntensityYear && toggleFilterValue("end_year", String(peakIntensityYear.year))}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/80 border border-white/[0.07] hover:border-amber-500/40 p-5 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <span>Peak Intensity Year</span>
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mb-1">
          {peakIntensityYear ? `Year ${peakIntensityYear.year}` : "N/A"}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Avg Intensity:{" "}
            <strong className="text-amber-400 font-semibold">
              {peakIntensityYear ? peakIntensityYear.avgIntensity.toFixed(1) : "—"}
            </strong>
          </span>
          {peakIntensityYear && (
            <span className="text-[10px] text-slate-500 group-hover:text-amber-400/80 transition-colors">
              Filter by year &rarr;
            </span>
          )}
        </div>
      </div>

      {/* Metric 2: Leading Topic */}
      <div
        onClick={() => topTopic && toggleFilterValue("topic", topTopic.topic)}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/80 border border-white/[0.07] hover:border-sky-500/40 p-5 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/5 cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all duration-500" />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <span>Leading Topic</span>
          <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mb-1 truncate capitalize">
          {topTopic?.topic || "N/A"}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Frequency:{" "}
            <strong className="text-sky-400 font-semibold">
              {topTopic ? `${topTopic.count} insights` : "—"}
            </strong>
          </span>
          {topTopic && (
            <span className="text-[10px] text-slate-500 group-hover:text-sky-400/80 transition-colors">
              Filter by topic &rarr;
            </span>
          )}
        </div>
      </div>

      {/* Metric 3: Dominant Sector */}
      <div
        onClick={() => topSector && toggleFilterValue("sector", topSector.sector)}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/80 border border-white/[0.07] hover:border-purple-500/40 p-5 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500" />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <span>Dominant Sector</span>
          <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mb-1 truncate capitalize">
          {topSector?.sector || "N/A"}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Volume:{" "}
            <strong className="text-purple-400 font-semibold">
              {topSector ? `${topSector.count} records` : "—"}
            </strong>
          </span>
          {topSector && (
            <span className="text-[10px] text-slate-500 group-hover:text-purple-400/80 transition-colors">
              Filter sector &rarr;
            </span>
          )}
        </div>
      </div>

      {/* Metric 4: High Likelihood Region/Country & Active Filters */}
      <div
        onClick={() => topCountryLikelihood && toggleFilterValue("country", topCountryLikelihood.country)}
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950/80 border border-white/[0.07] hover:border-emerald-500/40 p-5 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          <span>Highest Likelihood Country</span>
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mb-1 truncate">
          {topCountryLikelihood?.country || "N/A"}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Avg Likelihood:{" "}
            <strong className="text-emerald-400 font-semibold">
              {topCountryLikelihood ? topCountryLikelihood.avgLikelihood.toFixed(1) : "—"}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
            {activeFilterCount > 0 ? `${activeFilterCount} active filters` : `${totalFilteredPoints} records`}
          </span>
        </div>
      </div>
    </div>
  );
}
