"use client";

import React, { useState, useMemo } from "react";
import type { InsightResponse } from "@/lib/schemas/insight";
import { useFilterStore } from "@/store/filterStore";

interface InsightsTableProps {
  insights: InsightResponse[];
  totalCount: number;
  isLoading: boolean;
}

type SortField = "title" | "sector" | "topic" | "intensity" | "relevance" | "end_year";
type SortDirection = "asc" | "desc";

export default function InsightsTable({
  insights,
  totalCount,
  isLoading,
}: InsightsTableProps) {
  const [sortField, setSortField] = useState<SortField>("intensity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [tableFilter, setTableFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 7;

  const toggleFilterValue = useFilterStore((s) => s.toggleFilterValue);
  const clearFilters = useFilterStore((s) => s.clearFilters);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Sort & filter insights
  const sortedInsights = useMemo(() => {
    let list = [...insights];
    if (tableFilter.trim()) {
      const q = tableFilter.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.insight?.toLowerCase().includes(q) ||
          i.topic?.toLowerCase().includes(q) ||
          i.sector?.toLowerCase().includes(q) ||
          i.country?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [insights, sortField, sortDirection, tableFilter]);

  // Paginated view
  const paginatedInsights = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedInsights.slice(start, start + pageSize);
  }, [sortedInsights, page]);

  const totalPages = Math.max(1, Math.ceil(sortedInsights.length / pageSize));

  // CSV Export
  const exportToCSV = () => {
    if (insights.length === 0) return;

    const headers = ["Title", "Sector", "Topic", "Intensity", "Relevance", "Likelihood", "Year", "Country", "Source", "URL"];
    const rows = sortedInsights.map((i) => [
      `"${(i.title || i.insight || "").replace(/"/g, '""')}"`,
      `"${(i.sector || "").replace(/"/g, '""')}"`,
      `"${(i.topic || "").replace(/"/g, '""')}"`,
      i.intensity ?? "",
      i.relevance ?? "",
      i.likelihood ?? "",
      i.end_year ?? "",
      `"${(i.country || "").replace(/"/g, '""')}"`,
      `"${(i.source || "").replace(/"/g, '""')}"`,
      `"${(i.url || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `blackcoffer_insights_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 opacity-50" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === "asc" ? (
      <svg className="w-3 h-3" style={{ color: "var(--accent-sage)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3" style={{ color: "var(--accent-sage)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="pill-card p-6 h-[440px] flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 rounded w-48" style={{ background: "var(--skeleton-bright)" }} />
          <div className="h-8 rounded-xl w-28" style={{ background: "var(--skeleton-shine)" }} />
        </div>
        <div className="space-y-3 flex-1">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-10 rounded-xl" style={{ background: "var(--skeleton-base)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pill-card p-6 h-[440px] flex flex-col justify-between">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Top Strategic Insights
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {totalCount.toLocaleString()} matches &bull; Click Sector or Topic to filter
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Table Search */}
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="Search table..."
              value={tableFilter}
              onChange={(e) => {
                setTableFilter(e.target.value);
                setPage(1);
              }}
              className="pl-7 pr-6 py-1.5 rounded-xl border text-xs focus:outline-none w-36 sm:w-44 transition-all"
              style={{
                background: "var(--bg-page)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            <svg
              className="w-3.5 h-3.5 absolute left-2.5 top-2.5 pointer-events-none"
              style={{ color: "var(--text-secondary)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {tableFilter && (
              <button
                onClick={() => setTableFilter("")}
                className="absolute right-2 top-1.5 text-xs font-bold hover:opacity-70"
                style={{ color: "var(--text-secondary)" }}
              >
                &times;
              </button>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={exportToCSV}
            disabled={insights.length === 0}
            title="Download filtered insights CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm disabled:opacity-40"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <svg className="w-3.5 h-3.5" style={{ color: "var(--accent-sage)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-xs border-collapse">
          <thead>
            <tr className="border-b font-semibold" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
              <th
                onClick={() => handleSort("title")}
                className="pb-2.5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Insight Title</span>
                  {getSortIcon("title")}
                </div>
              </th>
              <th
                onClick={() => handleSort("sector")}
                className="pb-2.5 px-2 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Sector</span>
                  {getSortIcon("sector")}
                </div>
              </th>
              <th
                onClick={() => handleSort("topic")}
                className="pb-2.5 px-2 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Topic</span>
                  {getSortIcon("topic")}
                </div>
              </th>
              <th
                onClick={() => handleSort("intensity")}
                className="pb-2.5 px-2 text-right cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Intensity</span>
                  {getSortIcon("intensity")}
                </div>
              </th>
              <th
                onClick={() => handleSort("relevance")}
                className="pb-2.5 px-2 text-right cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Relevance</span>
                  {getSortIcon("relevance")}
                </div>
              </th>
              <th
                onClick={() => handleSort("end_year")}
                className="pb-2.5 pl-2 text-right cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Year</span>
                  {getSortIcon("end_year")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedInsights.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center" style={{ color: "var(--text-secondary)" }}>
                  <p className="mb-2">No insights found for current filter criteria</p>
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 text-xs font-medium rounded-full border hover:opacity-80 transition-opacity"
                    style={{
                      background: "var(--accent-sage-dim)",
                      borderColor: "var(--accent-sage-border)",
                      color: "var(--accent-sage)",
                    }}
                  >
                    Clear all filters
                  </button>
                </td>
              </tr>
            ) : (
              paginatedInsights.map((item, idx) => (
                <tr
                  key={item._id || idx}
                  className="transition-colors"
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  <td className="py-2.5 pr-3 max-w-[200px] truncate font-medium" style={{ color: "var(--text-primary)" }}>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline transition-colors truncate block"
                        style={{ color: "var(--text-primary)" }}
                        title={item.title || item.insight}
                      >
                        {item.title || item.insight || "Untitled Insight"}
                      </a>
                    ) : (
                      <span title={item.title || item.insight}>
                        {item.title || item.insight || "Untitled Insight"}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2">
                    {item.sector ? (
                      <button
                        onClick={() => toggleFilterValue("sector", item.sector)}
                        className="px-2 py-0.5 rounded-md font-medium text-[11px] truncate max-w-[90px] block transition-colors"
                        style={{
                          background: "var(--accent-sage-dim)",
                          color: "var(--accent-sage)",
                        }}
                        title={`Filter by sector: ${item.sector}`}
                      >
                        {item.sector}
                      </button>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2">
                    {item.topic ? (
                      <button
                        onClick={() => toggleFilterValue("topic", item.topic)}
                        className="px-2 py-0.5 rounded-md font-medium text-[11px] truncate max-w-[85px] block transition-colors"
                        style={{
                          background: "var(--accent-rose-dim)",
                          color: "var(--accent-rose)",
                        }}
                        title={`Filter by topic: ${item.topic}`}
                      >
                        {item.topic}
                      </button>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {item.intensity !== null && item.intensity !== undefined ? (
                      <span
                        className="font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          color: "var(--text-primary)",
                          background: "var(--skeleton-base)",
                        }}
                      >
                        {item.intensity}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    {item.relevance !== null && item.relevance !== undefined ? (
                      <span className="font-semibold" style={{ color: "var(--status-success)" }}>
                        {item.relevance}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td className="py-2.5 pl-2 text-right font-mono" style={{ color: "var(--text-secondary)" }}>
                    {item.end_year ? (
                      <button
                        onClick={() => toggleFilterValue("end_year", String(item.end_year))}
                        className="hover:underline"
                        style={{ color: "var(--text-secondary)" }}
                        title={`Filter year ${item.end_year}`}
                      >
                        {item.end_year}
                      </button>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div
        className="pt-2 border-t flex items-center justify-between text-xs"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
      >
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 rounded-lg disabled:opacity-30 transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
          >
            &larr; Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 rounded-lg disabled:opacity-30 transition-colors"
            style={{ background: "var(--bg-input)", color: "var(--text-primary)" }}
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
