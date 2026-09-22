"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  FileAudio,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { SelectField } from "@/components/shared/SelectField";
import { CustomDatePicker } from "@/components/shared/CustomDatePicker";
import { scheduledPublishDateTime } from "@/utils/publishSchedule";
import { RichTextEditor } from "./RichTextEditor";
import {
  TRANSCRIPT_TYPE_OPTIONS,
  type ContentType,
  type PostStatus,
  type SeriesItem,
  type SpeakerItem,
  type TranscriptType,
} from "./types";

/**
 * The Church Content form fields, defined once. The create forms (via
 * react-hook-form's <Controller>) and the edit modal (via useState) both render
 * these, so a label, option list or hint only ever has to change here.
 *
 * Every field is controlled: `value` + `onChange(value)`.
 */

const LABEL_CLASS = "block text-sm font-semibold text-gray-700 mb-2";
const INPUT_CLASS =
  "w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className={LABEL_CLASS}>
      {children}
      {required && <span className="text-red-400"> *</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  );
}

// ─── Select with an inline "add new" row ─────────────────────────────────────

interface TaxonomySelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  loading?: boolean;
  placeholder: string;
  loadingText: string;
  /** Text on the "add new" toggle, e.g. "New minister". */
  addLabel: string;
  addPlaceholder: string;
  /**
   * Creates the entry and returns the select value to pick, or null when it
   * failed (the hook has already toasted). Omit to hide the add affordance.
   */
  onAdd?: (name: string) => Promise<string | null>;
}

function TaxonomySelect({
  label,
  value,
  onChange,
  options,
  loading,
  placeholder,
  loadingText,
  addLabel,
  addPlaceholder,
  onAdd,
}: TaxonomySelectProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setAdding(false);
    setDraft("");
  };

  const submit = async () => {
    const name = draft.trim();
    if (!name || !onAdd || saving) return;
    setSaving(true);
    try {
      const picked = await onAdd(name);
      if (picked !== null) {
        onChange(picked);
        close();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700">{label}</label>
        {onAdd && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {addLabel}
          </button>
        )}
      </div>

      <SelectField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 px-4 pr-10"
      >
        <option value="">{placeholder}</option>
        {loading ? (
          <option disabled>{loadingText}</option>
        ) : (
          options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))
        )}
      </SelectField>

      {onAdd && adding && (
        <div className="mt-2 flex items-center gap-2 p-2 rounded-xl border border-primary/20 bg-primary/5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              } else if (e.key === "Escape") {
                close();
              }
            }}
            disabled={saving}
            placeholder={addPlaceholder}
            className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving || !draft.trim()}
            className="h-10 px-3 inline-flex items-center gap-1.5 rounded-lg bg-primary text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add
          </button>
          <button
            type="button"
            onClick={close}
            disabled={saving}
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-600 cursor-pointer"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Minister / Speaker ───────────────────────────────────────────────────────

export function MinisterField({
  value,
  onChange,
  speakers,
  loading,
  onAdd,
}: {
  /** The speaker's display name (what WordPress stores). */
  value: string;
  onChange: (name: string) => void;
  speakers: SpeakerItem[];
  loading?: boolean;
  /** From useSermonTaxonomy — creates the speaker in Series Engine. */
  onAdd?: (name: string) => Promise<SpeakerItem | null>;
}) {
  return (
    <TaxonomySelect
      label="Speaker / Minister"
      value={value}
      onChange={onChange}
      options={speakers.map((s) => ({
        value: s.name,
        label: `${s.name} (${s.messageCount} messages)`,
      }))}
      loading={loading}
      placeholder="Select a minister…"
      loadingText="Loading ministers…"
      addLabel="New minister"
      addPlaceholder="e.g. Pst. David Kilanko"
      onAdd={onAdd ? async (name) => (await onAdd(name))?.name ?? null : undefined}
    />
  );
}

// ─── Series / Category ────────────────────────────────────────────────────────

export function SeriesField({
  value,
  onChange,
  series,
  loading,
  onAdd,
}: {
  /** The Series Engine series id as a string ("" for none). */
  value: string;
  onChange: (seriesId: string) => void;
  series: SeriesItem[];
  loading?: boolean;
  /** From useSermonTaxonomy — creates the series in Series Engine. */
  onAdd?: (title: string) => Promise<SeriesItem | null>;
}) {
  return (
    <TaxonomySelect
      label="Series / Category"
      value={value}
      onChange={onChange}
      options={series.map((s) => ({
        value: String(s.id),
        label: `${s.title} (${s.messageCount} messages)`,
      }))}
      loading={loading}
      placeholder="Select a series…"
      loadingText="Loading series…"
      addLabel="New series"
      addPlaceholder="e.g. Foundations of Faith"
      onAdd={
        onAdd
          ? async (title) => {
              const item = await onAdd(title);
              return item ? String(item.id) : null;
            }
          : undefined
      }
    />
  );
}

// ─── Transcript type ──────────────────────────────────────────────────────────

export function TranscriptTypeField({
  value,
  onChange,
  required,
}: {
  value: TranscriptType;
  onChange: (value: TranscriptType) => void;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>Transcript Type</FieldLabel>
      <SelectField
        value={value}
        onChange={(e) => onChange(e.target.value as TranscriptType)}
        className="h-12 px-4 pr-10"
      >
        {TRANSCRIPT_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

// ─── Content (RTE) / Description ──────────────────────────────────────────────

export function ContentField({
  type,
  value,
  onChange,
  error,
  required,
  placeholder,
}: {
  type: ContentType;
  value: string;
  onChange: (html: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const isSermon = type === "sermon";
  return (
    <div>
      <FieldLabel required={required}>
        {isSermon ? "Description" : "Content"}
      </FieldLabel>
      {isSermon ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-y"
          placeholder={placeholder ?? "Brief description of the sermon (optional)…"}
        />
      ) : (
        <RichTextEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? `Write the ${type} content here…`}
        />
      )}
      <FieldError message={error} />
    </div>
  );
}

// ─── Publish / sermon date ────────────────────────────────────────────────────

export function PublishDateField({
  type,
  value,
  onChange,
  originalIso,
}: {
  type: ContentType;
  /** YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
  /**
   * The post's current WordPress timestamp when editing. Lets the hint (and
   * the save) preserve the time an already-published post went out.
   */
  originalIso?: string;
}) {
  const isSermon = type === "sermon";

  // Date only — no time of day is chosen anywhere in the admin. A future
  // date resolves to the fixed release slot; see utils/publishSchedule.
  const combined = isSermon ? null : scheduledPublishDateTime(value, originalIso);
  const scheduledAt = combined ? new Date(combined) : null;
  const isFuture = scheduledAt ? scheduledAt.getTime() > Date.now() : false;

  return (
    <div>
      <FieldLabel>{isSermon ? "Sermon Date" : "Publish Date"}</FieldLabel>
      <CustomDatePicker
        value={value}
        onChange={onChange}
        wrapperClassName="w-full"
        className="w-full h-12 flex items-center justify-between gap-2 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
      />
      {!isSermon && (
        <p className="mt-2 text-xs text-gray-500 flex items-start gap-1.5">
          {isFuture ? (
            <>
              <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              <span>
                Scheduled — will auto-publish on{" "}
                <span className="font-semibold text-gray-700">
                  {scheduledAt!.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                . It goes live a few minutes after 12:30 AM, once the listing
                caches refresh
                {type === "manual" &&
                  " — until then it shows greyed out on the Manuals page"}
                .
              </span>
            </>
          ) : originalIso ? (
            <span>
              Already published — keeps the time it originally went out. Pick a
              future date to reschedule it for 12:30 AM that day.
            </span>
          ) : (
            <span>
              Publishes immediately when status is set to Publish. Pick a future
              date to schedule it for 12:30 AM that day.
            </span>
          )}
        </p>
      )}
    </div>
  );
}

// ─── Status ───────────────────────────────────────────────────────────────────

export function StatusField({
  value,
  onChange,
  variant = "inline",
}: {
  value: PostStatus;
  onChange: (value: PostStatus) => void;
  /** "inline" is the compact pill beside the submit button; "block" is a
   *  labelled field for the edit modal. */
  variant?: "inline" | "block";
}) {
  const select = (
    <div className={variant === "inline" ? "relative" : "relative w-48"}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as PostStatus)}
        className={
          variant === "inline"
            ? "h-9 px-3 pr-8 rounded-lg border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
            : "w-full h-10 px-3 pr-8 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
        }
      >
        <option value="draft">📝 Draft</option>
        <option value="publish">🚀 Publish</option>
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
    </div>
  );

  if (variant === "block") {
    return (
      <div>
        <FieldLabel>Status</FieldLabel>
        {select}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-sm font-medium text-gray-600">Status:</span>
      {select}
    </div>
  );
}

// ─── Title ────────────────────────────────────────────────────────────────────

export function TitleField({
  value,
  onChange,
  error,
  placeholder,
  label = "Title",
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASS}
        placeholder={placeholder}
      />
      <FieldError message={error} />
    </div>
  );
}

// ─── Audio MP3 URL (sermons) ──────────────────────────────────────────────────

export const AUDIO_URL_PATTERN = /^https?:\/\/.+/i;

export function AudioUrlField({
  value,
  onChange,
  error,
  required,
  hint,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <FieldLabel required={required}>Audio MP3 URL</FieldLabel>
      <div className="relative">
        <FileAudio className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT_CLASS} pl-11`}
          placeholder="https://nlwc-ikorodu.s3.us-east-2.amazonaws.com/…/message.mp3"
        />
      </div>
      <p className="mt-1.5 text-xs text-gray-400">
        {hint ??
          "Paste the link to the hosted MP3 (e.g. AWS S3). The audio is not uploaded to WordPress."}
      </p>
      <FieldError message={error} />
    </div>
  );
}
