"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { m as motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, Sparkles } from "lucide-react";
import type { SitePopup } from "@/lib/sitePopups";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import type { PopupCloseReason } from "./SitePopups";

/** Shape returned by /api/devotionals/latest. */
interface LatestDevotional {
  id: string;
  title: string;
  /** ISO timestamp of the release date. */
  scheduledDate: string;
}

/**
 * The latest devotional, as a card in the corner. Reads it from a cached API
 * route rather than querying Firestore in the browser, which keeps the
 * Firebase client SDK out of the homepage bundle. When and where it shows is
 * managed in Admin → Settings → Pop-ups (components/popups/SitePopups); if
 * there's no devotional to show, it tells the manager to skip it.
 */
export default function DevotionalPopup({
  popup,
  open,
  onClose,
  onUnavailable,
}: {
  popup: SitePopup;
  open: boolean;
  onClose: (reason: PopupCloseReason) => void;
  onUnavailable: () => void;
}) {
  const [devotional, setDevotional] = useState<LatestDevotional | null>(null);
  const visible = open && !!devotional;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/devotionals/latest")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { devotional?: LatestDevotional | null } | null) => {
        if (cancelled) return;
        if (data?.devotional) setDevotional(data.devotional);
        else onUnavailable();
      })
      .catch(() => {
        if (!cancelled) onUnavailable();
      });
    return () => {
      cancelled = true;
    };
  }, [onUnavailable]);

  const dismiss = () => onClose("closed");
  // A corner card: Escape closes it, but it never takes focus from the page.
  const panelRef = useDialogA11y(visible, dismiss, { modal: false });

  if (!devotional) return null;

  const formattedDate = new Date(devotional.scheduledDate).toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 left-6 sm:left-auto z-50 sm:w-[420px]"
          ref={panelRef}
          role="dialog"
          aria-label="Today's devotional"
        >
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-white/95 backdrop-blur-xl shadow-2xl shadow-primary/10">
            {/* Decorative gradient bar */}
            <div className="h-1 w-full bg-linear-to-r from-primary via-amber-400 to-primary" />

            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors group z-10"
              aria-label="Dismiss devotional"
            >
              <X className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
            </button>

            <div className="p-6 pr-14">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  {popup.eyebrow || "Today's Devotional"}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight line-clamp-2">
                {devotional.title}
              </h3>

              {/* Date */}
              <p className="text-sm text-muted-foreground mb-5">
                {formattedDate}
              </p>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href={`/devotionals/${devotional.id}`}
                  onClick={() => onClose("completed")}
                  className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  {popup.ctaLabel || "Read Now"}
                </Link>
                <button
                  onClick={dismiss}
                  className="h-11 px-5 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {popup.dismissLabel || "Later"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
