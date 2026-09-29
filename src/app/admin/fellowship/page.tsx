"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Home,
  MapPin,
  User,
  Clock,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  MessageCircle,
  Users,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { showConfirm } from "@/components/shared/CustomDialog";
import { StatCard } from "@/components/shared/StatCard";
import { ModalShell } from "@/components/shared/ModalShell";
import { authFetch } from "@/lib/authClient";
import type {
  FellowshipCenterRecord,
  FellowshipCenterInput,
} from "@/lib/fellowshipService";

type ModalMode = "create" | "edit" | null;

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

// ──────────────────────────────────────────────
// Center Form Modal
// ──────────────────────────────────────────────

function CenterModal({
  mode,
  center,
  nextOrder,
  onClose,
  onSave,
  saving,
}: {
  mode: ModalMode;
  center: FellowshipCenterRecord | null;
  /** Position a new center takes (end of the list). */
  nextOrder: number;
  onClose: () => void;
  onSave: (data: FellowshipCenterInput & { id?: string }) => void;
  saving: boolean;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [coordinator, setCoordinator] = useState("");
  const [meetingTime, setMeetingTime] = useState("Every Sunday, 6:00 PM");
  const [mapLink, setMapLink] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [areaKeywords, setAreaKeywords] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (center && mode === "edit") {
      setName(center.name);
      setAddress(center.address);
      setCoordinator(center.coordinator);
      setMeetingTime(center.meetingTime);
      setMapLink(center.mapLink);
      setWhatsappLink(center.whatsappLink);
      setLat(String(center.lat));
      setLng(String(center.lng));
      setAreaKeywords((center.areaKeywords || []).join(", "));
      setActive(center.active);
    } else {
      setName("");
      setAddress("");
      setCoordinator("");
      setMeetingTime("Every Sunday, 6:00 PM");
      setMapLink("");
      setWhatsappLink("");
      setLat("");
      setLng("");
      setAreaKeywords("");
      setActive(true);
    }
  }, [center, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!name.trim() || !address.trim() || !coordinator.trim()) {
      toast.error("Name, address and coordinator are required");
      return;
    }
    if (!/^https?:\/\//i.test(mapLink.trim())) {
      toast.error("Map link must start with http(s)://");
      return;
    }
    if (!/^https?:\/\//i.test(whatsappLink.trim())) {
      toast.error("WhatsApp link must start with http(s)://");
      return;
    }
    if (!lat.trim() || !lng.trim() || Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      toast.error("Latitude and longitude must be numbers", {
        description: "They power the “find a center near me” prompt.",
      });
      return;
    }
    onSave({
      id: center?.id,
      name: name.trim(),
      address: address.trim(),
      coordinator: coordinator.trim(),
      meetingTime: meetingTime.trim() || "Every Sunday, 6:00 PM",
      mapLink: mapLink.trim(),
      whatsappLink: whatsappLink.trim(),
      lat: latNum,
      lng: lngNum,
      areaKeywords: areaKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      active,
      order: center?.order ?? nextOrder,
    });
  };

  if (!mode) return null;

  return (
    <ModalShell onClose={onClose} className="max-w-2xl">
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          {mode === "create" ? "Add Fellowship Center" : "Edit Fellowship Center"}
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
            Center Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="e.g. Irawo Center"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address <span className="text-red-400">*</span>
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-y"
            placeholder="Street, landmark / bus stop, area, Ikorodu."
            required
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coordinator <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={coordinator}
              onChange={(e) => setCoordinator(e.target.value)}
              className={inputClass}
              placeholder="e.g. Pst. David Kilanko"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Meeting Time
            </label>
            <input
              type="text"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className={inputClass}
              placeholder="Every Sunday, 6:00 PM"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Google Maps Link <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              inputMode="url"
              value={mapLink}
              onChange={(e) => setMapLink(e.target.value)}
              className={inputClass}
              placeholder="https://maps.app.goo.gl/…"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coordinator WhatsApp Link <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              inputMode="url"
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
              className={inputClass}
              placeholder="https://wa.me/234…"
              required
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitude <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className={inputClass}
              placeholder="6.6201"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitude <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className={inputClass}
              placeholder="3.5084"
              required
            />
          </div>
        </div>
        <p className="-mt-2 text-xs text-gray-400">
          Coordinates drive the “find a center near me” prompt. Right-click the
          spot in Google Maps and copy the numbers shown at the top of the menu.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area Keywords
          </label>
          <input
            type="text"
            value={areaKeywords}
            onChange={(e) => setAreaKeywords(e.target.value)}
            className={inputClass}
            placeholder="irawo, alafia, ikorodu road"
          />
          <p className="mt-1 text-xs text-gray-400">
            Comma-separated nearby areas and landmarks (optional).
          </p>
        </div>

        <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm text-gray-700">
            Show this center on the website
          </span>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition disabled:opacity-50 cursor-pointer"
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
    </ModalShell>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function FellowshipAdminPage() {
  const [centers, setCenters] = useState<FellowshipCenterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<FellowshipCenterRecord | null>(null);

  // ── Fetch ──
  const fetchCenters = useCallback(async () => {
    try {
      // include=inactive needs the admin token; it returns hidden centers too.
      const res = await authFetch("/api/fellowship?include=inactive", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCenters(data.centers || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load fellowship centers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const closeModal = () => {
    setModalMode(null);
    setEditing(null);
  };

  // ── Save (create / edit) ──
  const handleSave = async (data: FellowshipCenterInput & { id?: string }) => {
    setSaving(true);
    try {
      const { id, ...rest } = data;
      const isEdit = modalMode === "edit" && id;
      const res = await authFetch("/api/fellowship", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id, ...rest } : rest),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || (isEdit ? "Update failed" : "Create failed"));
      }
      toast.success(isEdit ? "Center updated" : "Center created", {
        description: `"${rest.name}" ${isEdit ? "has been updated" : "is now listed on the website"}.`,
      });
      closeModal();
      await fetchCenters();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Operation failed", {
        description: "Please try again or check your connection.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Partial update helper (toggle, reorder) ──
  const patchCenter = async (
    id: string,
    patch: Partial<FellowshipCenterInput>,
  ) => {
    const res = await authFetch("/api/fellowship", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Update failed");
    }
  };

  const handleToggleActive = async (center: FellowshipCenterRecord) => {
    try {
      await patchCenter(center.id, { active: !center.active });
      toast.success(!center.active ? "Center shown" : "Center hidden", {
        description: `"${center.name}" is now ${!center.active ? "visible on" : "hidden from"} the website.`,
      });
      await fetchCenters();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle");
    }
  };

  /** Swap `order` with the neighbour so the public page reflects the move. */
  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= centers.length) return;
    const a = centers[index];
    const b = centers[target];
    // Ties (e.g. two centers both at 0) would swap to the same value, so
    // assign by position instead of by stored order.
    try {
      await Promise.all([
        patchCenter(a.id, { order: target }),
        patchCenter(b.id, { order: index }),
      ]);
      await fetchCenters();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reorder");
    }
  };

  const handleDelete = async (center: FellowshipCenterRecord) => {
    const confirmed = await showConfirm(
      `Delete "${center.name}"? It will disappear from the website immediately.`,
      { title: "Delete Fellowship Center", variant: "warning", confirmLabel: "Delete" },
    );
    if (!confirmed) return;
    try {
      const res = await authFetch(
        `/api/fellowship?id=${encodeURIComponent(center.id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Center deleted", {
        description: `"${center.name}" has been removed.`,
      });
      await fetchCenters();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete", {
        description: "Please try again or check your connection.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Loading centers...</p>
      </div>
    );
  }

  const activeCount = centers.filter((c) => c.active).length;
  const coordinators = new Set(centers.map((c) => c.coordinator)).size;

  return (
    <div className="min-h-screen p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto overflow-x-hidden">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              House Fellowship
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Centers listed on /fellowship and used by the &ldquo;near me&rdquo;
              prompt
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCenters}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setModalMode("create");
            }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary/90 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Add Center
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <StatCard
          label="Centers"
          value={centers.length}
          icon={Home}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label="Visible"
          value={activeCount}
          icon={ToggleRight}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Hidden"
          value={centers.length - activeCount}
          icon={ToggleLeft}
          color="bg-gray-100 text-gray-500"
        />
        <StatCard
          label="Coordinators"
          value={coordinators}
          icon={Users}
          color="bg-amber-100 text-amber-600"
        />
      </div>

      {centers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            No fellowship centers yet
          </h3>
          <p className="text-muted-foreground text-sm">
            Add your first center above
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          <AnimatePresence mode="popLayout">
            {centers.map((center, index) => (
              <motion.div
                key={center.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  center.active
                    ? "bg-white border-gray-100 shadow-sm hover:shadow-md"
                    : "bg-gray-50 border-gray-200 opacity-60"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-5">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                    {/* Reorder */}
                    <div className="flex flex-col shrink-0">
                      <button
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0}
                        className="p-1 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 1)}
                        disabled={index === centers.length - 1}
                        className="p-1 rounded-md text-gray-300 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Home className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm">
                          {center.name}
                        </h3>
                        {!center.active && (
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full border border-gray-300">
                            Hidden
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-sm text-muted-foreground flex items-start gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{center.address}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[10px] sm:text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 shrink-0" />
                          {center.coordinator}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          {center.meetingTime}
                        </span>
                        <a
                          href={center.mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-primary"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          Map
                        </a>
                        <a
                          href={center.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-green-600"
                        >
                          <MessageCircle className="w-3 h-3 shrink-0" />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleToggleActive(center)}
                      className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                      title={center.active ? "Hide from website" : "Show on website"}
                    >
                      {center.active ? (
                        <ToggleRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(center);
                        setModalMode("edit");
                      }}
                      className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(center)}
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

      <AnimatePresence>
        {modalMode && (
          <CenterModal
            mode={modalMode}
            center={editing}
            nextOrder={centers.length}
            onClose={closeModal}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
