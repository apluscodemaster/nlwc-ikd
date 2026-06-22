"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, Loader2, X, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { searchBible } from "@/lib/bibleSearch";
import type { SearchResult } from "@/types/bible";

interface BibleSearchProps {
  className?: string;
  /** Called when a verse is chosen. Defaults to a toast showing the verse. */
  onSelectVerse?: (result: SearchResult) => void;
}

export default function BibleSearch({
  className,
  onSelectVerse,
}: BibleSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  // Debounced search: 200ms, triggers from 2+ characters. Each keystroke aborts
  // the previous request; a request id guards against out-of-order responses.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setActiveIndex(0);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    const id = ++requestId.current;
    setLoading(true);

    const handle = setTimeout(async () => {
      try {
        const found = await searchBible(q, controller.signal);
        if (id !== requestId.current) return;
        setResults(found);
        setActiveIndex(0);
        setError(false);
      } catch {
        if (controller.signal.aborted || id !== requestId.current) return;
        setError(true);
        setResults([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [query]);

  // Reset transient state whenever the overlay closes.
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      setError(false);
    }
  }, [open]);

  // Keep the highlighted result scrolled into view during keyboard navigation.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, results]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      if (onSelectVerse) onSelectVerse(result);
      else toast(result.ref, { description: result.text });
    },
    [onSelectVerse],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(results[activeIndex] ?? results[0]);
    }
  };

  const trimmed = query.trim();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search Scripture"
        className={cn(
          "flex h-10 w-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white/70 text-gray-600 transition-all hover:bg-white hover:text-primary active:scale-95 md:w-auto md:px-4",
          className,
        )}
      >
        <Search className="h-[18px] w-[18px] shrink-0" />
        <span className="hidden text-sm font-medium md:inline">
          Search Scripture...
        </span>
      </button>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          className="fixed left-1/2 top-[8vh] z-[101] flex max-h-[84vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-black/20 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">
            Search Scripture
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search the King James Version by keyword or verse reference.
          </DialogPrimitive.Description>

          {/* Sticky search input */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
            <Search className="h-5 w-5 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a verse or keyword..."
              autoComplete="off"
              spellCheck={false}
              className="flex-1 bg-transparent text-base text-gray-900 outline-none placeholder:text-gray-400"
            />
            {loading && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />
            )}
            <DialogPrimitive.Close
              aria-label="Close"
              className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[70vh] overflow-y-auto p-2">
            {error ? (
              <div className="px-3 py-10 text-center text-sm text-gray-500">
                Couldn&apos;t reach the scripture search. Please try again.
              </div>
            ) : trimmed.length < 2 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-10 text-center text-gray-400">
                <BookOpen className="h-6 w-6" />
                <p className="text-sm">Type a verse or keyword...</p>
              </div>
            ) : loading && results.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-3 py-10 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-gray-500">
                No results for &ldquo;{trimmed}&rdquo;
              </div>
            ) : (
              <ul className="space-y-1">
                {results.map((result, index) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      data-index={index}
                      onClick={() => handleSelect(result)}
                      onMouseMove={() => setActiveIndex(index)}
                      className={cn(
                        "w-full rounded-xl px-3 py-2.5 text-left transition-colors",
                        index === activeIndex
                          ? "bg-primary/10"
                          : "hover:bg-gray-50",
                      )}
                    >
                      <span className="block text-sm font-bold text-primary">
                        {result.ref}
                      </span>
                      <span className="mt-0.5 line-clamp-3 text-sm text-gray-700">
                        {result.text}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
