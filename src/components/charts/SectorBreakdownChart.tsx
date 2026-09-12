"use client";

import React, { useCallback, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";

interface SectorCount {
  sector: string;
  count: number;
}

interface Props {
  data: SectorCount[] | undefined;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  onSectorClick?: (sector: string) => void;
}

// Okabe-Ito 8-color palette (colorblind-safe)
const OKABE_ITO_DARK = [
  "#e69f00", // 1: orange
  "#56b4e9", // 2: sky blue
  "#009e73", // 3: teal-green
  "#f0e442", // 4: yellow
  "#0072b2", // 5: deep blue
  "#d55e00", // 6: vermillion
  "#cc79a7", // 7: pink
  "#8a8a8a", // 8: gray (reserved for "Other")
];

const LIGHT_PALETTE = [
  "#6b5fa8",
  "#4a7fac",
  "#c4884d",
  "#5f7d5c",
  "#b56f5c",
  "#508f7e",
  "#a88930",
  "#8a8a8a",
];

function getColors(theme: string) {
  const isDark = theme === "dark";
  return {
    palette: isDark ? OKABE_ITO_DARK : LIGHT_PALETTE,
    stroke: isDark ? "#141414" : "#ffffff",
    tooltipBg: isDark ? "#141414" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)",
    textPrimary: isDark ? "#e8e8e8" : "#2b2620",
    textSecondary: isDark ? "#7a7a7a" : "#8a8078",
  };
}

function getSliceColor(item: { sector: string }, index: number, palette: string[]) {
  if (item.sector.toLowerCase() === "other") {
    return palette[7]; // gray reserved for "Other"
  }
  return palette[Math.min(index, 6)];
}

export default function SectorBreakdownChart({
  data,
  isLoading,
  error,
  onRetry,
  onSectorClick,
}: Props) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const rawData = useMemo(() => data || [], [data]);

  const totalCount = rawData.reduce((acc, curr) => acc + curr.count, 0);
  const dominantSector = rawData[0]?.sector || "None";

  // Cap at top 7 explicit sectors + "Other" in gray (#8a8a8a)
  const displayData = useMemo(() => {
    if (rawData.length <= 7) {
      return rawData;
    }
    const top7 = rawData.slice(0, 7);
    const otherCount = rawData.slice(7).reduce((acc, curr) => acc + curr.count, 0);
    if (otherCount > 0) {
      return [...top7, { sector: "Other", count: otherCount }];
    }
    return top7;
  }, [rawData]);

  const handleClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_: any, index: number) => {
      if (
        onSectorClick &&
        displayData[index] &&
        displayData[index].sector !== "Other"
      ) {
        onSectorClick(displayData[index].sector);
      }
    },
    [onSectorClick, displayData]
  );

  if (isLoading) {
    return (
      <div className="pill-card p-6 h-[440px] flex flex-col justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-5 rounded w-36" style={{ background: "var(--skeleton-bright)" }} />
          <div className="h-3 rounded w-48" style={{ background: "var(--skeleton-shine)" }} />
        </div>
        <div
          className="w-44 h-44 rounded-full border-8 mx-auto my-auto"
          style={{ borderColor: "var(--skeleton-shine)" }}
        />
        <div className="h-4 rounded w-3/4 mx-auto" style={{ background: "var(--skeleton-base)" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pill-card p-6 h-[440px] flex flex-col items-center justify-center text-center">
        <p className="text-xs mb-3 font-medium" style={{ color: "var(--accent-rose)" }}>
          Failed to load sector breakdown
        </p>
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: "var(--accent-rose-dim)",
            border: "1px solid var(--accent-rose-border)",
            color: "var(--accent-rose)",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (displayData.length === 0) {
    return (
      <div
        className="pill-card p-6 h-[440px] flex flex-col items-center justify-center text-center"
        style={{ color: "var(--text-secondary)" }}
      >
        <p className="text-xs">No sector distribution for active filters</p>
      </div>
    );
  }

  return (
    <div className="pill-card p-6 h-[440px] flex flex-col justify-between">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Sector Distribution
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
          Proportion of insights across primary industries
        </p>
      </div>

      {/* Donut Chart with Center Label */}
      <div className="relative w-full h-[220px] flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                background: colors.tooltipBg,
                border: `1px solid ${colors.tooltipBorder}`,
                borderRadius: "12px",
                padding: "8px 12px",
                boxShadow: "var(--shadow-tooltip)",
              }}
              itemStyle={{ color: colors.textPrimary, fontSize: "12px" }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [
                `${value} insights (${((value / totalCount) * 100).toFixed(1)}%)`,
                String(name),
              ]}
            />
            <Pie
              data={displayData}
              dataKey="count"
              nameKey="sector"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              onClick={handleClick}
              cursor="pointer"
              stroke={colors.stroke}
              strokeWidth={3}
            >
              {displayData.map((item, index) => (
                <Cell
                  key={`sector-cell-${index}`}
                  fill={getSliceColor(item, index, colors.palette)}
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label inside donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span
            className="text-[10px] uppercase font-bold tracking-wider"
            style={{ color: "var(--text-secondary)" }}
          >
            Dominant
          </span>
          <span
            className="text-base font-bold max-w-[110px] truncate px-1"
            style={{ color: "var(--text-primary)" }}
          >
            {dominantSector}
          </span>
          <span
            className="text-[11px] font-semibold"
            style={{ color: "var(--accent-sage)" }}
          >
            {totalCount.toLocaleString()} total
          </span>
        </div>
      </div>

      {/* Small Legend with Colored Dots Below */}
      <div className="pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          {displayData.map((item, idx) => {
            const pct = Math.round((item.count / totalCount) * 100);
            const dotColor = getSliceColor(item, idx, colors.palette);
            const isOther = item.sector.toLowerCase() === "other";
            return (
              <button
                key={item.sector}
                onClick={() => !isOther && onSectorClick?.(item.sector)}
                disabled={isOther}
                className={`flex items-center gap-1.5 text-xs transition-colors group ${
                  isOther ? "cursor-default opacity-80" : "cursor-pointer"
                }`}
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="truncate max-w-[85px] capitalize font-medium">
                  {item.sector}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
