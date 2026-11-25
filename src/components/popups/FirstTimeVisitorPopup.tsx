"use client";

import React, { useCallback } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, MapPin, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SitePopup } from "@/lib/sitePopups";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import type { PopupCloseReason } from "./SitePopups";

/**
 * First-time live stream viewer form: sends the details to the church's
 * WhatsApp. When and where it shows (live pages, during services) and its
 * wording are managed in Admin → Settings → Pop-ups.
 */
export default function FirstTimeVisitorPopup({
  popup,
  open,
  onClose,
}: {
  popup: SitePopup;
  open: boolean;
  onClose: (reason: PopupCloseReason) => void;
}) {
  const isVisible = open;
  const whatsapp = popup.whatsapp || "2348137436770";

  const handleClose = useCallback(() => onClose("closed"), [onClose]);
  const panelRef = useDialogA11y(isVisible, handleClose);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");
    const phone = formData.get("phone");
    const location = formData.get("location");

    const text = `Hello NLWC Ikorodu Admin, a first-time streaming viewer just connected!\n\n*Name:* ${name}\n*Phone Number:* ${phone}\n*Location:* ${location}\n\n_Sent from the Live Streaming Page_`;

    // Submitted: it won't be shown again. The streaming page stays untouched.
    onClose("completed");

    // Open WhatsApp in a new tab — browser switches focus to it.
    // The streaming page remains intact in the background tab.
    window.open(
      `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  }, [onClose, whatsapp]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            aria-hidden="true"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Welcome! Tell us about your visit"
            className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl shadow-black/20 overflow-hidden"
          >
            {/* Top Accent Gradient */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-amber-500 to-orange-500" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all hover:scale-110 active:scale-90"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 text-amber-700 text-xs font-bold uppercase tracking-widest mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  {popup.eyebrow || "First Time Here?"}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {popup.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">
                  {popup.message}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="first-time-name"
                    className="text-xs font-bold text-gray-600 flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-primary" />
                    Full Name
                  </label>
                  <input
                    name="name"
                    required
                    type="text"
                    id="first-time-name"
                    placeholder="e.g. John Abiodun"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm bg-gray-50/50 focus:bg-white"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="first-time-phone"
                    className="text-xs font-bold text-gray-600 flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    required
                    type="tel"
                    id="first-time-phone"
                    placeholder="e.g. 08012345678"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm bg-gray-50/50 focus:bg-white"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="first-time-location"
                    className="text-xs font-bold text-gray-600 flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    Location
                  </label>
                  <input
                    name="location"
                    required
                    type="text"
                    id="first-time-location"
                    placeholder="e.g. Lagos, Nigeria"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm bg-gray-50/50 focus:bg-white"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 rounded-full text-sm font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mt-2"
                >
                  <span className="flex items-center gap-2">
                    {popup.ctaLabel || "Connect with Us"} <Send className="w-4 h-4" />
                  </span>
                </Button>

                {/* Skip */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full text-center cursor-pointer text-xs text-muted-foreground hover:text-gray-700 font-medium py-1 transition-colors"
                >
                  {popup.dismissLabel || "Cancel, this is not my first time!"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
