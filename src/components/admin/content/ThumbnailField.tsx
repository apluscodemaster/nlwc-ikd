"use client";

import React, { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  ImagePlus,
  Loader2,
  X,
} from "lucide-react";
import { getAuthorizationHeader } from "@/lib/authClient";

export interface ThumbnailState {
  /** Data URL of the picked file, or the post's current thumbnail URL. */
  preview: string | null;
  fileName: string | null;
  uploading: boolean;
  /** WP media attachment id of the upload (transcripts/manuals use this). */
  mediaId: number | null;
  /** Public URL of the upload — Series Engine sermons store the thumbnail as a
   *  URL (message_thumbnail), not a media attachment id. */
  mediaUrl: string | null;
}

const EMPTY: ThumbnailState = {
  preview: null,
  fileName: null,
  uploading: false,
  mediaId: null,
  mediaUrl: null,
};

/**
 * Picks a file, shows it immediately, and uploads it to the WordPress media
 * library. Shared by the create form and the edit modal; `reset(existingUrl)`
 * prefills the preview with a post's current thumbnail without marking it as
 * a new upload.
 */
export function useThumbnailUpload() {
  const [state, setState] = useState<ThumbnailState>(EMPTY);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback((existingUrl: string | null = null) => {
    setState({ ...EMPTY, preview: existingUrl });
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

  return { state, inputRef, select, reset };
}

export function ThumbnailField({
  upload,
  compact,
}: {
  upload: ReturnType<typeof useThumbnailUpload>;
  /** Slightly shorter preview for the edit modal. */
  compact?: boolean;
}) {
  const { state, inputRef, select, reset } = upload;
  const isNewUpload = Boolean(state.mediaId);

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Message Thumbnail
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif"
        onChange={select}
        className="hidden"
      />
      {state.preview ? (
        <div className="relative rounded-xl border-2 border-primary/20 bg-primary/5 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.preview}
            alt="Thumbnail preview"
            className={`w-full object-cover ${compact ? "h-40" : "h-48"}`}
          />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-white font-medium">
                  {state.uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading…
                    </>
                  ) : isNewUpload ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {state.fileName ?? "New thumbnail uploaded"}
                    </>
                  ) : state.fileName ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      Upload failed
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-white/70" />
                      Current thumbnail
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="px-2.5 h-7 flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <ImagePlus className="w-3 h-3" />
                    Change
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/40 bg-gray-50/50 hover:bg-primary/5 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:shadow-md group-hover:border-primary/20 transition-all">
            <ImagePlus className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 group-hover:text-primary transition-colors">
              Click to upload thumbnail image
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, or AVIF</p>
          </div>
        </button>
      )}
    </div>
  );
}
