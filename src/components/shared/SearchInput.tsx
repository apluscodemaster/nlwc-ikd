"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Text search field with a leading search icon, used in the admin list views.
 * Per-page differences (height, rounding, focus ring) are supplied via
 * `className`; `iconClassName`/`wrapperClassName` allow further tuning.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  wrapperClassName,
  iconClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  wrapperClassName?: string;
  iconClassName?: string;
}) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <Search
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400",
          iconClassName,
        )}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white text-sm focus:outline-none transition-all",
          className,
        )}
      />
    </div>
  );
}
