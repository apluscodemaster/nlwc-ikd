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
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  RepeatIcon,
  CalendarPlus,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { showConfirm } from "@/components/shared/CustomDialog";
import type { RecurringService, SpecialService } from "@/lib/scheduleService";
import { StatCard } from "@/components/shared/StatCard";
import { RecurringModal } from "@/components/admin/schedule/RecurringModal";
import { SpecialModal } from "@/components/admin/schedule/SpecialModal";
import type { ActiveTab, ModalMode } from "@/components/admin/schedule/types";
import { DAY_NAMES, formatHour } from "@/components/admin/schedule/types";

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
      const res = await fetch("/api/schedule");
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
        toast.success("Service updated");
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
        toast.success("Service created");
      }
      setRecurringModalMode(null);
      setEditingRecurring(null);
      await fetchSchedules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
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
        toast.success("Event updated");
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
        toast.success("Event created");
      }
      setSpecialModalMode(null);
      setEditingSpecial(null);
      await fetchSchedules();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
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
      toast.success(`${type === "recurring" ? "Service" : "Event"} deleted`);
      await fetchSchedules();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
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
      await fetchSchedules();
    } catch (err) {
      console.error(err);
      toast.error("Failed to toggle status");
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
