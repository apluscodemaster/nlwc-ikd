"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  Eye,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Radio,
  Timer,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { showConfirm } from "@/components/shared/CustomDialog";
import { authFetch } from "@/lib/authClient";
import {
  FREQUENCY_LABEL,
  KIND_LABEL,
  PopupModal,
} from "@/components/admin/popups/PopupModal";
import AnnouncementPopup from "@/components/popups/AnnouncementPopup";
import DevotionalPopup from "@/components/popups/DevotionalPopup";
import FellowshipPopup from "@/components/popups/FellowshipPopup";
import FirstTimeVisitorPopup from "@/components/popups/FirstTimeVisitorPopup";
import {
  BUILT_IN_IDS,
  PREVIEW_PARAM,
  PREVIEW_STORAGE_KEY,
  newAnnouncement,
  popupStatus,
  previewPath,
  type SitePopup,
  type SitePopupInput,
} from "@/lib/sitePopups";

const STATUS: Record<ReturnType<typeof popupStatus>, { label: string; chip: string }> = {
  on: { label: "Showing", chip: "bg-emerald-100 text-emerald-700" },
  scheduled: { label: "Scheduled", chip: "bg-blue-100 text-blue-700" },
  ended: { label: "Ended", chip: "bg-gray-200 text-gray-600" },
  off: { label: "Off", chip: "bg-gray-100 text-gray-500" },
};

function toInput(p: SitePopup): SitePopupInput {
  const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = p;
  void _id;
  void _c;
  void _u;
  return rest;
}

const pagesSummary = (p: SitePopup) => {
  const on = p.includePaths.length ? p.includePaths.map((x) => (x === "/" ? "Home" : x)).join(", ") : "Every page";
  return p.excludePaths.length ? `${on} (not ${p.excludePaths.join(", ")})` : on;
};

const dateText = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Opens the page the pop-up shows on, in a new tab, with this (possibly
 * unsaved) version showing straight away. The draft travels through this
 * browser's storage only, so no visitor sees it.
 */
function previewOnSite(data: SitePopupInput, id?: string) {
  try {
    localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify({ ...data, id: id ?? "preview" }));
  } catch {
    toast.error("Your browser blocked the preview (storage is off).");
    return;
  }
  window.open(`${previewPath(data)}?${PREVIEW_PARAM}=1`, "_blank", "noopener");
}

/** Admin → Settings → Pop-ups: the site's pop-ups and announcements. */
export default function PopupsAdminPage() {
  const [popups, setPopups] = useState<SitePopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ id?: string; data: SitePopupInput } | null>(null);
  const [preview, setPreview] = useState<SitePopup | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await authFetch("/api/popups/admin", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { popups: SitePopup[] };
      setPopups(data.popups);
    } catch {
      toast.error("Failed to load pop-ups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (data: SitePopupInput, id?: string) => {
    const wasLive = id ? popups.find((x) => x.id === id)?.active : false;
    if (data.active && !wasLive) {
      const ok = await showConfirm(
        `“${data.name || data.title}” will start showing to visitors within about a minute${
          data.startsAt && Date.parse(data.startsAt) > Date.now() ? " of its start date" : ""
        }. Use “Preview on site” first if you haven't.`,
        { title: "Publish this pop-up?", confirmLabel: "Publish" },
      );
      if (!ok) return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/popups/admin", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { ...data, id } : data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Save failed");
      toast.success(
        data.active ? (id ? "Pop-up saved" : "Announcement published") : id ? "Pop-up saved (off)" : "Draft saved",
        {
          description: data.active
            ? "Visitors see the change within about a minute."
            : "It isn't showing to visitors. Switch it on to publish.",
        },
      );
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (p: SitePopup) => save({ ...toInput(p), active: !p.active }, p.id);

  const remove = async (p: SitePopup) => {
    const ok = await showConfirm(`Delete “${p.name}”? This can't be undone.`, {
      title: "Delete announcement",
      variant: "warning",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      const res = await authFetch(`/api/popups/admin?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Delete failed");
      toast.success("Announcement deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const closePreview = () => setPreview(null);

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pop-ups</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              What appears on the website, where, and when. One shows at a time.
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditing({ data: newAnnouncement() })}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New announcement
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {popups.map((p) => {
            const status = STATUS[popupStatus(p)];
            const builtIn = BUILT_IN_IDS.has(p.id);
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-4 sm:p-5 bg-white transition-all ${
                  p.active ? "border-gray-100 shadow-sm" : "border-gray-200 opacity-70"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">{p.name}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.chip}`}>
                        {status.label}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {KIND_LABEL[p.kind]}
                      </span>
                    </div>
                    {p.title && <p className="text-sm text-gray-600 mt-1 line-clamp-1">“{p.title}”</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{pagesSummary(p)}</span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        after {p.delaySeconds}s · {FREQUENCY_LABEL[p.frequency].toLowerCase()}
                        {p.frequency === "once-every-days" ? ` (${p.frequencyDays} days)` : ""}
                      </span>
                      {p.liveOnly && (
                        <span className="flex items-center gap-1 text-red-600">
                          <Radio className="w-3 h-3" /> During live services
                        </span>
                      )}
                      {(p.startsAt || p.endsAt) && (
                        <span className="flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          {p.startsAt ? dateText(p.startsAt) : "Now"} → {p.endsAt ? dateText(p.endsAt) : "no end"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                    <button onClick={() => void toggle(p)} title={p.active ? "Switch off" : "Switch on"} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                      {p.active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                    <button onClick={() => setPreview(p)} title="Preview here" className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => previewOnSite(toInput(p), p.id)}
                      title="Preview on the live site (new tab)"
                      className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => setEditing({ id: p.id, data: toInput(p) })} title="Edit" className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    {!builtIn && (
                      <button onClick={() => void remove(p)} title="Delete" className="p-2 rounded-lg hover:bg-red-50 cursor-pointer">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <PopupModal
          key={editing.id ?? "new"}
          id={editing.id}
          initial={editing.data}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={(data) => void save(data, editing.id)}
          onPreview={(data) => setPreview({ ...data, id: editing.id ?? "preview" })}
          onPreviewOnSite={(data) => previewOnSite(data, editing.id)}
        />
      )}

      {/* The real pop-up, as visitors see it (nothing is recorded); kept in
          the site's light look when the admin is in dark mode. */}
      <div data-admin-light>
      {preview &&
        (preview.kind === "fellowship" ? (
          <FellowshipPopup popup={preview} open onClose={closePreview} />
        ) : preview.kind === "devotional" ? (
          <DevotionalPopup popup={preview} open onClose={closePreview} onUnavailable={() => {
            toast.info("There's no devotional to show right now.");
            closePreview();
          }} />
        ) : preview.kind === "first-time-visitor" ? (
          <FirstTimeVisitorPopup popup={preview} open onClose={closePreview} />
        ) : (
          <AnnouncementPopup popup={preview} open onClose={closePreview} />
        ))}
      </div>
    </div>
  );
}
