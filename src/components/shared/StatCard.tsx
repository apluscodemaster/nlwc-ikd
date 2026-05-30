import React from "react";

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-2xl bg-white border border-gray-100 shadow-sm min-w-0">
      <div
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-none mb-0.5">
          {value}
        </p>
        <p className="text-[9px] sm:text-xs text-muted-foreground font-medium uppercase tracking-tight truncate">
          {label}
        </p>
      </div>
    </div>
  );
}
