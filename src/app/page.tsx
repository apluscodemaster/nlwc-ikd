"use client";

import React, { useEffect, useState } from "react";
import type { DateColumns } from "@/lib/sheets";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TabGallery from "@/components/TabGallery";

export default function Page() {
  const [dates, setDates] = useState<DateColumns[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/sheet")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to fetch sheet");
        if (mounted) {
          setDates(json.dates || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <Navbar />

      <main className="pt-20">
        <Hero />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 justify-center py-12">
          {loading && (
            <div className="text-center py-20">Loading gallery...</div>
          )}
          {error && <div className="text-red-600">Error: {error}</div>}
          {!loading && !error && dates.length === 0 && (
            <div className="text-center py-20">No dates/images available.</div>
          )}

          {!loading && !error && dates.length > 0 && (
            <TabGallery dates={dates} />
          )}
        </section>
      </main>
    </div>
  );
}
