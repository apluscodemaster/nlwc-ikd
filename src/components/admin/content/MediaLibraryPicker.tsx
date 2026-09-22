"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ImageIcon, Loader2, Check, X, RefreshCw } from "lucide-react";
import { ModalShell } from "@/components/shared/ModalShell";
import { SearchInput } from "@/components/shared/SearchInput";
import { authFetch } from "@/lib/authClient";

export interface MediaLibraryItem {
  id: number;
  /** Full-size URL — stored on the sermon. */
  url: string;
  /** Smaller rendition used in this grid. */
  thumbnailUrl: string;
  title: string;
  alt: string;
  date: string;
  width: number | null;
  height: number | null;
}

/**
 * Browse the WordPress Media Library and pick an existing image, instead of
 * re-uploading one that is already there. Reads /api/wp/media (admin-only).
 */
export function MediaLibraryPicker({
  onSelect,
  onClose,
}: {
  onSelect: (item: MediaLibraryItem) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<MediaLibraryItem | null>(null);
  // Portalled to <body>: the picker can open from inside the edit modal, whose
  // animated panel would otherwise become the containing block for this fixed
  // overlay (and clip it with overflow-hidden).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Debounce the search box; a new query also resets to page 1.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "24",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await authFetch(`/api/wp/media?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load the media library.");
        setItems([]);
        return;
      }
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      setError("Network error. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const confirm = () => {
    if (!selected) {
      toast.error("Pick an image first");
      return;
    }
    onSelect(selected);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <ModalShell onClose={onClose} className="max-w-3xl">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          Media Library
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={load}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 border-b border-gray-50">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search images by name…"
          className="h-11 pl-11 pr-4 bg-gray-50 focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Loading images…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-red-500 font-medium">{error}</p>
            <button
              type="button"
              onClick={load}
              className="text-xs mt-2 text-primary font-medium hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">
              {debouncedSearch
                ? `No images match “${debouncedSearch}”`
                : "No images in the library yet"}
            </p>
            {debouncedSearch && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs mt-1 text-primary font-medium hover:underline cursor-pointer"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => {
              const isSelected = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item)}
                  onDoubleClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-gray-200 hover:border-primary/40"
                  }`}
                  title={item.title}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary
                      library URLs; a 200px grid cell isn't worth a loader entry. */}
                  <img
                    src={item.thumbnailUrl}
                    alt={item.alt}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2 py-1.5 text-[10px] text-white text-left truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {totalPages > 1 && !loading && !error && (
          <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Prev
            </button>
            <span className="text-xs sm:text-sm text-gray-500 px-2">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50/80 backdrop-blur rounded-b-2xl">
        <p className="text-xs text-gray-500 truncate">
          {selected ? `Selected: ${selected.title}` : "Tap an image to select it"}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!selected}
            className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Use this image
          </button>
        </div>
      </div>
    </ModalShell>,
    document.body,
  );
}
