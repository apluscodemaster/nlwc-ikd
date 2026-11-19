"use client";

import React, { useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Save,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ModalShell } from "@/components/shared/ModalShell";
import type { AnnualMeeting } from "@/lib/scheduleService";

export type AnnualDraft = Partial<AnnualMeeting> & { type: "annual" };

const inputClass =
  "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none";

/** Create / edit an annual meeting (home page "Our Gatherings" cards). */
export function AnnualModal({
  mode,
  meeting,
  nextOrder,
  onClose,
  onSave,
  saving,
}: {
  mode: "create" | "edit";
  meeting: AnnualMeeting | null;
  /** Order for a new meeting (after the existing ones). */
  nextOrder: number;
  onClose: () => void;
  onSave: (data: AnnualDraft) => void;
  saving: boolean;
}) {
  const editing = mode === "edit" && meeting;
  const [name, setName] = useState(editing ? meeting.name : "");
  const [period, setPeriod] = useState(editing ? meeting.period : "");
  const [description, setDescription] = useState(
    editing ? meeting.description || "" : "",
  );
  const [imageUrl, setImageUrl] = useState(
    editing ? meeting.imageUrl || "" : "",
  );
  const [order, setOrder] = useState(editing ? meeting.order : nextOrder);
  const [active, setActive] = useState(editing ? meeting.active : true);
  const [imageFailed, setImageFailed] = useState(false);

  const trimmedImage = imageUrl.trim();
  const imageValid = !trimmedImage || /^https?:\/\//i.test(trimmedImage);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return void toast.error("Name is required");
    if (!period.trim()) return void toast.error("When it holds is required");
    if (!imageValid) {
      return void toast.error(
        "Image must be a full link starting with https://",
      );
    }
    onSave({
      type: "annual",
      id: meeting?.id,
      name: name.trim(),
      period: period.trim(),
      description: description.trim(),
      imageUrl: trimmedImage,
      order,
      active,
    });
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          {mode === "create" ? "Add Annual Meeting" : "Edit Annual Meeting"}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Family Life Festival"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            When it holds
          </label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="e.g. Sundays in September"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One or two sentences for the home page card"
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4" />
              Image link <span className="text-gray-400">(https://…)</span>
            </span>
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setImageFailed(false);
            }}
            placeholder="https://res.cloudinary.com/…"
            className={inputClass}
          />
          {!imageValid && (
            <p className="text-xs text-red-500 mt-1">
              Use a full link starting with https://
            </p>
          )}
          {trimmedImage && imageValid && (
            <div className="mt-2 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 aspect-[16/9] flex items-center justify-center">
              {imageFailed ? (
                <p className="text-xs text-red-500 px-3 text-center">
                  This link didn&apos;t load as an image.
                </p>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary link
                <img
                  src={trimmedImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position <span className="text-gray-400">(lower shows first)</span>
          </label>
          <input
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            className={inputClass}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            Show on the home page
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label="Show on the home page"
            onClick={() => setActive(!active)}
            className="focus:outline-none"
          >
            {active ? (
              <ToggleRight className="w-8 h-8 text-green-500" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-gray-400" />
            )}
          </button>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
