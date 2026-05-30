import React from "react";
import { ChevronDown, X } from "lucide-react";

export function FilterDropdown({
  icon,
  label,
  value,
  options,
  onChange,
  isLoading,
  id,
  hideCount,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  options: { value: number; label: string; count: number }[];
  onChange: (value: number | undefined) => void;
  isLoading: boolean;
  id: string;
  hideCount?: boolean;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon}
      </div>
      <select
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : undefined)
        }
        disabled={isLoading}
        className="w-full h-11 pl-10 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 appearance-none cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50"
        id={id}
      >
        <option value="">All {label}s</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} {!hideCount && opt.count > 0 ? `(${opt.count})` : ""}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

export function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}
