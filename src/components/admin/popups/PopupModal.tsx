"use client";

import React, { useCallback, useState } from "react";
import { Loader2, Megaphone, Save, ToggleLeft, ToggleRight, X } from "lucide-react";
import { toast } from "sonner";
import { ModalShell } from "@/components/shared/ModalShell";
import { ThumbnailField, useThumbnailUpload } from "@/components/admin/content/ThumbnailField";
import type { PopupFrequency, SitePopup, SitePopupInput } from "@/lib/sitePopups";

const INPUT =
  "w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm";

export const KIND_LABEL: Record<SitePopup["kind"], string> = {
  announcement: "Announcement",
  fellowship: "Built-in · House fellowship",
  devotional: "Built-in · Today's devotional",
  "first-time-visitor": "Built-in · First-time viewer form",
};

export const FREQUENCY_LABEL: Record<PopupFrequency, string> = {
  "every-visit": "Every time the page opens",
  "once-per-session": "Once per visit (until the browser is closed)",
  "once-every-days": "Once, then again after a number of days",
  "until-completed": "Until they respond (tap the button / send the form)",
};

/** ISO → value for <input type="datetime-local"> (the admin's local time). */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : "");

const linesToPaths = (text: string) =>
  text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.startsWith("/") ? s : `/${s}`));

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function Switch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className="focus:outline-none cursor-pointer"
    >
      {on ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
    </button>
  );
}

/** Create / edit a site pop-up. */
export function PopupModal({
  initial,
  id,
  saving,
  onClose,
  onSave,
  onPreview,
  onPreviewOnSite,
}: {
  initial: SitePopupInput;
  /** Undefined when creating. */
  id?: string;
  saving: boolean;
  onClose: () => void;
  onSave: (data: SitePopupInput) => void;
  onPreview: (data: SitePopupInput) => void;
  /** Open the site page it targets, showing this draft there. */
  onPreviewOnSite: (data: SitePopupInput) => void;
}) {
  const [p, setP] = useState<SitePopupInput>(initial);
  const [includeText, setIncludeText] = useState(initial.includePaths.join("\n"));
  const [excludeText, setExcludeText] = useState(initial.excludePaths.join("\n"));
  const [allPages, setAllPages] = useState(initial.includePaths.length === 0);
  const set = <K extends keyof SitePopupInput>(key: K, value: SitePopupInput[K]) =>
    setP((prev) => ({ ...prev, [key]: value }));

  const onImage = useCallback((url: string | null) => setP((prev) => ({ ...prev, imageUrl: url ?? "" })), []);
  const image = useThumbnailUpload(onImage, initial.imageUrl || null);

  const isAnnouncement = p.kind === "announcement";
  const isDevotional = p.kind === "devotional";
  const usesWhatsapp = p.kind === "fellowship" || p.kind === "first-time-visitor";

  const collect = (): SitePopupInput => ({
    ...p,
    includePaths: allPages ? [] : linesToPaths(includeText),
    excludePaths: linesToPaths(excludeText),
  });

  /** Checks, then saves. `publish` (new announcements) switches it on. */
  const saveWith = (publish?: boolean) => {
    if (image.state.uploading) return void toast.error("Please wait for the image to finish uploading");
    const data = { ...collect(), ...(publish === undefined ? {} : { active: publish }) };
    if (!data.name.trim()) return void toast.error("Give the pop-up a name");
    if (isAnnouncement && !data.title.trim()) return void toast.error("An announcement needs a title");
    if (!allPages && data.includePaths.length === 0) {
      return void toast.error("Add at least one page, or choose “Every page”");
    }
    onSave(data);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    saveWith(id ? undefined : false);
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {id ? "Edit pop-up" : "New announcement"}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{KIND_LABEL[p.kind]}</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-gray-100 cursor-pointer">
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <form onSubmit={submit} className="p-4 sm:p-6 space-y-6">
        {id ? (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Show on the site</span>
            <Switch on={p.active} onToggle={() => set("active", !p.active)} label="Show on the site" />
          </div>
        ) : (
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
            New announcements are saved as drafts. Preview it, then publish when it looks right.
          </p>
        )}

        <Field label="Name (admin only)">
          <input className={INPUT} value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Easter conference 2027" />
        </Field>

        {/* ── Content ── */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Content</h3>
          <Field label="Small label above the title" hint="Optional, e.g. “House Fellowship”">
            <input className={INPUT} value={p.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} maxLength={60} />
          </Field>
          {isDevotional ? (
            <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg p-3">
              The title and date come from the latest devotional.
            </p>
          ) : (
            <>
              <Field label="Title">
                <input className={INPUT} value={p.title} onChange={(e) => set("title", e.target.value)} maxLength={140} />
              </Field>
              <Field label="Message">
                <textarea
                  className={`${INPUT} resize-y`}
                  rows={3}
                  value={p.message}
                  onChange={(e) => set("message", e.target.value)}
                  maxLength={1500}
                />
              </Field>
            </>
          )}
          {isAnnouncement && (
            <>
              <ThumbnailField upload={image} compact label="Image (optional)" />
              <Field label="Layout">
                <select className={INPUT} value={p.layout} onChange={(e) => set("layout", e.target.value as SitePopup["layout"])}>
                  <option value="modal">Centred dialog (dims the page)</option>
                  <option value="corner">Card in the bottom corner</option>
                </select>
              </Field>
            </>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Main button text" hint={isAnnouncement ? "Leave empty for no button" : undefined}>
              <input className={INPUT} value={p.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} maxLength={60} />
            </Field>
            <Field label="Close button text">
              <input className={INPUT} value={p.dismissLabel} onChange={(e) => set("dismissLabel", e.target.value)} maxLength={80} />
            </Field>
          </div>
          {isAnnouncement && (
            <Field label="Button link" hint="A site page like /live, or a full https:// link (opens in a new tab)">
              <input className={INPUT} value={p.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} placeholder="/live" />
            </Field>
          )}
          {usesWhatsapp && (
            <Field
              label="WhatsApp number"
              hint={
                p.kind === "fellowship"
                  ? "The general coordinator, offered when no centre is found. Digits with country code."
                  : "Where the form's details are sent. Digits with country code."
              }
            >
              <input
                className={INPUT}
                value={p.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))}
                placeholder="2348012345678"
                inputMode="numeric"
              />
            </Field>
          )}
        </section>

        {/* ── Where ── */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Where</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={allPages} onChange={() => setAllPages(true)} /> Every page
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!allPages} onChange={() => setAllPages(false)} /> Only these pages
            </label>
          </div>
          {!allPages && (
            <Field label="Show on" hint="One per line. “/” is the home page only; “/live” also covers pages under it.">
              <textarea className={`${INPUT} font-mono`} rows={3} value={includeText} onChange={(e) => setIncludeText(e.target.value)} placeholder={"/\n/live"} />
            </Field>
          )}
          <Field label="Never show on" hint="One per line. Admin pages never show pop-ups.">
            <textarea className={`${INPUT} font-mono`} rows={2} value={excludeText} onChange={(e) => setExcludeText(e.target.value)} placeholder="/fellowship" />
          </Field>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Only while a service is live</span>
            <Switch on={p.liveOnly} onToggle={() => set("liveOnly", !p.liveOnly)} label="Only while a service is live" />
          </div>
        </section>

        {/* ── When ── */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">When</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Appears after (seconds)">
              <input
                type="number"
                min={0}
                max={600}
                className={INPUT}
                value={p.delaySeconds}
                onChange={(e) => set("delaySeconds", Math.max(0, Number(e.target.value) || 0))}
              />
            </Field>
            <Field label="Priority" hint="Higher shows first when two are ready">
              <input type="number" min={-100} max={100} className={INPUT} value={p.priority} onChange={(e) => set("priority", Number(e.target.value) || 0)} />
            </Field>
          </div>
          <Field label="How often">
            <select className={INPUT} value={p.frequency} onChange={(e) => set("frequency", e.target.value as PopupFrequency)}>
              {(Object.keys(FREQUENCY_LABEL) as PopupFrequency[]).map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABEL[f]}
                </option>
              ))}
            </select>
          </Field>
          {p.frequency === "once-every-days" && (
            <Field label="Show again after (days)">
              <input
                type="number"
                min={1}
                max={365}
                className={INPUT}
                value={p.frequencyDays}
                onChange={(e) => set("frequencyDays", Math.min(365, Math.max(1, Number(e.target.value) || 1)))}
              />
            </Field>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Start" hint="Empty = now">
              <input type="datetime-local" className={INPUT} value={toLocalInput(p.startsAt)} onChange={(e) => set("startsAt", fromLocalInput(e.target.value))} />
            </Field>
            <Field label="End" hint="Empty = no end">
              <input type="datetime-local" className={INPUT} value={toLocalInput(p.endsAt)} onChange={(e) => set("endsAt", fromLocalInput(e.target.value))} />
            </Field>
          </div>
        </section>

        <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-1 mr-auto">
            <button type="button" onClick={() => onPreview(collect())} className="px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg cursor-pointer">
              Preview
            </button>
            <button
              type="button"
              onClick={() => onPreviewOnSite(collect())}
              className="px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg cursor-pointer"
              title="Opens the page it shows on, in a new tab, with this pop-up as visitors will see it"
            >
              Preview on site ↗
            </button>
          </div>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer">
            Cancel
          </button>
          {id ? (
            <button
              type="submit"
              disabled={saving || image.state.uploading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          ) : (
            <>
              <button
                type="submit"
                disabled={saving || image.state.uploading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save draft
              </button>
              <button
                type="button"
                onClick={() => saveWith(true)}
                disabled={saving || image.state.uploading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                <Megaphone className="w-4 h-4" />
                Publish
              </button>
            </>
          )}
        </div>
      </form>
    </ModalShell>
  );
}
