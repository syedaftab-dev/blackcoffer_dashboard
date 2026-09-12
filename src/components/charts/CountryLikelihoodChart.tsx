"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import ChartCard from "./ChartCard";
import { useTheme } from "@/components/ThemeProvider";

interface CountryLikelihood {
  country: string;
  avgLikelihood: number;
  count: number;
}

interface Props {
  data: CountryLikelihood[] | undefined;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  onCountryClick?: (country: string) => void;
}

function getColors(theme: string) {
  const isDark = theme === "dark";
  return {
    barFill: isDark ? "#0072b2" : "#b56f5c",
    textPrimary: isDark ? "#e8e8e8" : "#2b2620",
    textSecondary: isDark ? "#7a7a7a" : "#8a8078",
    tooltipBg: isDark ? "#141414" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)",
    gridStroke: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)",
  };
}

export default function CountryLikelihoodChart({
  data,
  isLoading,
  error,
  onRetry,
  onCountryClick,
}: Props) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const chartData = (data || []).slice(0, 15);

  return (
    <ChartCard
      title="Country Likelihood"
      subtitle="Average likelihood by country (top 15)"
      isLoading={isLoading}
      isEmpty={chartData.length === 0}
      error={error}
      onRetry={onRetry}
      skeletonHeight={380}
    >
      <ResponsiveContainer width="100%" height={380}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onClick={(e: any) => {
            if (e?.activePayload?.[0]?.payload?.country && onCountryClick) {
              onCountryClick(e.activePayload[0].payload.country);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.gridStroke} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: colors.textSecondary }}
            axisLine={false}
            tickLine={false}
            domain={[0, "auto"]}
          />
          <YAxis
            type="category"
            dataKey="country"
            width={110}
            tick={{ fontSize: 10, fill: colors.textSecondary }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: string) =>
              value.length > 14 ? value.slice(0, 14) + "…" : value
            }
          />
          <Tooltip
            contentStyle={{
              background: colors.tooltipBg,
              border: `1px solid ${colors.tooltipBorder}`,
              borderRadius: "12px",
              boxShadow: "var(--shadow-tooltip)",
            }}
            labelStyle={{ color: colors.textPrimary, fontWeight: 600 }}
            itemStyle={{ color: colors.textSecondary }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [
              typeof value === "number" ? value.toFixed(2) : String(value ?? ""),
              "Avg Likelihood",
            ]}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="avgLikelihood" radius={[0, 4, 4, 0]} cursor="pointer">
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors.barFill}
                fillOpacity={0.4 + (entry.avgLikelihood / 5) * 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
