import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize a search query by removing/replacing special punctuation.
 * Handles commas, colons, periods, semicolons, quotes, etc.
 * This makes searches more resilient to punctuation variations.
 *
 * Example: "The Reality of the Death, Burial and Resurrection"
 *   → "The Reality of the Death Burial and Resurrection"
 */
export function normalizeSearchQuery(query: string): string {
  if (!query || typeof query !== "string") return "";

  return (
    query
      // Replace common punctuation with spaces
      .replace(/[,;:'"—–]/g, " ")
      // Remove other special chars but keep alphanumerics and spaces
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      // Collapse multiple spaces into one
      .replace(/\s+/g, " ")
      .trim()
  );
}
