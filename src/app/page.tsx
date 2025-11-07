"use client";

import React from "react";
import useSWR from "swr";
import type { DateColumns } from "@/lib/sheets";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TabGallery from "@/components/TabGallery";

const fetcher = async (url: string): Promise<{ dates: DateColumns[] }> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || "Failed to fetch Google Sheet data");
  }
  return res.json();
};

export default function Page() {
  // ✅ useSWR automatically caches, revalidates, and refreshes in the background
  const {
    data,
    error,
    isLoading,
    mutate, // allows manual refresh
  } = useSWR("/api/sheet", fetcher, {
    refreshInterval: 60 * 1000, // auto-refresh every 60 seconds
    revalidateOnFocus: true, // refetch when tab becomes active again
  });

  const dates = data?.dates || [];

  return (
    <div>
      <Navbar />

      <main className="pt-20">
        <Hero />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 justify-center py-12">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-20">Loading gallery...</div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20 text-red-600">
              Error loading gallery: {error.message}
              <div className="mt-4">
                <button
                  onClick={() => mutate()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && dates.length === 0 && (
            <div className="text-center py-20">No dates/images available.</div>
          )}

          {/* Gallery */}
          {!isLoading && !error && dates.length > 0 && (
            <>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => mutate()}
                  className="px-4 py-2 text-black bg-gray-200 rounded-md hover:bg-gray-300 transition text-sm"
                >
                  🔄 Refresh
                </button>
              </div>
              <TabGallery dates={dates} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
