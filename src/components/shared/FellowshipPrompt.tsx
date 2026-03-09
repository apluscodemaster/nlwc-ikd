"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Home,
  X,
  Navigation,
  ExternalLink,
  MessageCircle,
  Loader2,
  User,
  Clock,
  ChevronRight,
  Users,
} from "lucide-react";
import Link from "next/link";
import { fellowshipCenters, type FellowshipCenter } from "@/data/centers";

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "nlwc-fellowship-prompt-dismissed";
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PROMPT_DELAY_MS = 30_000; // 30 seconds
const SKIP_PATHS = ["/fellowship", "/admin", "/welcome"];

// ─── Haversine Distance ───────────────────────────────────────────────────────
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestCenters(
  lat: number,
  lng: number,
  count = 2,
): { center: FellowshipCenter; distanceKm: number }[] {
  return fellowshipCenters
    .map((center) => ({
      center,
      distanceKm: haversineKm(lat, lng, center.lat, center.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);
}

// ─── Step Types ───────────────────────────────────────────────────────────────
type Step = "ask" | "locating" | "result" | "no-match";

// ─── Component ────────────────────────────────────────────────────────────────
export default function FellowshipPrompt() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<Step>("ask");
  const [nearestCenters, setNearestCenters] = useState<
    { center: FellowshipCenter; distanceKm: number }[]
  >([]);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Check if prompt should be shown
  useEffect(() => {
    // Skip certain paths
    if (SKIP_PATHS.some((p) => pathname?.startsWith(p))) return;

    // Check localStorage for dismissal
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed) {
        const timestamp = parseInt(dismissed, 10);
        if (Date.now() - timestamp < DISMISS_DURATION_MS) return;
      }
    } catch {
      // localStorage not available
    }

    const timer = setTimeout(() => setVisible(true), PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname]);

  const dismiss = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }, []);

  const handleAlreadyMember = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const handleFindCenter = useCallback(() => {
    setStep("locating");
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support location services. Please visit our fellowship page to find a center near you.",
      );
      setStep("no-match");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const results = findNearestCenters(latitude, longitude, 2);
        if (results.length > 0) {
          setNearestCenters(results);
          setStep("result");
        } else {
          setStep("no-match");
        }
      },
      (error) => {
        let message = "Unable to get your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location access was denied. You can still browse all our centers on the fellowship page.";
            break;
          case error.POSITION_UNAVAILABLE:
            message =
              "Your location is currently unavailable. Please try again later.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out. Please try again.";
            break;
        }
        setLocationError(message);
        setStep("no-match");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-70 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* ─── Step: Ask ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {step === "ask" && (
                <motion.div
                  key="ask"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header */}
                  <div className="relative bg-linear-to-br from-primary via-orange-500 to-amber-500 p-7 text-white">
                    <button
                      onClick={dismiss}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Users className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-widest">
                          House Fellowship
                        </p>
                        <h3 className="text-xl font-bold leading-tight">
                          Join a Family Near You
                        </h3>
                      </div>
                    </div>
                    <p className="text-white/85 text-sm leading-relaxed">
                      Our house fellowship centers are places of deep
                      connection, prayer, and spiritual growth. Do you already
                      belong to one?
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="p-5 space-y-3">
                    <button
                      onClick={handleAlreadyMember}
                      className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-all active:scale-[0.98]"
                    >
                      <Home className="w-5 h-5" />
                      Yes, I belong to one
                    </button>
                    <button
                      onClick={handleFindCenter}
                      className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                    >
                      <Navigation className="w-5 h-5" />
                      Find a Center Near Me
                    </button>
                    <p className="text-center text-[11px] text-gray-400 pt-1">
                      We&apos;ll use your location to find the nearest
                      fellowship center
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ─── Step: Locating ──────────────────────────────── */}
              {step === "locating" && (
                <motion.div
                  key="locating"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-10 text-center space-y-5"
                >
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Getting Your Location...
                    </h3>
                    <p className="text-sm text-gray-500">
                      Please allow location access when prompted by your
                      browser.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ─── Step: Result ─────────────────────────────────── */}
              {step === "result" && nearestCenters.length > 0 && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header */}
                  <div className="relative bg-linear-to-r from-emerald-500 to-green-600 p-6 text-white">
                    <button
                      onClick={dismiss}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                          Nearest Center Found
                        </p>
                        <h3 className="font-bold text-lg leading-tight">
                          We found{" "}
                          {nearestCenters.length === 1 ? "a center" : "centers"}{" "}
                          near you!
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Centers List */}
                  <div className="p-5 space-y-4 max-h-[50vh] overflow-y-auto">
                    {nearestCenters.map(({ center, distanceKm }, idx) => (
                      <div
                        key={center.id}
                        className={`rounded-2xl border p-4 space-y-3 ${
                          idx === 0
                            ? "border-primary/30 bg-primary/5 ring-1 ring-primary/10"
                            : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        {idx === 0 && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
                            Closest to you
                          </span>
                        )}

                        <h4 className="font-bold text-gray-900 text-base">
                          {center.name}
                        </h4>

                        <div className="space-y-1.5 text-xs text-gray-600">
                          <p className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                            {center.address}
                          </p>
                          <p className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-primary shrink-0" />
                            {center.coordinator}
                          </p>
                          <p className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                            {center.meetingTime}
                          </p>
                          <p className="flex items-center gap-2">
                            <Navigation className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-primary">
                              ~{distanceKm.toFixed(1)} km away
                            </span>
                          </p>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <Link
                            href={center.mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 h-10 rounded-xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-gray-800 transition-colors active:scale-[0.97]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Directions
                          </Link>
                          <Link
                            href={center.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 h-10 rounded-xl bg-green-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-green-700 transition-colors active:scale-[0.97]"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </Link>
                        </div>
                      </div>
                    ))}

                    <Link
                      href="/fellowship"
                      onClick={dismiss}
                      className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
                    >
                      View All Centers
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* ─── Step: No Match / Error ───────────────────────── */}
              {step === "no-match" && (
                <motion.div
                  key="no-match"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative bg-linear-to-r from-amber-500 to-orange-500 p-6 text-white">
                    <button
                      onClick={dismiss}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-lg">
                        {locationError
                          ? "Location Unavailable"
                          : "No Nearby Center"}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {locationError ||
                        "We couldn't find a center very close to your location, but you can browse all our fellowship centers to find one that works for you."}
                    </p>

                    <div className="space-y-3">
                      <Link
                        href="/fellowship"
                        onClick={dismiss}
                        className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
                      >
                        <Home className="w-5 h-5" />
                        Browse All Centers
                      </Link>
                      <Link
                        href="https://wa.me/2347066644051"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-green-50 text-green-700 font-bold text-sm border border-green-100 hover:bg-green-100 transition-all active:scale-[0.98]"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Contact General Coordinator
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
