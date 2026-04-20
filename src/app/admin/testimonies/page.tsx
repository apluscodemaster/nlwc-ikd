"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Eye,
  EyeOff,
  Calendar,
  User,
  MessageCircleHeart,
  ShieldCheck,
  ShieldX,
  BarChart3,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToAllTestimonies,
  updateTestimonyStatus,
  type Testimony,
  type TestimonyStatus,
} from "@/lib/testimonyService";

// ──────────────────────────────────────────────
// Filter types
// ──────────────────────────────────────────────

type FilterTab = "all" | TestimonyStatus;

const FILTER_TABS: { id: FilterTab; label: string; icon: React.ElementType }[] =
  [
    { id: "all", label: "All", icon: Filter },
    { id: "pending", label: "Pending", icon: Clock },
    { id: "verified", label: "Verified", icon: CheckCircle2 },
    { id: "rejected", label: "Rejected", icon: XCircle },
  ];

// ──────────────────────────────────────────────
// Stats Card
// ──────────────────────────────────────────────

function StatCard({
  label,
  count,
  icon: Icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{count}</p>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Admin Testimony Card
// ──────────────────────────────────────────────

function AdminTestimonyCard({
  testimony,
  onApprove,
  onReject,
  acting,
}: {
  testimony: Testimony;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  acting: string | null;
}) {
  const date = new Date(testimony.createdAt).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusColors: Record<TestimonyStatus, string> = {
    pending: "bg-amber-50 text-amber-600 border-amber-200",
    verified: "bg-emerald-50 text-emerald-600 border-emerald-200",
    rejected: "bg-red-50 text-red-500 border-red-200",
  };

  const statusIcons: Record<TestimonyStatus, React.ElementType> = {
    pending: Clock,
    verified: CheckCircle2,
    rejected: XCircle,
  };

  const StatusIcon = statusIcons[testimony.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5 pb-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-primary/20">
            {testimony.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-gray-900 text-sm truncate">
              {testimony.name}
            </h4>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {date}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${statusColors[testimony.status]}`}
        >
          <StatusIcon className="w-3 h-3" />
          {testimony.status}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 p-4 sm:p-5 pt-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{testimony.location}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="truncate">{testimony.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <a
            href={`mailto:${testimony.email}`}
            className="truncate hover:text-primary transition-colors"
          >
            {testimony.email}
          </a>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {testimony.displayPreference === "public" ? (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-600 font-medium">Public</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-amber-600 font-medium">Private</span>
            </>
          )}
        </div>
      </div>

      {/* Testimony body */}
      <div className="mx-4 sm:mx-5 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {testimony.testimony}
        </p>
      </div>

      {/* Action buttons — only for pending testimonies */}
      {testimony.status === "pending" && (
        <div className="flex items-center gap-2 p-4 sm:p-5 pt-0">
          <button
            onClick={() => onApprove(testimony.id)}
            disabled={acting === testimony.id}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {acting === testimony.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Approve
          </button>
          <button
            onClick={() => onReject(testimony.id)}
            disabled={acting === testimony.id}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            {acting === testimony.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldX className="w-4 h-4" />
            )}
            Reject
          </button>
        </div>
      )}

      {/* Re-action buttons for already decided testimonies */}
      {testimony.status !== "pending" && (
        <div className="flex items-center gap-2 p-4 sm:p-5 pt-0">
          {testimony.status === "rejected" && (
            <button
              onClick={() => onApprove(testimony.id)}
              disabled={acting === testimony.id}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 font-medium text-xs hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Approve Instead
            </button>
          )}
          {testimony.status === "verified" && (
            <button
              onClick={() => onReject(testimony.id)}
              disabled={acting === testimony.id}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 font-medium text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShieldX className="w-3.5 h-3.5" />
              Revoke Approval
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function AdminTestimoniesPage() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [acting, setActing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToAllTestimonies((data) => {
      setTestimonies(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleApprove = async (id: string) => {
    setActing(id);
    const success = await updateTestimonyStatus(id, "verified");
    if (success) {
      toast.success("Testimony approved and published!");
    } else {
      toast.error("Failed to approve testimony.");
    }
    setActing(null);
  };

  const handleReject = async (id: string) => {
    setActing(id);
    const success = await updateTestimonyStatus(id, "rejected");
    if (success) {
      toast.success("Testimony rejected.");
    } else {
      toast.error("Failed to reject testimony.");
    }
    setActing(null);
  };

  // Counts
  const counts = {
    all: testimonies.length,
    pending: testimonies.filter((t) => t.status === "pending").length,
    verified: testimonies.filter((t) => t.status === "verified").length,
    rejected: testimonies.filter((t) => t.status === "rejected").length,
  };

  // Filter + search
  const filtered = testimonies
    .filter((t) => activeFilter === "all" || t.status === activeFilter)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.testimony.toLowerCase().includes(q)
      );
    });

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <MessageCircleHeart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Testimony Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Review & verify submitted testimonies
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total"
          count={counts.all}
          icon={BarChart3}
          color="bg-gray-100 text-gray-600"
        />
        <StatCard
          label="Pending"
          count={counts.pending}
          icon={Clock}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Verified"
          count={counts.verified}
          icon={CheckCircle2}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Rejected"
          count={counts.rejected}
          icon={XCircle}
          color="bg-red-100 text-red-500"
        />
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeFilter === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              <span
                className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeFilter === tab.id
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search testimonies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">
            Loading testimonies...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MessageCircleHeart className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {searchQuery ? "No results found" : "No testimonies yet"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {searchQuery
              ? "Try a different search term."
              : "Submitted testimonies will appear here for review."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((t) => (
              <AdminTestimonyCard
                key={t.id}
                testimony={t}
                onApprove={handleApprove}
                onReject={handleReject}
                acting={acting}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
