import React, { ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Reusable section label/overline component used across the site.
 * Displays as "— SECTION NAME" in uppercase with primary color.
 *
 * @example
 * <SectionLabel>Who We Are</SectionLabel>
 * // Renders: — WHO WE ARE
 */
export default function SectionLabel({
  children,
  className = "",
}: SectionLabelProps) {
  return (
    <h4 className={`text-primary font-bold uppercase tracking-widest text-sm ${className}`}>
      — {children}
    </h4>
  );
}
