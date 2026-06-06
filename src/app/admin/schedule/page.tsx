"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Clock,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  RepeatIcon,
  CalendarPlus,
  BarChart3,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { showConfirm } from "@/components/shared/CustomDialog";
import type { RecurringService, SpecialService } from "@/lib/scheduleService";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const CATEGORIES = [
  "Worship",
  "Prayer",
  "Study",
  "Special",
  "Conference",
  "Youth",
];

type ActiveTab = "recurring" | "special";
type ModalMode = "create" | "edit" | null;

// ──────────────────────────────────────────────
// Helper: format hour to 12h
// ──────────────────────────────────────────────

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

// ──────────────────────────────────────────────
// Stat Card (matches testimonies / quiz pattern)
// ──────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-2xl bg-white border border-gray-100 shadow-sm min-w-0">
      <div
        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg sm:text-2xl font-bold text-gray-900 leading-none mb-0.5">
          {value}
        </p>
        <p className="text-[9px] sm:text-xs text-muted-foreground font-medium uppercase tracking-tight truncate w-full">
          {label}
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Recurring Form Modal
// ──────────────────────────────────────────────

function RecurringModal({
  mode,
  service,
  onClose,
  onSave,
  saving,
}: {
  mode: ModalMode;
  service: RecurringService | null;
  onClose: () => void;
  onSave: (data: Partial<RecurringService> & { type: "recurring" }) => void;
  saving: boolean;
}) {
  const [label, setLabel] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(12);
  const [endsNextDay, setEndsNextDay] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("Church Auditorium, Ikorodu");
  const [category, setCategory] = useState("Worship");
  const [icon, setIcon] = useState("⛪");
  const [recurrenceLabel, setRecurrenceLabel] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (service && mode === "edit") {
      setLabel(service.label);
      setDayOfWeek(service.dayOfWeek);
      setStartHour(service.startHour);
      setEndHour(service.endHour);
      setEndsNextDay(service.endsNextDay || false);
      setDescription(service.description || "");
      setImageUrl(service.imageUrl || "");
      setLocation(service.location || "Church Auditorium, Ikorodu");
      setCategory(service.category || "Worship");
      setIcon(service.icon || "⛪");
      setRecurrenceLabel(service.recurrenceLabel || "");
      setActive(service.active);
    } else {
      setLabel("");
      setDayOfWeek(0);
      setStartHour(9);
      setEndHour(12);
      setEndsNextDay(false);
      setDescription("");
      setImageUrl("");
      setLocation("Church Auditorium, Ikorodu");
      setCategory("Worship");
      setIcon("⛪");
      setRecurrenceLabel("");
      setActive(true);
    }
  }, [service, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    if (!endsNextDay && startHour >= endHour) {
      toast.error("Start hour must be before end hour (or enable 'Ends next day')");
      return;
    }
    onSave({
      type: "recurring",
      id: service?.id,
      label: label.trim(),
      dayOfWeek,
      startHour,
      endHour,
      endsNextDay,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      location: location.trim(),
      category,
      icon: icon.trim(),
      recurrenceLabel: recurrenceLabel.trim() || `Every ${DAY_NAMES[dayOfWeek]}`,
      active,
    });
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <RepeatIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {mode === "create"
              ? "Add Recurring Service"
              : "Edit Recurring Service"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Sunday Worship Service"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              required
            />
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Day of Week
            </label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            >
              {DAY_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Start/End Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Hour
              </label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {formatHour(i)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Hour
              </label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ends Next Day toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEndsNextDay(!endsNextDay)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition"
            >
              {endsNextDay ? (
                <ToggleRight className="w-5 h-5 text-primary" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              )}
              Ends next day (overnight event)
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the service"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Church Auditorium, Ikorodu"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          {/* Category + Icon */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon <span className="text-gray-400">(emoji)</span>
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. ⛪ 🙏 📖"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Recurrence Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recurrence Label{" "}
              <span className="text-gray-400">
                (auto-filled if empty)
              </span>
            </label>
            <input
              type="text"
              value={recurrenceLabel}
              onChange={(e) => setRecurrenceLabel(e.target.value)}
              placeholder={`e.g. Every ${DAY_NAMES[dayOfWeek]}`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                Image URL{" "}
                <span className="text-gray-400">
                  (Cloudinary public ID or URL)
                </span>
              </span>
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="e.g. banners/sunday-service or full URL"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              Active in Schedule
            </span>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className="focus:outline-none"
            >
              {active ? (
                <ToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Special Event Form Modal
// ──────────────────────────────────────────────

function SpecialModal({
  mode,
  service,
  onClose,
  onSave,
  saving,
}: {
  mode: ModalMode;
  service: SpecialService | null;
  onClose: () => void;
  onSave: (data: Partial<SpecialService> & { type: "special" }) => void;
  saving: boolean;
}) {
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(12);
  const [endsNextDay, setEndsNextDay] = useState(false);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("Church Auditorium, Ikorodu");
  const [category, setCategory] = useState("Special");
  const [icon, setIcon] = useState("📅");
  const [recurrenceLabel, setRecurrenceLabel] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (service && mode === "edit") {
      setLabel(service.label);
      setDate(service.date);
      setStartHour(service.startHour);
      setEndHour(service.endHour);
      setEndsNextDay(service.endsNextDay || false);
      setDescription(service.description || "");
      setImageUrl(service.imageUrl || "");
      setLocation(service.location || "Church Auditorium, Ikorodu");
      setCategory(service.category || "Special");
      setIcon(service.icon || "📅");
      setRecurrenceLabel(service.recurrenceLabel || "");
      setActive(service.active);
    } else {
      setLabel("");
      setDate("");
      setStartHour(9);
      setEndHour(12);
      setEndsNextDay(false);
      setDescription("");
      setImageUrl("");
      setLocation("Church Auditorium, Ikorodu");
      setCategory("Special");
      setIcon("📅");
      setRecurrenceLabel("");
      setActive(true);
    }
  }, [service, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Label is required");
      return;
    }
    if (!date) {
      toast.error("Date is required");
      return;
    }
    if (!endsNextDay && startHour >= endHour) {
      toast.error("Start hour must be before end hour (or enable 'Ends next day')");
      return;
    }
    onSave({
      type: "special",
      id: service?.id,
      label: label.trim(),
      date,
      startHour,
      endHour,
      endsNextDay,
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      location: location.trim(),
      category,
      icon: icon.trim(),
      recurrenceLabel: recurrenceLabel.trim() || "Special Event",
      active,
    });
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {mode === "create" ? "Add Special Event" : "Edit Special Event"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Easter Conference"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              required
            />
          </div>

          {/* Start/End Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Hour
              </label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {formatHour(i)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Hour
              </label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ends Next Day toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEndsNextDay(!endsNextDay)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary transition"
            >
              {endsNextDay ? (
                <ToggleRight className="w-5 h-5 text-primary" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              )}
              Ends next day (overnight event)
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the event"
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Church Auditorium, Ikorodu"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          {/* Category + Icon */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon <span className="text-gray-400">(emoji)</span>
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. 📅 🕊️ ✨"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Recurrence Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recurrence Label{" "}
              <span className="text-gray-400">
                (optional — defaults to &quot;Special Event&quot;)
              </span>
            </label>
            <input
              type="text"
              value={recurrenceLabel}
              onChange={(e) => setRecurrenceLabel(e.target.value)}
              placeholder="e.g. Every 2nd Saturday, One-time event"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                Image URL{" "}
                <span className="text-gray-400">
                  (Cloudinary public ID or URL)
                </span>
              </span>
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="e.g. events/easter-2025 or full URL"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              Active in Schedule
            </span>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className="focus:outline-none"
            >
              {active ? (
                <ToggleRight className="w-8 h-8 text-green-500" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              )}
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function ScheduleAdminPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("recurring");
  const [recurring, setRecurring] = useState<RecurringService[]>([]);
  const [special, setSpecial] = useState<SpecialService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Recurring modal state
  const [recurringModalMode, setRecurringModalMode] = useState<ModalMode>(null);
  const [editingRecurring, setEditingRecurring] =
    useState<RecurringService | null>(null);

  // Special modal state
  const [specialModalMode, setSpecialModalMode] = useState<ModalMode>(null);
  const [editingSpecial, setEditingSpecial] = useState<SpecialService | null>(
    null,
  );

  // ── Fetch ──
  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecurring(data.recurring || []);
      setSpecial(data.special || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // ── Save Recurring ──
  const handleSaveRecurring = async (
    data: Partial<RecurringService> & { type: "recurring" },
  ) => {
    setSaving(true);
    try {
      const { type, ...rest } = data;
      if (recurringModalMode === "edit" && rest.id) {
        const res = await fetch("/api/schedule", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id: rest.id, ...rest }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Update failed");
        }
        toast.success("Service updated", {
          description: `"${rest.label}" has been updated successfully.`,
        });
      } else {
        const res = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, ...rest }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Create failed");
        }
        toast.success("Service created", {
          description: `"${rest.label}" has been added to the schedule.`,
        });
      }
      setRecurringModalMode(null);
      setEditingRecurring(null);
      await fetchSchedules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed", {
        description: "Please try again or check your connection.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Save Special ──
  const handleSaveSpecial = async (
    data: Partial<SpecialService> & { type: "special" },
  ) => {
    setSaving(true);
    try {
      const { type, ...rest } = data;
      if (specialModalMode === "edit" && rest.id) {
        const res = await fetch("/api/schedule", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id: rest.id, ...rest }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Update failed");
        }
        toast.success("Event updated", {
          description: `"${rest.label}" has been updated successfully.`,
        });
      } else {
        const res = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, ...rest }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Create failed");
        }
        toast.success("Event created", {
          description: `"${rest.label}" has been added to the schedule.`,
        });
      }
      setSpecialModalMode(null);
      setEditingSpecial(null);
      await fetchSchedules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed", {
        description: "Please try again or check your connection.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (type: "recurring" | "special", id: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete this ${type === "recurring" ? "service" : "event"}?`,
      {
        title: "Delete Schedule Entry",
        variant: "warning",
        confirmLabel: "Delete",
      },
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/schedule?type=${type}&id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(`${type === "recurring" ? "Service" : "Event"} deleted`, {
        description: "The schedule entry has been removed.",
      });
      await fetchSchedules();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete", {
        description: "Please try again or check your connection.",
      });
    }
  };

  // ── Quick Toggle Active ──
  const handleToggleActive = async (
    type: "recurring" | "special",
    id: string,
    currentActive: boolean,
  ) => {
    try {
      const res = await fetch("/api/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, active: !currentActive }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      toast.success(!currentActive ? "Activated" : "Deactivated", {
        description: `Schedule entry has been ${!currentActive ? "activated" : "deactivated"}.`,
      });
      await fetchSchedules();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle status", {
        description: "Please try again or check your connection.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Loading schedules...</p>
      </div>
    );
  }

  const activeCount = recurring.filter((s) => s.active).length;
  const inactiveCount = recurring.filter((s) => !s.active).length;
  const activeSpecialCount = special.filter((s) => s.active).length;

  return (
    <div className="min-h-screen p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Live Schedule
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage recurring services &amp; special events
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <StatCard
          label="Recurring"
          value={recurring.length}
          icon={RepeatIcon}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label="Active"
          value={activeCount}
          icon={ToggleRight}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Inactive"
          value={inactiveCount}
          icon={ToggleLeft}
          color="bg-gray-100 text-gray-500"
        />
        <StatCard
          label="Special Events"
          value={activeSpecialCount}
          icon={CalendarPlus}
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="overflow-x-auto pb-1 hide-scrollbar snap-x snap-mandatory -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-gray-100/80 rounded-2xl w-max">
            <button
              onClick={() => setActiveTab("recurring")}
              className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap snap-start ${
                activeTab === "recurring"
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              <RepeatIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Recurring
              <span
                className={`ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] ${
                  activeTab === "recurring"
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {recurring.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("special")}
              className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap snap-start ${
                activeTab === "special"
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              <CalendarPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Special Events
              <span
                className={`ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] ${
                  activeTab === "special"
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {special.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Recurring Services Tab */}
      {activeTab === "recurring" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingRecurring(null);
                setRecurringModalMode("create");
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Add Recurring Service
            </button>
          </div>

          {recurring.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <RepeatIcon className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                No recurring services yet
              </h3>
              <p className="text-muted-foreground text-sm">
                Add your first weekly service above
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              <AnimatePresence mode="popLayout">
                {recurring.map((svc) => (
                  <motion.div
                    key={svc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`rounded-2xl border overflow-hidden transition-all ${
                      svc.active
                        ? "bg-white border-gray-100 shadow-sm hover:shadow-md"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-5">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">
                          {svc.icon || <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm">
                              {svc.label}
                            </h3>
                            {svc.category && (
                              <span className="text-[9px] sm:text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                {svc.category}
                              </span>
                            )}
                            {!svc.active && (
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full border border-gray-300">
                                Inactive
                              </span>
                            )}
                            {svc.imageUrl && (
                              <span title="Has image">
                                <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {DAY_NAMES[svc.dayOfWeek]} &middot;{" "}
                            {formatHour(svc.startHour)} &ndash;{" "}
                            {formatHour(svc.endHour)}
                            {svc.endsNextDay && (
                              <span className="text-[9px] font-medium text-amber-600 ml-1">(+1 day)</span>
                            )}
                          </p>
                          {svc.location && (
                            <p className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {svc.location}
                            </p>
                          )}
                          {svc.description && (
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {svc.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() =>
                            handleToggleActive("recurring", svc.id!, svc.active)
                          }
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title={svc.active ? "Deactivate" : "Activate"}
                        >
                          {svc.active ? (
                            <ToggleRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingRecurring(svc);
                            setRecurringModalMode("edit");
                          }}
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete("recurring", svc.id!)}
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Special Events Tab */}
      {activeTab === "special" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingSpecial(null);
                setSpecialModalMode("create");
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Add Special Event
            </button>
          </div>

          {special.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <CalendarPlus className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                No special events yet
              </h3>
              <p className="text-muted-foreground text-sm">
                Add conferences, retreats, or one-off services
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              <AnimatePresence mode="popLayout">
                {special.map((evt) => (
                  <motion.div
                    key={evt.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`rounded-2xl border overflow-hidden transition-all ${
                      evt.active
                        ? "bg-white border-gray-100 shadow-sm hover:shadow-md"
                        : "bg-gray-50 border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-5">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 text-lg">
                          {evt.icon || <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm">
                              {evt.label}
                            </h3>
                            {evt.category && (
                              <span className="text-[9px] sm:text-[10px] font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                {evt.category}
                              </span>
                            )}
                            {!evt.active && (
                              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full border border-gray-300">
                                Inactive
                              </span>
                            )}
                            {evt.imageUrl && (
                              <span title="Has image">
                                <ImageIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {evt.date} &middot; {formatHour(evt.startHour)}{" "}
                            &ndash; {formatHour(evt.endHour)}
                            {evt.endsNextDay && (
                              <span className="text-[9px] font-medium text-amber-600 ml-1">(+1 day)</span>
                            )}
                          </p>
                          {evt.location && (
                            <p className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {evt.location}
                            </p>
                          )}
                          {evt.description && (
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {evt.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() =>
                            handleToggleActive("special", evt.id!, evt.active)
                          }
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title={evt.active ? "Deactivate" : "Activate"}
                        >
                          {evt.active ? (
                            <ToggleRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingSpecial(evt);
                            setSpecialModalMode("edit");
                          }}
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete("special", evt.id!)}
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {recurringModalMode && (
          <RecurringModal
            mode={recurringModalMode}
            service={editingRecurring}
            onClose={() => {
              setRecurringModalMode(null);
              setEditingRecurring(null);
            }}
            onSave={handleSaveRecurring}
            saving={saving}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {specialModalMode && (
          <SpecialModal
            mode={specialModalMode}
            service={editingSpecial}
            onClose={() => {
              setSpecialModalMode(null);
              setEditingSpecial(null);
            }}
            onSave={handleSaveSpecial}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
