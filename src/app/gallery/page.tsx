"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { DateColumns } from "@/lib/sheets";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AutoScrollGallery from "@/components/AutoScrollGallery";
import TabGallery from "@/components/TabGallery";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20">
        <Hero />
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-8">
              <div className="flex gap-4 overflow-hidden border-b pb-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-12 w-40 rounded-lg flex-shrink-0"
                  />
                ))}
              </div>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton
                    key={i}
                    className="w-full mb-4 rounded-xl"
                    style={{ height: `${200 + (i % 3) * 100}px` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-destructive/5 rounded-3xl border border-destructive/10">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">
                  Something went wrong
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {(error as Error).message}
                </p>
              </div>
              <Button onClick={() => refetch()} className="gap-2 shadow-lg">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && dates.length === 0 && (
            <div className="text-center py-24 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">
                No joyful moments found yet. Check back soon!
              </p>
            </div>
          )}

          {/* Gallery */}
          {!isLoading && !error && dates.length > 0 && (
            <>
              <TabGallery dates={dates} />
            </>
          )}
        </section>

        <AutoScrollGallery />
      </main>
    </div>
  );
}
