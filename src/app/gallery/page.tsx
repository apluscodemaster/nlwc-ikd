"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { DateColumns } from "@/lib/sheets";
import PageHeader from "@/components/shared/PageHeader";
import TabGallery from "@/components/TabGallery";
import AutoScrollGallery from "@/components/AutoScrollGallery";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw, Camera } from "lucide-react";

const fetcher = async (): Promise<{ dates: DateColumns[] }> => {
  const res = await fetch("/api/sheet");
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || "Failed to fetch Google Sheet data");
  }
  return res.json();
};

export default function GalleryPage() {
  const { data, error, isLoading, refetch, isError } = useQuery({
    queryKey: ["sheet-data"],
    queryFn: fetcher,
    refetchInterval: 60 * 1000,
  });

  const dates = data?.dates || [];

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-0">
        <PageHeader
          title="Our Worship Experience"
          subtitle="Relive moments from our Church Services and Special Gatherings."
          backgroundImage="/gallery-bg.avif"
        />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-12">
              <div className="flex gap-4 overflow-hidden border-b border-gray-100 pb-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-12 w-48 rounded-2xl flex-shrink-0"
                  />
                ))}
              </div>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton
                    key={i}
                    className="w-full mb-6 rounded-[32px]"
                    style={{ height: `${250 + (i % 3) * 120}px` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 bg-red-50/50 rounded-[48px] border border-red-100 shadow-sm px-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  Oops! Something went wrong
                </h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {(error as Error).message ||
                    "We couldn't load the gallery at this moment. Please try again soon."}
                </p>
              </div>
              <Button
                onClick={() => refetch()}
                className="gap-2 h-14 px-8 rounded-full bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Retry Loading Gallery
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && dates.length === 0 && (
            <div className="text-center py-32 bg-gray-50/50 rounded-[48px] border border-dashed border-gray-200 px-6">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Memories Found
              </h3>
              <p className="text-gray-500 font-medium">
                Our photographers are hard at work! Check back soon for new
                joyful moments.
              </p>
            </div>
          )}

          {/* Gallery Content */}
          {!isLoading && !error && dates.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <TabGallery dates={dates} />
            </motion.div>
          )}
        </section>

        <AutoScrollGallery />
      </main>
    </div>
  );
}
