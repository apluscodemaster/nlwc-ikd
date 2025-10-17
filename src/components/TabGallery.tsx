// components/TabGallery.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { DateColumns } from "@/lib/sheets";
import TabPaginator from "./TabPaginator";
import MasonryGrid from "./MasonryGrid";

type Props = {
  dates: DateColumns[];
};

export default function TabGallery({ dates }: Props) {
  // group dates into pages of 4
  const pageSize = 4;
  const totalPages = Math.ceil(dates.length / pageSize);

  // default to last page (most recent)
  const [pageIndex, setPageIndex] = useState(Math.max(0, totalPages - 1));
  const [selectedDateIdx, setSelectedDateIdx] = useState<number | null>(null);

  // When pages change, reset selected index to first tab on that page
  const pageDates = useMemo(() => {
    const start = pageIndex * pageSize;
    return dates.slice(start, start + pageSize);
  }, [dates, pageIndex]);

  // If nothing selected, default to the last date globally
  React.useEffect(() => {
    // if selected is outside current page, pick first item of page
    if (selectedDateIdx === null) {
      // select the last date overall by default
      setSelectedDateIdx(dates.length - 1);
      setPageIndex(Math.max(0, totalPages - 1));
    } else {
      // ensure selection is within visible page; if not, change page
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
            <div className="mb-4 text-sm text-gray-600">
              Viewing date: <strong>{dates[selectedDateIdx].date}</strong>
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
