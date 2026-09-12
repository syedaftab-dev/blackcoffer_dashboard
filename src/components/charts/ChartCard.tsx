"use client";

import React from "react";
import { useFilterStore } from "@/store/filterStore";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  isEmpty: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
  skeletonHeight?: number;
}

export default function ChartCard({
  title,
  subtitle,
  isLoading,
  isEmpty,
  error,
  onRetry,
  children,
  className = "",
  skeletonHeight = 300,
}: ChartCardProps) {
  const clearFilters = useFilterStore((s) => s.clearFilters);

  return (
    <div className={`pill-card p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3 animate-pulse">
          <div
            className="w-full rounded-2xl"
            style={{ height: `${skeletonHeight}px`, background: "var(--skeleton-base)" }}
          />
          <div className="flex gap-2">
            <div className="h-3 rounded flex-1" style={{ background: "var(--skeleton-base)" }} />
            <div className="h-3 rounded w-16" style={{ background: "var(--skeleton-base)" }} />
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div
          className="flex flex-col items-center justify-center py-10 text-center"
          style={{ minHeight: `${skeletonHeight}px` }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
            style={{ background: "var(--accent-rose-dim)", color: "var(--accent-rose)" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            Failed to load data
          </p>
          <p className="text-xs mb-3 max-w-xs" style={{ color: "var(--text-secondary)" }}>
            An unexpected error occurred while communicating with the server.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-3.5 py-1.5 rounded-xl border font-semibold transition-colors"
              style={{
                background: "var(--accent-rose-dim)",
                borderColor: "var(--accent-rose-border)",
                color: "var(--accent-rose)",
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && isEmpty && (
        <div
          className="flex flex-col items-center justify-center py-10 text-center"
          style={{ minHeight: `${skeletonHeight}px` }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
            style={{ background: "var(--skeleton-base)", color: "var(--text-secondary)" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            No data matches current filters
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
      )}

      {/* Chart content */}
      {!isLoading && !error && !isEmpty && children}
    </div>
  );
}
