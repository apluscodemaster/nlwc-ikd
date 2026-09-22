"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ScrollText,
  Loader2,
  Filter,
  RotateCcw,
  User,
  Globe,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Send,
  RefreshCw,
  LogIn,
  LogOut,
} from "lucide-react";
import { useAdminAuth } from "../layout";
import { resolveAdminIdentity } from "@/lib/adminProfile";
import type { AuditEntry } from "@/lib/auditLog";

const ACTION_OPTIONS = [
  "create",
  "update",
  "delete",
  "publish",
  "upload",
  "reset",
  "login",
  "logout",
] as const;

const RESOURCE_OPTIONS = [
  "content",
  "devotional",
  "testimony",
  "quiz-question",
  "quiz-category",
  "quiz-stats",
  "schedule",
  "media",
  "session",
] as const;

const ACTION_META: Record<
  string,
  { icon: React.ElementType; chip: string; label: string }
> = {
  create: { icon: Plus, chip: "bg-emerald-50 text-emerald-600", label: "Created" },
  update: { icon: Pencil, chip: "bg-blue-50 text-blue-600", label: "Updated" },
  delete: { icon: Trash2, chip: "bg-red-50 text-red-600", label: "Deleted" },
  publish: { icon: Send, chip: "bg-primary/10 text-primary", label: "Published" },
  upload: { icon: Upload, chip: "bg-purple-50 text-purple-600", label: "Uploaded" },
  reset: { icon: RefreshCw, chip: "bg-amber-50 text-amber-600", label: "Reset" },
  login: { icon: LogIn, chip: "bg-gray-100 text-gray-600", label: "Signed in" },
  logout: { icon: LogOut, chip: "bg-gray-100 text-gray-600", label: "Signed out" },
};

function actionMeta(action: string) {
  return (
    ACTION_META[action] ?? {
      icon: ScrollText,
      chip: "bg-gray-100 text-gray-600",
      label: action,
    }
  );
}

function prettyResource(resource: string) {
  return resource
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/** Absolute local time — audit trails need exact stamps, not "2 hours ago". */
function formatStamp(at: number) {
  const d = new Date(at);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function relative(at: number) {
  const diff = Date.now() - at;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function detailText(detail: AuditEntry["detail"]) {
  if (!detail) return null;
  return Object.entries(detail)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

export default function AuditLogPage() {
  const { user } = useAdminAuth();

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [actors, setActors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [nextBefore, setNextBefore] = useState<number | null>(null);

  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [actor, action, resource].filter(Boolean).length;

  const buildQuery = useCallback(
    (before?: number) => {
      const params = new URLSearchParams();
      if (actor) params.set("actor", actor);
      if (action) params.set("action", action);
      if (resource) params.set("resource", resource);
      if (before) params.set("before", String(before));
      return params.toString();
    },
    [actor, action, resource],
  );

  const load = useCallback(
    async (before?: number) => {
      if (!user) return;
      if (before) setLoadingMore(true);
      else setLoading(true);
      setError("");

      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/admin/audit-log?${buildQuery(before)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Request failed (${res.status})`);
        }

        const data = await res.json();
        setEntries((prev) =>
          before ? [...prev, ...(data.entries ?? [])] : (data.entries ?? []),
        );
        setNextBefore(data.nextBefore ?? null);
        if (!before && Array.isArray(data.actors) && data.actors.length) {
          setActors(data.actors);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit log");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user, buildQuery],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const clearFilters = () => {
    setActor("");
    setAction("");
    setResource("");
  };

  const summary = useMemo(() => {
    const byActor = new Set(entries.map((e) => e.actorEmail ?? "unknown"));
    return {
      shown: entries.length,
      actors: byActor.size,
      failures: entries.filter((e) => e.status === "failure").length,
    };
  }, [entries]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ScrollText className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Audit Log
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Every change made through the admin interface, and who made it.
          </p>
        </div>

        <button
          onClick={() => void load()}
          disabled={loading}
          className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Summary tiles ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
        {[
          { label: "Entries shown", value: summary.shown },
          { label: "Admins", value: summary.actors },
          { label: "Failures", value: summary.failures },
        ].map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl border border-gray-100 bg-white p-3 sm:p-4"
          >
            <p className="text-xl sm:text-2xl font-bold text-gray-900">
              {tile.value}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              {tile.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="mb-5">
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`h-11 px-4 rounded-xl border font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer ${
            showFilters || activeFilterCount
              ? "bg-primary text-white border-primary"
              : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 mt-3 bg-gray-50/80 rounded-2xl border border-gray-100">
              <SelectFilter
                label="Admin"
                value={actor}
                onChange={setActor}
                options={actors.map((a) => ({ value: a, label: a }))}
              />
              <SelectFilter
                label="Action"
                value={action}
                onChange={setAction}
                options={ACTION_OPTIONS.map((a) => ({
                  value: a,
                  label: actionMeta(a).label,
                }))}
              />
              <SelectFilter
                label="Resource"
                value={resource}
                onChange={setResource}
                options={RESOURCE_OPTIONS.map((r) => ({
                  value: r,
                  label: prettyResource(r),
                }))}
              />
              {activeFilterCount > 0 && (
                <div className="sm:col-span-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── States ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground mt-4">Loading audit log…</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Couldn&apos;t load the audit log
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <ScrollText className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            No activity recorded
          </h3>
          <p className="text-sm text-muted-foreground">
            {activeFilterCount
              ? "No entries match these filters."
              : "Admin actions will appear here as they happen."}
          </p>
        </div>
      )}

      {/* ── Mobile: stacked cards ── */}
      {!loading && !error && entries.length > 0 && (
        <>
          <div className="space-y-3 lg:hidden">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>

          {/* ── Desktop: table ── */}
          <div className="hidden lg:block rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3">When</th>
                    <th className="px-5 py-3">Admin</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Resource</th>
                    <th className="px-5 py-3">Target</th>
                    <th className="px-5 py-3">Origin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry) => {
                    const meta = actionMeta(entry.action);
                    const Icon = meta.icon;
                    const detail = detailText(entry.detail);
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50/60">
                        <td className="px-5 py-3.5 whitespace-nowrap align-top">
                          <p className="text-gray-900 font-medium">
                            {formatStamp(entry.at)}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {relative(entry.at)}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 align-top max-w-[220px]">
                          <p className="text-gray-900 font-medium truncate">
                            {resolveAdminIdentity({ email: entry.actorEmail }).name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {entry.actorEmail ?? "unknown"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meta.chip}`}
                          >
                            <Icon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          {entry.status === "failure" && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                              <XCircle className="w-3 h-3" />
                              failed
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 align-top whitespace-nowrap text-gray-600">
                          {prettyResource(entry.resource)}
                        </td>
                        <td className="px-5 py-3.5 align-top max-w-[320px]">
                          <p className="text-gray-900 wrap-break-word">
                            {entry.target ?? "—"}
                          </p>
                          {detail && (
                            <p className="text-[11px] text-gray-400 mt-0.5 wrap-break-word">
                              {detail}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 align-top whitespace-nowrap text-xs text-gray-400">
                          {entry.ip ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Load more ── */}
          {nextBefore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => void load(nextBefore)}
                disabled={loadingMore}
                className="h-11 px-6 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
              >
                {loadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Load older entries
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 appearance-none cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
        >
          <option value="">All</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

function EntryCard({ entry }: { entry: AuditEntry }) {
  const meta = actionMeta(entry.action);
  const Icon = meta.icon;
  const detail = detailText(entry.detail);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${meta.chip}`}
        >
          <Icon className="w-3 h-3" />
          {meta.label}
        </span>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">
          {relative(entry.at)}
        </span>
      </div>

      <p className="font-bold text-sm text-gray-900 wrap-break-word mb-1">
        {entry.target ?? prettyResource(entry.resource)}
      </p>
      <p className="text-[11px] text-muted-foreground mb-3">
        {prettyResource(entry.resource)}
        {detail ? ` · ${detail}` : ""}
      </p>

      <div className="space-y-1.5 pt-3 border-t border-gray-50 text-[11px] text-gray-500">
        <p className="flex items-center gap-1.5 min-w-0">
          <User className="w-3.5 h-3.5 shrink-0 text-primary/60" />
          <span className="truncate">
            {resolveAdminIdentity({ email: entry.actorEmail }).name}
            {entry.actorEmail ? ` · ${entry.actorEmail}` : ""}
          </span>
        </p>
        <p className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 shrink-0 text-primary/60" />
          {entry.ip ?? "—"}
        </p>
        <p className="flex items-center gap-1.5">
          {entry.status === "failure" ? (
            <XCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
          )}
          {formatStamp(entry.at)}
        </p>
      </div>
    </div>
  );
}
