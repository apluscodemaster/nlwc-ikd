"use client";

import React, { useMemo, useState } from "react";
import type { DateColumns } from "@/lib/sheets";
import TabPaginator from "./TabPaginator";
import MasonryGrid from "./MasonryGrid";

type Props = {
  dates: DateColumns[];
};

// Helper function to format date like "Sunday, 31st Aug. 2025"
function formatDisplayDate(dateString: string) {
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();

  // Add ordinal suffix (st, nd, rd, th)
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
      ? "nd"
      : day % 10 === 3 && day !== 13
      ? "rd"
      : "th";

  return `${dayName}, ${day}${suffix} ${month}. ${year}`;
}

export default function TabGallery({ dates }: Props) {
  // group dates into pages of 4
  const pageSize = 4;
  const totalPages = Math.ceil(dates.length / pageSize);

  // default to last page (most recent)
  const [pageIndex, setPageIndex] = useState(Math.max(0, totalPages - 1));
  const [selectedDateIdx, setSelectedDateIdx] = useState<number | null>(null);

  // Group page data
  const pageDates = useMemo(() => {
    const start = pageIndex * pageSize;
    return dates.slice(start, start + pageSize);
  }, [dates, pageIndex]);

  // If nothing selected, default to last date
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
    setSelectedDateIdx(globalIndex);
    setPageIndex(Math.floor(globalIndex / pageSize));
  };

  const globalIndicesForPage = (idx: number) => {
    const start = pageIndex * pageSize;
    return dates.map((_, i) => i).slice(start, start + pageSize);
  };

  return (
    <div>
      <TabPaginator
        pageDates={pageDates}
        pageIndex={pageIndex}
        totalPages={totalPages}
        onPageChange={setPageIndex}
        globalIndices={globalIndicesForPage(pageIndex)}
        selectedGlobalIndex={selectedDateIdx}
        onSelectGlobalIndex={selectDateByGlobalIndex}
      />

      <div className="mt-6">
        {selectedDateIdx !== null ? (
          <div>
            <div className="mb-4 text-sm text-white-600">
              Viewing date:{" "}
              <strong>{formatDisplayDate(dates[selectedDateIdx].date)}</strong>
            </div>

            <MasonryGrid images={dates[selectedDateIdx].images} />
          </div>
        ) : (
          <div className="text-gray-600">Select a date to view images</div>
        )}
      </div>
    </div>
  );
}
