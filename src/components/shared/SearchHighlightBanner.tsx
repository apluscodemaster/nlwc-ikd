"use client";

import React, { useState, useEffect } from "react";
import { Search, X, ArrowUp } from "lucide-react";
import Link from "next/link";

interface SearchHighlightBannerProps {
  query: string;
  backHref: string;
  backLabel: string;
}

/**
 * Banner displayed at the top of a detail page when the user
 * arrived via a search. Shows the matched keyword and provides
 * a button to scroll between highlights, plus a link back to
 * the search results.
 */
export default function SearchHighlightBanner({
  query,
  backHref,
  backLabel,
}: SearchHighlightBannerProps) {
  const [highlightCount, setHighlightCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    // Count highlights after content renders
    const timer = setTimeout(() => {
      const marks = document.querySelectorAll("mark.search-highlight");
      setHighlightCount(marks.length);
      // Scroll to first highlight
      if (marks.length > 0) {
        setCurrentIndex(0);
        scrollToHighlight(marks[0] as HTMLElement);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const scrollToHighlight = (el: HTMLElement) => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Briefly emphasize the current highlight
    el.classList.add("search-highlight-active");
    setTimeout(() => el.classList.remove("search-highlight-active"), 1500);
  };

  const goToNextHighlight = () => {
    const marks = document.querySelectorAll("mark.search-highlight");
    if (marks.length === 0) return;
    const next = (currentIndex + 1) % marks.length;
    setCurrentIndex(next);
    scrollToHighlight(marks[next] as HTMLElement);
  };

  const goToPrevHighlight = () => {
    const marks = document.querySelectorAll("mark.search-highlight");
    if (marks.length === 0) return;
    const prev = currentIndex <= 0 ? marks.length - 1 : currentIndex - 1;
    setCurrentIndex(prev);
    scrollToHighlight(marks[prev] as HTMLElement);
  };

  return (
    <div className="sticky top-[64px] z-30 bg-primary/5 border-b border-primary/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Search className="w-4 h-4 text-primary" />
          <span>
            Highlighting{" "}
            <strong className="text-primary">&ldquo;{query}&rdquo;</strong>
            {highlightCount > 0 && (
              <span className="text-muted-foreground ml-1">
                — {highlightCount} match{highlightCount !== 1 ? "es" : ""}{" "}
                {currentIndex >= 0 && `(${currentIndex + 1}/${highlightCount})`}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {highlightCount > 1 && (
            <>
              <button
                onClick={goToPrevHighlight}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                aria-label="Previous match"
                title="Previous match"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={goToNextHighlight}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors rotate-180"
                aria-label="Next match"
                title="Next match"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </>
          )}

          <Link
            href={`${backHref}?q=${encodeURIComponent(query)}`}
            className="ml-2 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Back to {backLabel}
          </Link>

          <Link
            href={`${backHref.replace(/\?.*$/, "")}`}
            className="p-1.5 rounded-lg hover:bg-gray-200 text-muted-foreground transition-colors"
            aria-label="Clear search"
            title="Clear search highlight"
          >
            <X className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
