"use client";

import React, { useMemo } from "react";
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

interface TopicCount {
  topic: string;
  count: number;
}

interface Props {
  data: TopicCount[] | undefined;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  onTopicClick?: (topic: string) => void;
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
    textPrimary: isDark ? "#e8e8e8" : "#2b2620",
    textSecondary: isDark ? "#7a7a7a" : "#8a8078",
    tooltipBg: isDark ? "#141414" : "#ffffff",
    tooltipBorder: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.08)",
    gridStroke: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.06)",
  };
}

function getBarColor(item: { topic: string }, index: number, palette: string[]) {
  if (item.topic.toLowerCase() === "other") {
    return palette[7];
  }
  return palette[Math.min(index, 6)];
}

export default function TopicDistributionChart({
  data,
  isLoading,
  error,
  onRetry,
  onTopicClick,
}: Props) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  // Fixed rank order: cap at top 7 explicit topics + "Other" in gray (#8a8a8a)
  const chartData = useMemo(() => {
    const rawData = data || [];
    if (rawData.length <= 7) {
      return rawData;
    }
    const top7 = rawData.slice(0, 7);
    const otherCount = rawData.slice(7).reduce((acc, curr) => acc + curr.count, 0);
    if (otherCount > 0) {
      return [...top7, { topic: "Other", count: otherCount }];
    }
    return top7;
  }, [data]);

  return (
    <ChartCard
      title="Topic Distribution"
      subtitle="Top topics by frequency"
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
            const topic = e?.activePayload?.[0]?.payload?.topic;
            if (topic && topic !== "Other" && onTopicClick) {
              onTopicClick(topic);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.gridStroke} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: colors.textSecondary }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="topic"
            width={90}
            tick={{ fontSize: 10, fill: colors.textSecondary }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: string) =>
              value.length > 12 ? value.slice(0, 12) + "…" : value
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
            formatter={(value: any) => [value ?? 0, "Count"]}
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer">
            {chartData.map((item, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(item, index, colors.palette)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
