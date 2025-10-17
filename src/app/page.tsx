// app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import type { DateColumns } from "@/lib/sheets";
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

  if (loading)
    return <div className="text-center py-20">Loading gallery...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!dates.length)
    return <div className="text-center py-20">No dates/images available.</div>;

  return <TabGallery dates={dates} />;
}
