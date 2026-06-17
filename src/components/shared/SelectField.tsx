import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  /** Classes for the relative wrapper (e.g. layout width). */
  wrapperClassName?: string;
  /** Override the chevron position/size (defaults to right-4, w-4). */
  chevronClassName?: string;
};

/**
 * Native <select> styled with the app's chevron + appearance-none treatment,
 * replacing the repeated `<div className="relative"><select…/><ChevronDown/>`
 * boilerplate. Forwards the ref and all native props, so it works with
 * react-hook-form `{...register("name")}` and controlled value/onChange alike.
 * Per-field sizing (height/padding/background) is supplied via `className`.
 */
export const SelectField = React.forwardRef<
  HTMLSelectElement,
  SelectFieldProps
>(({ className, wrapperClassName, chevronClassName, children, ...props }, ref) => (
  <div className={cn("relative", wrapperClassName)}>
    <select
      ref={ref}
      {...props}
      className={cn(
        "w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer",
        className,
      )}
    >
      {children}
    </select>
    <ChevronDown
      className={cn(
        "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400",
        chevronClassName,
      )}
    />
  </div>
));
SelectField.displayName = "SelectField";
