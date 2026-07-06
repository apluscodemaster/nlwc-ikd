"use client";

import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookMarked,
  GripVertical,
  Loader2,
  Plus,
  Pencil,
  Check,
  X,
  Calendar,
} from "lucide-react";

/** Minimal shape the board needs — structurally compatible with admin ContentItem. */
export interface ManualBoardItem {
  id: number;
  title: string;
  theme?: string;
  lesson?: string;
  date?: string;
}

interface ManualThemeBoardProps {
  items: ManualBoardItem[];
  /** Returns an `Authorization` header value (Firebase ID token). */
  getAuthHeader: () => Promise<string>;
  /** Open the edit drawer for a manual. */
  onEditItem?: (id: number) => void;
}

const UNGROUPED = "Ungrouped";

function shorten(theme: string, max = 40): string {
  return theme.length > max
    ? theme.slice(0, max).replace(/\s+\S*$/, "") + "…"
    : theme;
}

/**
 * Drag-and-drop board for grouping Sunday School manuals by theme.
 *
 * Lessons are dragged between theme columns; each drop persists the manual's
 * theme override to WordPress post meta (nlwc_manual_theme) via /api/wp/update.
 * Themes can be created (empty column) and renamed (re-themes every lesson in
 * the column). Uses native HTML5 drag-and-drop — no extra dependency.
 */
export default function ManualThemeBoard({
  items,
  getAuthHeader,
  onEditItem,
}: ManualThemeBoardProps) {
  // Optimistic theme per manual id. "" = explicitly ungrouped.
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [extraThemes, setExtraThemes] = useState<string[]>([]);
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [newTheme, setNewTheme] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const effectiveTheme = (it: ManualBoardItem): string =>
    (overrides[it.id] ?? it.theme ?? "").trim();

  const groups = useMemo(() => {
    const map = new Map<string, ManualBoardItem[]>();
    for (const it of items) {
      const key = effectiveTheme(it) || UNGROUPED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    for (const t of extraThemes) if (!map.has(t)) map.set(t, []);
    // Preserve insertion order but push the catch-all "Ungrouped" column last.
    return Array.from(map.entries())
      .sort((a, b) =>
        a[0] === UNGROUPED ? 1 : b[0] === UNGROUPED ? -1 : 0,
      )
      .map(([theme, list]) => ({ theme, items: list }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, overrides, extraThemes]);

  async function persistTheme(id: number, manualTheme: string): Promise<void> {
    const auth = await getAuthHeader();
    const res = await fetch("/api/wp/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({ id, type: "manual", manualTheme }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Update failed (${res.status})`);
    }
  }

  async function assign(id: number, targetTheme: string) {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const currentKey = effectiveTheme(it) || UNGROUPED;
    const targetKey = targetTheme || UNGROUPED;
    if (currentKey === targetKey) return;

    const manualTheme = targetTheme === UNGROUPED ? "" : targetTheme;
    const prev = overrides[id];

    setOverrides((o) => ({ ...o, [id]: manualTheme }));
    setSavingIds((s) => new Set(s).add(id));
    try {
      await persistTheme(id, manualTheme);
      // The target is now backed by a real lesson, so it no longer needs to be
      // kept alive as a manually-created empty column. Dropping it from
      // extraThemes means the column auto-disappears once its last lesson is
      // dragged away (empty groups are only rendered from extraThemes).
      if (targetTheme !== UNGROUPED) {
        setExtraThemes((t) => t.filter((x) => x !== targetTheme));
      }
      toast.success("Lesson re-grouped", {
        description:
          targetKey === UNGROUPED
            ? "Theme cleared"
            : `Moved to “${shorten(targetTheme, 30)}”`,
      });
    } catch (e) {
      // Revert to the prior override (or back to the parsed theme if none).
      setOverrides((o) => {
        const n = { ...o };
        if (prev === undefined) delete n[id];
        else n[id] = prev;
        return n;
      });
      toast.error("Couldn't move lesson", {
        description: e instanceof Error ? e.message : "Please try again.",
      });
    } finally {
      setSavingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }

  function addTheme() {
    const name = newTheme.trim();
    if (!name) return;
    if (
      name === UNGROUPED ||
      groups.some((g) => g.theme.toLowerCase() === name.toLowerCase())
    ) {
      toast.error("That theme already exists");
      return;
    }
    setExtraThemes((t) => [...t, name]);
    setNewTheme("");
  }

  async function renameTheme(oldTheme: string, next: string) {
    const nextName = next.trim();
    setRenaming(null);
    if (!nextName || nextName === oldTheme) return;

    const affected = items.filter((it) => effectiveTheme(it) === oldTheme);
    // Optimistically move the whole column.
    setOverrides((o) => {
      const n = { ...o };
      for (const it of affected) n[it.id] = nextName;
      return n;
    });
    setExtraThemes((t) => t.map((x) => (x === oldTheme ? nextName : x)));

    try {
      await Promise.all(affected.map((it) => persistTheme(it.id, nextName)));
      toast.success("Theme renamed", {
        description: `${affected.length} ${affected.length === 1 ? "lesson" : "lessons"} updated`,
      });
    } catch (e) {
      toast.error("Rename partially failed", {
        description: e instanceof Error ? e.message : "Some lessons may not have saved.",
      });
    }
  }

  return (
    <div className="space-y-4">
      {/* Create-theme row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={newTheme}
            onChange={(e) => setNewTheme(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTheme()}
            placeholder="Add a new theme…"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <button
          onClick={addTheme}
          disabled={!newTheme.trim()}
          className="h-10 px-4 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add theme
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Drag a lesson onto a theme to re-group it. Changes save automatically.
      </p>

      {/* Theme columns use a CSS multi-column (masonry) layout so cards pack
          vertically and the next card fills under the shorter column instead of
          every card starting its own equal-height grid row. Single column on
          mobile, two columns on desktop/large screens. */}
      <div className="columns-1 md:columns-2 gap-4">
        {groups.map((group) => {
          const isOver = dragOverKey === group.theme;
          const isRenaming = renaming === group.theme;
          return (
            <div
              key={group.theme}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverKey !== group.theme) setDragOverKey(group.theme);
              }}
              onDragLeave={(e) => {
                // Only clear when leaving the column, not when moving over children.
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverKey((k) => (k === group.theme ? null : k));
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverKey(null);
                const id = Number(e.dataTransfer.getData("text/plain"));
                if (id) assign(id, group.theme);
              }}
              className={`mb-4 break-inside-avoid rounded-2xl border transition-colors ${
                isOver
                  ? "border-amber-400 bg-amber-50/60 ring-2 ring-amber-300/50"
                  : group.theme === UNGROUPED
                    ? "border-dashed border-gray-300 bg-gray-50/50"
                    : "border-gray-200 bg-white"
              }`}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <BookMarked className="w-4 h-4 text-amber-600" />
                </div>
                {isRenaming ? (
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          renameTheme(group.theme, renameValue);
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      className="flex-1 min-w-0 h-8 px-2 rounded-lg border border-amber-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                    />
                    <button
                      onClick={() => renameTheme(group.theme, renameValue)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                      title="Save"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRenaming(null)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-sm font-bold text-gray-900 truncate"
                        title={group.theme}
                      >
                        {group.theme}
                      </h3>
                      <p className="text-[11px] text-amber-600 font-semibold">
                        {group.items.length}{" "}
                        {group.items.length === 1 ? "lesson" : "lessons"}
                      </p>
                    </div>
                    {group.theme !== UNGROUPED && (
                      <button
                        onClick={() => {
                          setRenaming(group.theme);
                          setRenameValue(group.theme);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                        title="Rename theme"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Lessons */}
              <div className="p-3 space-y-2 min-h-[72px]">
                {group.items.length === 0 && (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-400">
                    Drop lessons here
                  </div>
                )}
                {group.items.map((it) => {
                  const saving = savingIds.has(it.id);
                  return (
                    <div
                      key={it.id}
                      draggable={!saving}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(it.id));
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(it.id);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                      className={`group flex items-center gap-2 rounded-xl border px-3 py-2.5 bg-white transition-all ${
                        draggingId === it.id
                          ? "opacity-40"
                          : "border-gray-150 hover:border-amber-300 hover:shadow-sm"
                      } ${saving ? "cursor-wait" : "cursor-grab active:cursor-grabbing"}`}
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium text-gray-900 truncate"
                          dangerouslySetInnerHTML={{ __html: it.title }}
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                          {it.lesson && (
                            <span className="text-[10px] font-semibold text-amber-600 truncate max-w-[140px]">
                              {it.lesson}
                            </span>
                          )}
                          {it.date && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1 whitespace-nowrap">
                              <Calendar className="w-3 h-3" />
                              {it.date}
                            </span>
                          )}
                        </div>
                      </div>
                      {saving ? (
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                      ) : (
                        onEditItem && (
                          <button
                            onClick={() => onEditItem(it.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all shrink-0"
                            title="Edit lesson"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
