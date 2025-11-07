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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          {pageDates.map((d, i) => {
            const globalIdx = globalIndices[i];
            const isSelected = selectedGlobalIndex === globalIdx;

            return (
              <button
                key={d.date + i}
                onClick={() => onSelectGlobalIndex(globalIdx)}
                className={`px-4 sm:px-8 lg:px-15 py-3 sm:py-4 lg:py-5 text-sm sm:text-md font-medium rounded-lg cursor-pointer transition-all duration-200
                  ${
                    isSelected
                      ? "bg-[#FF7C18] hover:bg-[#E2801C] text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:text-white hover:bg-[#E2801C]"
                  }`}
              >
                {d.date}
              </button>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
          <button
            onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 cursor-pointer rounded-md text-gray-200 hover:bg-[#E2801C] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>

          <span className="text-xs sm:text-sm text-[#FF7C18]">
            Page <strong>{pageIndex + 1}</strong> / {totalPages}
          </span>

          <button
            onClick={() =>
              onPageChange(Math.min(totalPages - 1, pageIndex + 1))
            }
            disabled={pageIndex >= totalPages - 1}
            className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 cursor-pointer rounded-md text-gray-200 hover:bg-[#E2801C] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
