"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { isServiceLive, loadScheduleFromApi } from "@/lib/liveSchedule";
import {
  BUILT_IN_POPUPS,
  LEGACY_KEYS,
  PREVIEW_PARAM,
  PREVIEW_STORAGE_KEY,
  dueByFrequency,
  isWithinDates,
  showsOnPath,
  type PopupMemory,
  type SitePopup,
} from "@/lib/sitePopups";
import AnnouncementPopup from "./AnnouncementPopup";
import DevotionalPopup from "./DevotionalPopup";
import FellowshipPopup from "./FellowshipPopup";
import FirstTimeVisitorPopup from "./FirstTimeVisitorPopup";

/** "completed": the visitor did what it asked (button / form). */
export type PopupCloseReason = "closed" | "completed";

const LOCAL_PREFIX = "nlwc-popup:";
const SESSION_PREFIX = "nlwc-popup-session:";
/** Pause between one pop-up closing and the next appearing. */
const GAP_MS = 1500;
/** How often a live-only pop-up re-checks whether a service has started. */
const LIVE_RECHECK_MS = 30_000;

function readMemory(id: string): PopupMemory {
  const memory: PopupMemory = {};
  try {
    const saved = JSON.parse(localStorage.getItem(LOCAL_PREFIX + id) || "{}") as PopupMemory;
    memory.closedAt = saved.closedAt;
    memory.completed = saved.completed;
    memory.closedThisSession = sessionStorage.getItem(SESSION_PREFIX + id) === "1";

    // What the old hard-coded pop-ups stored, so nobody is asked twice.
    const legacy = LEGACY_KEYS[id];
    if (legacy?.local) {
      const value = localStorage.getItem(legacy.local);
      if (value && legacy.kind === "closedAt") {
        const ts = parseInt(value, 10);
        if (Number.isFinite(ts)) memory.closedAt = Math.max(memory.closedAt ?? 0, ts);
      }
      if (value && legacy.kind === "completed") memory.completed = true;
    }
    if (legacy?.session && sessionStorage.getItem(legacy.session)) memory.closedThisSession = true;
  } catch {
    // Storage unavailable (private mode etc.): treat as never seen.
  }
  return memory;
}

function remember(popup: SitePopup, reason: PopupCloseReason) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + popup.id, "1");
    const previous = readMemory(popup.id);
    localStorage.setItem(
      LOCAL_PREFIX + popup.id,
      JSON.stringify({
        closedAt: Date.now(),
        completed: previous.completed || reason === "completed",
      }),
    );
  } catch {
    // ignore
  }
}

/**
 * Shows the site's pop-ups (managed in Admin → Settings → Pop-ups): those
 * switched on, within their dates, allowed on this page, and due for this
 * visitor. Each waits its delay (live-only ones also wait for a service to
 * be live); only one shows at a time, highest priority first. If the admin
 * list can't load, the three built-in pop-ups run with their defaults.
 */
export default function SitePopups() {
  const pathname = usePathname() ?? "/";
  const [popups, setPopups] = useState<SitePopup[] | null>(null);
  const [current, setCurrent] = useState<SitePopup | null>(null);
  const [open, setOpen] = useState(false);
  const currentRef = useRef<SitePopup | null>(null);
  const readyRef = useRef<SitePopup[]>([]);
  /** Shown, closed or skipped on this page view. */
  const doneRef = useRef<Set<string>>(new Set());

  /** Admin "Preview on site": the draft from this browser's storage. */
  const previewRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    try {
      if (new URLSearchParams(window.location.search).get(PREVIEW_PARAM) === "1") {
        const draft = JSON.parse(localStorage.getItem(PREVIEW_STORAGE_KEY) || "null") as SitePopup | null;
        if (draft) {
          previewRef.current = true;
          currentRef.current = draft;
          setCurrent(draft);
          setOpen(true);
          return;
        }
      }
    } catch {
      // No usable preview: carry on normally.
    }
    fetch("/api/popups")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { popups?: SitePopup[] }) => {
        if (!cancelled) setPopups(data.popups ?? []);
      })
      .catch(() => {
        if (!cancelled) setPopups(BUILT_IN_POPUPS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showNext = useCallback(() => {
    if (currentRef.current) return;
    const next = readyRef.current
      .filter((p) => !doneRef.current.has(p.id))
      .sort((a, b) => b.priority - a.priority)[0];
    if (!next) return;
    readyRef.current = readyRef.current.filter((p) => p.id !== next.id);
    currentRef.current = next;
    setCurrent(next);
    setOpen(true);
  }, []);

  // Each page: start the timers of the pop-ups due here.
  useEffect(() => {
    if (!popups) return;
    readyRef.current = [];
    doneRef.current = new Set(currentRef.current ? [currentRef.current.id] : []);
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const now = new Date();

    for (const popup of popups) {
      if (!showsOnPath(popup, pathname) || !isWithinDates(popup, now)) continue;
      if (!dueByFrequency(popup, readMemory(popup.id))) continue;

      const fire = async () => {
        if (cancelled) return;
        if (popup.liveOnly) {
          await loadScheduleFromApi();
          if (cancelled) return;
          if (!isServiceLive()) {
            timers.push(setTimeout(fire, LIVE_RECHECK_MS));
            return;
          }
        }
        readyRef.current.push(popup);
        showNext();
      };
      timers.push(setTimeout(fire, Math.max(0, popup.delaySeconds) * 1000));
    }
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [popups, pathname, showNext]);

  const finish = useCallback(
    (reason: PopupCloseReason | null) => {
      const popup = currentRef.current;
      if (!popup) return;
      if (previewRef.current) {
        // A preview is never remembered, and nothing else follows it.
        setOpen(false);
        return;
      }
      if (reason) remember(popup, reason);
      doneRef.current.add(popup.id);
      setOpen(false);
      // Let the closing animation finish, then make room for the next one.
      setTimeout(() => {
        currentRef.current = null;
        setCurrent(null);
        setTimeout(showNext, GAP_MS);
      }, reason ? 350 : 0);
    },
    [showNext],
  );

  const close = useCallback((reason: PopupCloseReason) => finish(reason), [finish]);
  /** Nothing to show (e.g. no devotional yet): skip without remembering. */
  const skip = useCallback(() => finish(null), [finish]);

  if (!current) return null;
  switch (current.kind) {
    case "fellowship":
      return <FellowshipPopup popup={current} open={open} onClose={close} />;
    case "devotional":
      return <DevotionalPopup popup={current} open={open} onClose={close} onUnavailable={skip} />;
    case "first-time-visitor":
      return <FirstTimeVisitorPopup popup={current} open={open} onClose={close} />;
    default:
      return <AnnouncementPopup popup={current} open={open} onClose={close} />;
  }
}
