"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";
import { useFilterStore } from "@/store/filterStore";

interface IntensityByYear {
  year: number;
  avgIntensity: number;
  avgLikelihood?: number;
  count: number;
}

interface Props {
  data: IntensityByYear[] | undefined;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  onYearClick?: (year: number) => void;
}

// Theme-aware color resolver
function getColors(theme: string) {
  const isDark = theme === "dark";
  return {
    intensity: isDark ? "#e69f00" : "#5f7d5c",
    likelihood: isDark ? "#0072b2" : "#b56f5c",
    textSecondary: isDark ? "#7a7a7a" : "#8a8078",
    textPrimary: isDark ? "#e8e8e8" : "#2b2620",
    cardBg: isDark ? "#141414" : "#ffffff",
    gridStroke: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)",
    tooltipBg: isDark ? "#141414" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)",
    cursorStroke: isDark ? "#e69f00" : "#5f7d5c",
  };
}

export default function IntensityTrendChart({
  data,
  isLoading,
  error,
  onRetry,
  onYearClick,
}: Props) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const clearFilters = useFilterStore((s) => s.clearFilters);
  const chartData = data || [];

  if (isLoading) {
    return (
      <div className="pill-card p-6 h-full min-h-[340px] flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 rounded w-40" style={{ background: "var(--skeleton-bright)" }} />
            <div className="h-3 rounded w-56" style={{ background: "var(--skeleton-shine)" }} />
          </div>
          <div className="h-4 rounded w-24" style={{ background: "var(--skeleton-shine)" }} />
        </div>
        <div className="h-48 rounded-xl mt-4" style={{ background: "var(--skeleton-base)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pill-card p-6 h-full min-h-[340px] flex flex-col items-center justify-center text-center">
        <p className="text-xs mb-3" style={{ color: "var(--accent-rose)" }}>Failed to load trend data</p>
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
          style={{
            background: "var(--accent-rose-dim)",
            borderColor: "var(--accent-rose-border)",
            color: "var(--accent-rose)",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="pill-card p-6 h-full min-h-[340px] flex flex-col items-center justify-center text-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
          style={{ background: "var(--skeleton-base)", color: "var(--text-secondary)" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          No trend data matches current filters
        </p>
        <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
          Try removing or resetting some of your active filter selections.
        </p>
        <button
          onClick={clearFilters}
          className="text-xs px-3.5 py-1.5 rounded-xl border font-medium transition-colors"
          style={{
            background: "var(--skeleton-base)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          Clear All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="pill-card p-6 h-full min-h-[340px] flex flex-col justify-between">
      {/* Header with Title & Legend dots */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <div>
          <h2 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Intensity &amp; Likelihood Trajectory
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Historical &amp; projected trajectory across end years
          </p>
        </div>

        {/* Legend dots matching reference */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--accent-sage)" }} />
            <span>Intensity</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--accent-rose)" }} />
            <span>Likelihood</span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-[220px] mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 12, bottom: 4, left: -20 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(e: any) => {
              if (e?.activePayload?.[0]?.payload?.year && onYearClick) {
                onYearClick(e.activePayload[0].payload.year);
              }
            }}
          >
            {/* Dashed gridlines */}
            <CartesianGrid
              strokeDasharray="4 4"
              stroke={colors.gridStroke}
              vertical={false}
            />

            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: colors.textSecondary }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />

            <YAxis
              tick={{ fontSize: 11, fill: colors.textSecondary }}
              axisLine={false}
              tickLine={false}
              dx={-4}
            />

            {/* Dotted vertical guide & floating pill tooltip */}
            <Tooltip
              contentStyle={{
                background: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: "14px",
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.25)",
                padding: "10px 14px",
              }}
              labelStyle={{ color: colors.textPrimary, fontWeight: 700, fontSize: "12px", marginBottom: "4px" }}
              itemStyle={{ fontSize: "12px", padding: "2px 0" }}
              cursor={{
                stroke: colors.cursorStroke,
                strokeWidth: 1.5,
                strokeDasharray: "3 3",
              }}
              labelFormatter={(label) => `Year ${label}`}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [
                typeof value === "number" ? value.toFixed(1) : value,
                name === "avgIntensity" ? "Avg Intensity" : "Avg Likelihood",
              ]}
            />

            {/* Primary line: Intensity stroke (#e69f00 in dark) */}
            <Line
              type="monotone"
              dataKey="avgIntensity"
              stroke={colors.intensity}
              strokeWidth={2.5}
              dot={{ r: 3, fill: colors.intensity, strokeWidth: 0 }}
              activeDot={{
                r: 6,
                fill: colors.intensity,
                stroke: colors.textPrimary,
                strokeWidth: 2,
                cursor: "pointer",
              }}
            />

            {/* Secondary line: Likelihood stroke (#0072b2 in dark) */}
            <Line
              type="monotone"
              dataKey="avgLikelihood"
              stroke={colors.likelihood}
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{ r: 2.5, fill: colors.likelihood, strokeWidth: 0 }}
              activeDot={{
                r: 5,
                fill: colors.likelihood,
                stroke: colors.textPrimary,
                strokeWidth: 1.5,
                cursor: "pointer",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 text-right">
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          Click any data point to cross-filter by year
        </span>
      </div>
    </div>
  );
}
