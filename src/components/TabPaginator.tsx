// components/TabPaginator.tsx
"use client";
import React from "react";

type Props = {
  pageDates: { date: string }[]; // just header info for UI
  pageIndex: number;
  totalPages: number;
  onPageChange: (i: number) => void;
  globalIndices: number[]; // mapping page slot -> global index
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
    <div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {pageDates.map((d, i) => {
            const globalIdx = globalIndices[i];
            const isSelected = selectedGlobalIndex === globalIdx;
            return (
              <button
                key={d.date + i}
                onClick={() => onSelectGlobalIndex(globalIdx)}
                className={`px-3 py-1 rounded-md text-sm whitespace-nowrap ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-white border shadow-sm text-gray-700"
                }`}
              >
                {d.date}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Page {pageIndex + 1} / {totalPages}
          </span>
          <button
            onClick={() =>
              onPageChange(Math.min(totalPages - 1, pageIndex + 1))
            }
            disabled={pageIndex >= totalPages - 1}
            className="px-2 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
