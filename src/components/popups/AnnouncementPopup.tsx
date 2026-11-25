"use client";

import Link from "next/link";
import { m as motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Megaphone, X } from "lucide-react";
import type { SitePopup } from "@/lib/sitePopups";
import type { PopupCloseReason } from "./SitePopups";

/**
 * An admin-created announcement (Admin → Settings → Pop-ups): optional
 * image, label, title, message and one button, as a centred dialog or a card
 * in the corner.
 */
export default function AnnouncementPopup({
  popup,
  open,
  onClose,
}: {
  popup: SitePopup;
  open: boolean;
  onClose: (reason: PopupCloseReason) => void;
}) {
  const external = /^https?:\/\//i.test(popup.ctaUrl);
  const corner = popup.layout === "corner";

  const body = (
    <div
      className={`relative overflow-hidden bg-white shadow-2xl ${
        corner ? "rounded-3xl border border-primary/20" : "w-full max-w-md rounded-t-3xl sm:rounded-3xl"
      }`}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal={!corner}
      aria-labelledby={`popup-${popup.id}-title`}
    >
      <button
        onClick={() => onClose("closed")}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          popup.imageUrl ? "bg-black/40 text-white hover:bg-black/60" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
        }`}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      {popup.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-provided image from any host
        <img src={popup.imageUrl} alt="" className={`w-full object-cover ${corner ? "h-36" : "h-48"}`} />
      ) : (
        <div className="h-1.5 w-full bg-linear-to-r from-primary via-amber-400 to-primary" />
      )}

      <div className={corner ? "p-5 pr-12" : "p-6 sm:p-7"}>
        {popup.eyebrow && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Megaphone className="w-3 h-3" />
            {popup.eyebrow}
          </span>
        )}
        <h3 id={`popup-${popup.id}-title`} className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
          {popup.title}
        </h3>
        {popup.message && (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{popup.message}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {popup.ctaLabel && popup.ctaUrl && (
            <Link
              href={popup.ctaUrl}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              onClick={() => onClose("completed")}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
            >
              {popup.ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => onClose("closed")}
            className="h-11 px-5 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {popup.dismissLabel || "Close"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {open &&
        (corner ? (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 left-6 sm:left-auto z-50 sm:w-[420px]"
          >
            {body}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => onClose("closed")}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="w-full max-w-md"
            >
              {body}
            </motion.div>
          </motion.div>
        ))}
    </AnimatePresence>
  );
}
