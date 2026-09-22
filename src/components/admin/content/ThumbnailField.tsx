"use client";

import React, { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  ImageIcon,
  ImagePlus,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { getAuthorizationHeader } from "@/lib/authClient";
import {
  MediaLibraryPicker,
  type MediaLibraryItem,
} from "./MediaLibraryPicker";

/** Where the current thumbnail came from — drives the caption on the preview. */
export type ThumbnailSource = "upload" | "library" | "existing" | null;

export interface ThumbnailState {
  /** Data URL of the picked file, or the URL of a library/current image. */
  preview: string | null;
  fileName: string | null;
  uploading: boolean;
  /** WP media attachment id (transcripts/manuals use this as featured media). */
  mediaId: number | null;
  /** Public URL — Series Engine sermons store the thumbnail as a URL
   *  (message_thumbnail), not a media attachment id. */
  mediaUrl: string | null;
  source: ThumbnailSource;
}

const EMPTY: ThumbnailState = {
  preview: null,
  fileName: null,
  uploading: false,
  mediaId: null,
  mediaUrl: null,
  source: null,
};

/**
 * One thumbnail, two ways to set it: upload a new file to the WordPress media
 * library, or pick an image already in it. Either way the caller ends up with
 * the same `mediaId` + `mediaUrl`, so the save path doesn't care which was
 * used. Shared by the create form and the edit modal; `reset(existingUrl)`
 * prefills the preview with a post's current thumbnail without marking it as a
 * new selection.
 */
export function useThumbnailUpload() {
  const [state, setState] = useState<ThumbnailState>(EMPTY);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback((existingUrl: string | null = null) => {
    setState({
      ...EMPTY,
      preview: existingUrl,
      source: existingUrl ? "existing" : null,
    });
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const select = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () =>
      setState((s) => ({ ...s, preview: reader.result as string }));
    reader.readAsDataURL(file);

    setState((s) => ({
      ...s,
      fileName: file.name,
      uploading: true,
      mediaId: null,
      mediaUrl: null,
      source: "upload",
    }));
    try {
      const authHeader = await getAuthorizationHeader();
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/wp/upload-media", {
        method: "POST",
        headers: { Authorization: authHeader },
        body: formData,
      });
      const data = await res.json();
      // The route returns the new attachment as `id` (not `mediaId`).
      if (data.id) {
        setState((s) => ({
          ...s,
          mediaId: data.id,
          mediaUrl: data.url || null,
        }));
        toast.success("Thumbnail uploaded", {
          description: "Image saved to WordPress media library.",
        });
      } else {
        toast.error("Thumbnail upload failed", {
          description: data.error || "Unknown error",
        });
      }
    } catch {
      toast.error("Upload error", {
        description: "Could not upload thumbnail to WordPress.",
      });
    } finally {
      setState((s) => ({ ...s, uploading: false }));
    }
  }, []);

  /** Adopt an image that is already in the media library — nothing to upload. */
  const selectFromLibrary = useCallback((item: MediaLibraryItem) => {
    setState({
      preview: item.thumbnailUrl || item.url,
      fileName: item.title,
      uploading: false,
      mediaId: item.id,
      mediaUrl: item.url,
      source: "library",
    });
    if (inputRef.current) inputRef.current.value = "";
    toast.success("Image selected", { description: item.title });
  }, []);

  return { state, inputRef, select, selectFromLibrary, reset };
}

export function ThumbnailField({
  upload,
  compact,
}: {
  upload: ReturnType<typeof useThumbnailUpload>;
  /** Slightly shorter preview for the edit modal. */
  compact?: boolean;
}) {
  const { state, inputRef, select, selectFromLibrary, reset } = upload;
  const [showLibrary, setShowLibrary] = useState(false);

  const caption = () => {
    if (state.uploading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Uploading…
        </>
      );
    }
    if (state.source === "library") {
      return (
        <>
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          From library{state.fileName ? ` — ${state.fileName}` : ""}
        </>
      );
    }
    if (state.source === "upload") {
      return state.mediaId ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {state.fileName ?? "New thumbnail uploaded"}
        </>
      ) : (
        <>
          <AlertCircle className="w-4 h-4 text-amber-400" />
          Upload failed
        </>
      );
    }
    return (
      <>
        <Eye className="w-4 h-4 text-white/70" />
        Current thumbnail
      </>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700">
          Message Thumbnail
        </label>
        {state.preview && (
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Choose from library
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif"
        onChange={select}
        className="hidden"
      />

      {state.preview ? (
        <div className="relative rounded-xl border-2 border-primary/20 bg-primary/5 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URL or
              arbitrary library URL; not worth a remotePatterns entry. */}
          <img
            src={state.preview}
            alt="Thumbnail preview"
            className={`w-full object-cover ${compact ? "h-40" : "h-48"}`}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-white font-medium min-w-0 [&>svg]:shrink-0">
                  <span className="flex items-center gap-2 truncate">
                    {caption()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="px-2.5 h-7 flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/40 hover:bg-red-500/80 text-white transition-colors cursor-pointer"
                    aria-label="Remove thumbnail"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/40 bg-gray-50/50 hover:bg-primary/5 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:shadow-md group-hover:border-primary/20 transition-all">
              <ImagePlus className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">
                Upload a new image
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, AVIF</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/40 bg-gray-50/50 hover:bg-primary/5 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:shadow-md group-hover:border-primary/20 transition-all">
              <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">
                Choose from library
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Reuse an existing image
              </p>
            </div>
          </button>
        </div>
      )}

      {showLibrary && (
        <MediaLibraryPicker
          onSelect={selectFromLibrary}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}
