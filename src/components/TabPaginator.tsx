"use client";

import React from "react";

type Props = {
  pageDates: { date: string }[];
  pageIndex: number;
  totalPages: number;
  onPageChange: (i: number) => void;
  globalIndices: number[];
  selectedGlobalIndex: number | null;
  onSelectGlobalIndex: (globalIdx: number) => void;
};

export default function TabPaginator({
  pageDates,
  pageIndex,
  totalPages,
  onPageChange,
  globalIndices,
  selectedGlobalIndex,
  onSelectGlobalIndex,
}: Props) {
  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-gray-200 pb-3">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {pageDates.map((d, i) => {
            const globalIdx = globalIndices[i];
            const isSelected = selectedGlobalIndex === globalIdx;

            return (
              <button
                key={d.date + i}
                onClick={() => onSelectGlobalIndex(globalIdx)}
                className={`px-5 py-2 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 whitespace-nowrap
                  ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {d.date}
              </button>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
            className="px-3 py-1.5 text-sm border border-gray-300 cursor-pointer rounded-md text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>

          <span className="text-sm text-gray-600">
            Page <strong>{pageIndex + 1}</strong> / {totalPages}
          </span>

          <button
            onClick={() =>
              onPageChange(Math.min(totalPages - 1, pageIndex + 1))
            }
            disabled={pageIndex >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-300 cursor-pointer rounded-md text-gray-200 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
