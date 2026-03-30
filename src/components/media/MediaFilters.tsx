"use client";

import React from "react";
import { Search } from "lucide-react";

interface MediaFiltersProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function MediaFilters({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: MediaFiltersProps) {
  const tabs = [
    { id: "all", label: "All Media" },
    { id: "audio", label: "Audio Messages" },
    { id: "video", label: "Video Messages" },
    { id: "resources", label: "Resources" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-2xl overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-8 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search messages, topics..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-14 pl-14 pr-6 rounded-2xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-muted-foreground">
        <span>Quick Filters:</span>
        <button className="px-4 py-2 rounded-full border border-gray-100 hover:border-primary hover:text-primary transition-all">
          Latest
        </button>
        <button className="px-4 py-2 rounded-full border border-gray-100 hover:border-primary hover:text-primary transition-all">
          Pastor Laide
        </button>
        <button className="px-4 py-2 rounded-full border border-gray-100 hover:border-primary hover:text-primary transition-all">
          Sunday School Manuals
        </button>
        <button className="px-4 py-2 rounded-full border border-gray-100 hover:border-primary hover:text-primary transition-all">
          House Fellowship
        </button>
      </div>
    </div>
  );
}
