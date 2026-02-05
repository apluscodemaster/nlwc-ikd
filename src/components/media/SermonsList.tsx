"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Video, Headset, Loader2 } from "lucide-react";
import { recentSermons, type Sermon } from "@/data/sermons";
import MediaCard from "./MediaCard";

export default function SermonsList() {
  const [activeFilter, setActiveFilter] = useState<"all" | "video" | "audio">(
    "all",
  );
  const [search, setSearch] = useState("");

  const filteredSermons = useMemo(() => {
    return recentSermons.filter((sermon) => {
      const matchesSearch =
        sermon.title.toLowerCase().includes(search.toLowerCase()) ||
        sermon.speaker.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "all" || sermon.type === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, search]);

  const filterButtons = [
    { key: "all", label: "All", icon: null },
    { key: "video", label: "Video", icon: Video },
    { key: "audio", label: "Audio", icon: Headset },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
        {/* Filter Tabs */}
        <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl min-w-max">
            {filterButtons.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
                  activeFilter === key
                    ? "bg-white text-primary shadow-md transform scale-105"
                    : "text-gray-500 hover:text-primary hover:bg-white/50"
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sermons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-gray-900 shadow-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Sermons Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeFilter}-${search}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredSermons.map((sermon) => (
            <MediaCard key={sermon.id} media={sermon} />
          ))}

          {filteredSermons.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No sermons found
              </h3>
              <p className="text-muted-foreground">
                {search
                  ? `No results for "${search}"`
                  : "Try changing the filter."}
              </p>
              {(search || activeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("all");
                  }}
                  className="mt-4 text-primary font-medium hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Count */}
      <p className="text-center text-sm text-muted-foreground">
        Showing {filteredSermons.length} of {recentSermons.length} sermons
      </p>

      {/* Coming Soon Note */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-center">
        <h4 className="font-bold text-gray-900 mb-2">
          More Content Coming Soon!
        </h4>
        <p className="text-sm text-muted-foreground">
          We&apos;re working on integrating more audio and video content. Check
          back soon for our full sermon library.
        </p>
      </div>
    </div>
  );
}
