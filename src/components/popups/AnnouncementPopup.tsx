"use client";

import Image from "next/image";
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
  // "walk" only moves an image; with text it's shown as the corner card.
  const corner = popup.layout !== "modal";
  // Just an image (a flyer or cut-out design): no card, no text, no buttons.
  const imageOnly = !!popup.imageUrl && !popup.title && !popup.message;

  if (imageOnly) {
    return <ImageOnly popup={popup} open={open} onClose={onClose} corner={corner} external={external} />;
  }

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

/**
 * An image-only announcement: the picture floats on its own (transparent
 * designs keep their shape), with a close button; tapping it opens the
 * pop-up's link when there is one. Site files (/flyer.png) go through
 * next/image, so phones get a resized WebP instead of the full file.
 */
function ImageOnly({
  popup,
  open,
  onClose,
  corner,
  external,
}: {
  popup: SitePopup;
  open: boolean;
  onClose: (reason: PopupCloseReason) => void;
  corner: boolean;
  external: boolean;
}) {
  const local = popup.imageUrl.startsWith("/");
  const alt = popup.name || popup.eyebrow || "Announcement";
  const picture = (
    <Image
      src={popup.imageUrl}
      alt={alt}
      width={1600}
      height={900}
      sizes={
        popup.layout === "walk"
          ? "(max-width: 640px) 78vw, 440px"
          : corner
            ? "(max-width: 640px) 92vw, 440px"
            : "(max-width: 768px) 94vw, 820px"
      }
      unoptimized={!local}
      priority
      className="block w-full h-auto max-h-[80vh] object-contain drop-shadow-2xl select-none"
      draggable={false}
    />
  );
  const linked = popup.ctaUrl ? (
    <Link
      href={popup.ctaUrl}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={() => onClose("completed")}
      aria-label={popup.ctaLabel || alt}
      className="block"
    >
      {picture}
    </Link>
  ) : (
    picture
  );
  const close = (
    <button
      onClick={() => onClose("closed")}
      className="absolute -top-2 right-0 sm:top-0 z-10 w-10 h-10 rounded-full bg-white/95 text-gray-700 shadow-lg flex items-center justify-center hover:bg-white active:scale-95 transition"
      aria-label={popup.dismissLabel || "Close"}
    >
      <X className="w-5 h-5" />
    </button>
  );

  if (popup.layout === "walk") {
    // Travels along the bottom of the screen, left to right, again and again
    // (globals.css .popup-walk); pauses on hover; still with reduced motion.
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-2 sm:bottom-4 z-50 overflow-hidden pointer-events-none"
            role="dialog"
            aria-label={alt}
          >
            <div className="popup-walk pointer-events-auto w-[78vw] max-w-[340px] sm:max-w-none sm:w-[440px]">
              <div className="popup-walk-bob relative pt-3">
                {close}
                {linked}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open &&
        (corner ? (
          <motion.div
            initial={{ x: -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="fixed bottom-4 left-3 right-3 sm:right-auto z-50 sm:w-[440px]"
            role="dialog"
            aria-label={alt}
          >
            <div className="relative">
              {close}
              {linked}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/55 backdrop-blur-sm"
            onClick={() => onClose("closed")}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              className="relative w-full max-w-[820px]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={alt}
            >
              {close}
              {linked}
            </motion.div>
          </motion.div>
        ))}
    </AnimatePresence>
  );
}
