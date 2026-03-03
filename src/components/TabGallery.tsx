"use client";

import React, { useMemo, useState } from "react";
import type { DateColumns } from "@/lib/sheets";
import TabPaginator from "./TabPaginator";
import MasonryGrid from "./MasonryGrid";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "lucide-react";

type Props = {
  dates: DateColumns[];
};

// Helper function to format date like "Sunday, 31st August 2025"
function formatDisplayDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();

    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
          ? "nd"
          : day % 10 === 3 && day !== 13
            ? "rd"
            : "th";

    return `${dayName}, ${day}${suffix} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

export default function TabGallery({ dates }: Props) {
  const pageSize = 4;
  const totalPages = Math.ceil(dates.length / pageSize);

  const [pageIndex, setPageIndex] = useState(Math.max(0, totalPages - 1));
  const [selectedDateIdx, setSelectedDateIdx] = useState<number | null>(null);

  const pageDates = useMemo(() => {
    const start = pageIndex * pageSize;
    return dates.slice(start, start + pageSize);
  }, [dates, pageIndex]);

  React.useEffect(() => {
    if (selectedDateIdx === null) {
      setSelectedDateIdx(dates.length - 1);
      setPageIndex(Math.max(0, totalPages - 1));
    } else {
      const selectedOnPage =
        Math.floor(selectedDateIdx / pageSize) === pageIndex;
      if (!selectedOnPage) {
        setPageIndex(Math.floor(selectedDateIdx / pageSize));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates.length]);

  const selectDateByGlobalIndex = (globalIndex: number) => {
    if (selectedDateIdx === globalIndex) return;
    setSelectedDateIdx(globalIndex);
    setPageIndex(Math.floor(globalIndex / pageSize));
  };

  const globalIndicesForPage = () => {
    const start = pageIndex * pageSize;
    return dates.map((_, i) => i).slice(start, start + pageSize);
  };

  return (
    <div className="relative">
      <div className="sticky top-[72px] sm:top-[80px] z-30 bg-white/95 backdrop-blur-xl border-y border-gray-100 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 py-3 md:py-6 transition-all duration-500 shadow-sm shadow-gray-100/50">
        <TabPaginator
          pageDates={pageDates}
          pageIndex={pageIndex}
          totalPages={totalPages}
          onPageChange={setPageIndex}
          globalIndices={globalIndicesForPage()}
          selectedGlobalIndex={selectedDateIdx}
          onSelectGlobalIndex={selectDateByGlobalIndex}
        />
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {selectedDateIdx !== null ? (
            <motion.div
              key={dates[selectedDateIdx].date}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.5, ease: "circOut" }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-0.5">
                      Collection Date
                    </p>
                    <h3 className="text-xl font-bold text-gray-900">
                      {formatDisplayDate(dates[selectedDateIdx].date)}
                    </h3>
                  </div>
                </div>

                <div className="px-4 py-1.5 rounded-full bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                  {dates[selectedDateIdx].images.length} Images Captured
                </div>
              </div>

              <MasonryGrid images={dates[selectedDateIdx].images} />
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">Select a date to view memories</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
