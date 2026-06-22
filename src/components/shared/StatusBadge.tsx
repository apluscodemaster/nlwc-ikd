import React from "react";
import { cn } from "@/lib/utils";

/**
 * Small pill badge used for statuses (Live/Draft/Scheduled/Inactive…) across
 * the admin views. Supplies the shared shape; pass colors/size via `className`
 * (e.g. "bg-emerald-50 text-emerald-600 px-2 py-0.5 text-[10px]").
 */
export function StatusBadge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold",
        className,
      )}
    >
      {children}
    </span>
  );
}
