"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  X,
  Save,
  Image as ImageIcon,
  RepeatIcon,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import type { RecurringService } from "@/lib/scheduleService";
import type { ModalMode } from "./types";
import { DAY_NAMES, CATEGORIES, formatHour } from "./types";

export function RecurringModal({
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
    if (startHour >= endHour) {
      toast.error("Start hour must be before end hour");
      return;
    }
    onSave({
      type: "recurring",
      id: service?.id,
      label: label.trim(),
      dayOfWeek,
      startHour,
      endHour,
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
