"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  pageDates: { date: string }[];
  pageIndex: number;
  totalPages: number;
  onPageChange: (i: number) => void;
  globalIndices: number[];
  selectedGlobalIndex: number | null;
  onSelectGlobalIndex: (globalIdx: number) => void;
};

// Helper to format tab dates like "Aug 31"
function formatTabDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateString;
  }
}

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
        {/* Tab Buttons - Horizontal Scroll on Mobile */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-2 min-w-full md:min-w-0 pb-1 md:pb-0">
            {pageDates.map((d, i) => {
              const globalIdx = globalIndices[i];
              const isSelected = selectedGlobalIndex === globalIdx;

              return (
                <button
                  key={d.date + i}
                  onClick={() => onSelectGlobalIndex(globalIdx)}
                  className={cn(
                    "relative px-4 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl text-[11px] md:text-sm font-bold transition-all duration-300 flex items-center gap-1.5 md:gap-2 overflow-hidden whitespace-nowrap shrink-0",
                    isSelected
                      ? "text-white shadow-lg shadow-primary/20 scale-105"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100",
                  )}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-primary -z-10"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <Calendar
                    className={cn(
                      "w-3.5 h-3.5 md:w-4 md:h-4",
                      isSelected ? "text-white/60" : "text-gray-400",
                    )}
                  />
                  {formatTabDate(d.date)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pagination Controls - More compact on mobile */}
        <div className="flex items-center gap-2 self-center md:self-auto shrink-0">
          <div className="flex items-center bg-gray-50 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-gray-100">
            <button
              onClick={() => onPageChange(Math.max(0, pageIndex - 1))}
              disabled={pageIndex === 0}
              className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-lg md:rounded-xl bg-white border border-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary transition-all shadow-sm"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            <div className="px-4 md:px-6 flex flex-col items-center">
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-0.5">
                Page
              </span>
              <span className="text-xs md:text-sm font-bold text-gray-900 leading-none">
                {pageIndex + 1} <span className="text-gray-300">/</span>{" "}
                {totalPages}
              </span>
            </div>

            <button
              onClick={() =>
                onPageChange(Math.min(totalPages - 1, pageIndex + 1))
              }
              disabled={pageIndex >= totalPages - 1}
              className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-lg md:rounded-xl bg-white border border-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary transition-all shadow-sm"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
