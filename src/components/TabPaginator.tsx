"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
          {pageDates.map((d, i) => {
            const globalIdx = globalIndices[i];
            const isSelected = selectedGlobalIndex === globalIdx;

            return (
              <Button
                key={d.date + i}
                onClick={() => onSelectGlobalIndex(globalIdx)}
                variant={isSelected ? "default" : "secondary"}
                className={`flex-1 sm:px-6 lg:px-8 py-6 text-sm font-semibold transition-all duration-300
                  ${isSelected ? "shadow-lg scale-105" : "hover:bg-primary/20 hover:text-primary"}`}
              >
                {d.date}
              </Button>
            );
          })}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end bg-gray-50/50 p-2 rounded-xl border border-gray-100 shadow-sm">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
            className="h-9 w-9 border-gray-200 hover:border-primary/50 hover:bg-primary/5 text-gray-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium text-primary px-2">
            <strong>{pageIndex + 1}</strong>{" "}
            <span className="text-gray-400 mx-1">/</span> {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              onPageChange(Math.min(totalPages - 1, pageIndex + 1))
            }
            disabled={pageIndex >= totalPages - 1}
            className="h-9 w-9 border-gray-200 hover:border-primary/50 hover:bg-primary/5 text-gray-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
