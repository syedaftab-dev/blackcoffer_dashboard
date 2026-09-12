"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import ChartCard from "./ChartCard";
import { useTheme } from "@/components/ThemeProvider";

interface RegionYearData {
  region: string;
  year: number;
  avgIntensity: number;
  count: number;
}

interface Props {
  data: RegionYearData[] | undefined;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  onCellClick?: (region: string, year: number) => void;
}

export default function RegionYearHeatmap({
  data,
  isLoading,
  error,
  onRetry,
  onCellClick,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 960, height: 380 });

  const chartData = useMemo(() => data || [], [data]);

  // Responsive resize observer that measures immediately on mount and on load completion
  useEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      if (containerRef.current) {
        const w =
          containerRef.current.clientWidth ||
          containerRef.current.getBoundingClientRect().width;
        if (w > 0) {
          setDimensions({
            width: w,
            height: Math.max(Math.min(w * 0.42, 420), 340),
          });
        }
      }
    };

    measure();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(Math.min(entry.contentRect.width * 0.42, 420), 340),
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isLoading]);

  // D3 rendering
  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || chartData.length === 0) return;

    const totalWidth =
      dimensions.width || containerRef.current?.clientWidth || 960;
    const totalHeight = dimensions.height || 380;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);

    // Clear previous render
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 65, left: 140 };
    const width = Math.max(totalWidth - margin.left - margin.right, 200);
    const height = Math.max(totalHeight - margin.top - margin.bottom, 160);

    svg
      .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
      .attr("width", "100%")
      .attr("height", totalHeight);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Extract unique regions and years
    const regions = [
      ...new Set(chartData.map((d) => d.region).filter(Boolean)),
    ].sort();
    const years = [
      ...new Set(chartData.map((d) => d.year).filter((y) => y !== null)),
    ].sort((a, b) => a - b);

    if (regions.length === 0 || years.length === 0) return;

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(years.map(String))
      .range([0, width])
      .padding(0.08);
    const yScale = d3
      .scaleBand()
      .domain(regions)
      .range([0, height])
      .padding(0.08);

    const maxIntensity = d3.max(chartData, (d) => d.avgIntensity) || 10;

    const paletteStops = isDark
      ? ["#2a3d5c", "#3d5a80", "#5983a8", "#7fb0c4", "#a8d4d0", "#d4e8a8", "#f4d35e"]
      : ["#ded9d2", "#a8c0a5", "#739970", "#5f7d5c", "#d19a8a", "#b56f5c"];

    const emptyCellColor = isDark ? "#1a1a2e" : "#e8e4de";
    const cellStroke = isDark ? "#0a0a0a" : "#f7f5f2";
    const highlightStroke = isDark ? "#f4d35e" : "#b56f5c";
    const textColor = isDark ? "#7a7a7a" : "#8a8078";
    const tooltipTextPrimary = isDark ? "#e8e8e8" : "#2b2620";
    const intensityColor = isDark ? "#f4d35e" : "#b56f5c";
    const volumeColor = isDark ? "#009e73" : "#5f7d5c";

    const colorScale = d3
      .scaleSequential()
      .domain([0, maxIntensity])
      .interpolator(d3.interpolateRgbBasis(paletteStops));

    // X axis (Years)
    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .style("fill", textColor)
      .style("font-size", "10px")
      .style("font-family", "inherit")
      .attr("transform", "rotate(-40)")
      .attr("text-anchor", "end")
      .attr("dx", "-6px")
      .attr("dy", "6px");

    // Y axis (Regions)
    g.append("g")
      .call(d3.axisLeft(yScale).tickSize(0))
      .call((ax) => ax.select(".domain").remove())
      .selectAll("text")
      .style("fill", textColor)
      .style("font-size", "10px")
      .style("font-family", "inherit")
      .each(function () {
        const el = d3.select(this);
        const text = el.text();
        if (text.length > 18) {
          el.text(text.slice(0, 18) + "…");
        }
      });

    // Create lookup map for quick cell matching
    const dataMap = new Map<string, RegionYearData>();
    chartData.forEach((d) => {
      dataMap.set(`${d.region}-${d.year}`, d);
    });

    // Draw cells
    const cellData = regions.flatMap((region) =>
      years.map((year) => ({
        region,
        year,
        data: dataMap.get(`${region}-${year}`),
      }))
    );

    g.selectAll("rect.cell")
      .data(cellData)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", (d) => xScale(String(d.year)) || 0)
      .attr("y", (d) => yScale(d.region) || 0)
      .attr("width", Math.max(xScale.bandwidth(), 2))
      .attr("height", Math.max(yScale.bandwidth(), 2))
      .attr("rx", 3)
      .attr("fill", (d) =>
        d.data ? colorScale(d.data.avgIntensity) : emptyCellColor
      )
      .attr("stroke", cellStroke)
      .attr("stroke-width", 1)
      .style("cursor", (d) => (d.data ? "pointer" : "default"))
      .on("mouseover", function (event, d) {
        if (!d.data) return;

        d3.select(this)
          .attr("stroke", highlightStroke)
          .attr("stroke-width", 2)
          .raise();

        tooltip
          .style("opacity", "1")
          .style("left", `${event.offsetX + 14}px`)
          .style("top", `${event.offsetY - 14}px`)
          .html(
            `<div style="font-weight:700;color:${tooltipTextPrimary};margin-bottom:3px">${d.region}</div>
             <div style="color:${textColor}">Year: <span style="color:${tooltipTextPrimary}">${d.year}</span></div>
             <div style="color:${textColor}">Avg Intensity: <span style="color:${intensityColor};font-weight:700">${d.data.avgIntensity.toFixed(1)}</span></div>
             <div style="color:${textColor}">Volume: <span style="color:${volumeColor};font-weight:600">${d.data.count} reports</span></div>
             <div style="margin-top:4px;font-size:10px;color:${intensityColor}">Click to filter by Region &amp; Year &rarr;</div>`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.offsetX + 14}px`)
          .style("top", `${event.offsetY - 14}px`);
      })
      .on("mouseout", function () {
        d3.select(this)
          .attr("stroke", cellStroke)
          .attr("stroke-width", 1);
        tooltip.style("opacity", "0");
      })
      .on("click", function (_, d) {
        if (d.data && onCellClick) {
          onCellClick(d.region, d.year);
        }
      });

    // Color legend at top-right
    const legendWidth = Math.min(180, width * 0.35);
    const legendHeight = 8;
    const legendX = width - legendWidth;
    const legendY = -18;

    const defs = svg.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", "heatmap-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%");

    const nStops = 6;
    for (let i = 0; i <= nStops; i++) {
      const t = i / nStops;
      linearGradient
        .append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(t * maxIntensity));
    }

    const legend = g
      .append("g")
      .attr("transform", `translate(${legendX},${legendY})`);

    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("rx", 3)
      .style("fill", "url(#heatmap-gradient)");

    legend
      .append("text")
      .attr("x", 0)
      .attr("y", -4)
      .style("fill", textColor)
      .style("font-size", "9px")
      .text("0");

    legend
      .append("text")
      .attr("x", legendWidth)
      .attr("y", -4)
      .attr("text-anchor", "end")
      .style("fill", textColor)
      .style("font-size", "9px")
      .text(maxIntensity.toFixed(1));

    legend
      .append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -4)
      .attr("text-anchor", "middle")
      .style("fill", textColor)
      .style("font-size", "9px")
      .text("Avg Intensity");

    return () => {
      svg.selectAll("*").remove();
    };
  }, [chartData, dimensions, onCellClick, theme, isDark]);

  return (
    <ChartCard
      title="Region × Year Intensity Heatmap"
      subtitle="Average intensity across regions and projected years — click a cell to filter"
      isLoading={isLoading}
      isEmpty={chartData.length === 0}
      error={error}
      onRetry={onRetry}
      skeletonHeight={380}
      className="col-span-full"
    >
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ minHeight: "340px" }}
      >
        <svg ref={svgRef} className="w-full block" />
        <div
          ref={tooltipRef}
          className="pointer-events-none absolute z-50 px-3 py-2 rounded-xl text-xs shadow-2xl transition-opacity duration-150"
          style={{
            opacity: 0,
            top: 0,
            left: 0,
            background: "var(--bg-tooltip)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            boxShadow: "var(--shadow-tooltip)",
          }}
        />
      </div>
    </ChartCard>
  );
}
