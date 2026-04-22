"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Trash2,
  Pencil,
  RefreshCw,
  Plus,
  FileText,
  Calendar,
  Loader2,
  X,
  Check,
  AlertCircle,
  GripVertical,
  BookOpen,
  Search,
  Filter,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getAllDevotionals,
  createDevotional,
  updateDevotional,
  deleteDevotional,
  replaceDevotionalPdf,
  Devotional,
} from "@/lib/devotionals";
import { Timestamp } from "firebase/firestore";

// ──────────────────────────────────────────────
// Upload Queue Item
// ──────────────────────────────────────────────
interface UploadQueueItem {
  file: File;
  title: string;
  scheduledDate: string; // YYYY-MM-DD
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

// ──────────────────────────────────────────────
// Main Admin Page
// ──────────────────────────────────────────────
export default function AdminDevotionalsPage() {
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [processingUploads, setProcessingUploads] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replaceProgress, setReplaceProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10; // Display 10 items per page

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllDevotionals();
      setDevotionals(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Drag & Drop Zone Handlers ──

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf",
    );

    if (files.length === 0) return;

    const newItems: UploadQueueItem[] = files.map((file) => ({
      file,
      title: file.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " "),
      scheduledDate: new Date().toISOString().split("T")[0],
      progress: 0,
      status: "pending",
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);
    setShowUploadPanel(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      (f) => f.type === "application/pdf",
    );

    if (files.length === 0) return;

    const newItems: UploadQueueItem[] = files.map((file) => ({
      file,
      title: file.name.replace(/\.pdf$/i, "").replace(/[_-]/g, " "),
      scheduledDate: new Date().toISOString().split("T")[0],
      progress: 0,
      status: "pending",
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);
    setShowUploadPanel(true);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateQueueItem = (
    index: number,
    updates: Partial<UploadQueueItem>,
  ) => {
    setUploadQueue((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  };

  const removeFromQueue = (index: number) => {
    setUploadQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const processUploads = async () => {
    setProcessingUploads(true);
    const pending = uploadQueue
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.status === "pending");

    for (const { item, index } of pending) {
      updateQueueItem(index, { status: "uploading" });
      try {
        await createDevotional(
          {
            title: item.title,
            scheduledDate: new Date(item.scheduledDate + "T00:00:00"),
            file: item.file,
          },
          (progress) => updateQueueItem(index, { progress }),
        );
        updateQueueItem(index, { status: "done", progress: 100 });
      } catch (err) {
        updateQueueItem(index, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }

    setProcessingUploads(false);
    await refresh();
  };

  // ── Edit handlers ──

  const startEditing = (d: Devotional) => {
    setEditingId(d.id);
    setEditTitle(d.title);
    setEditDate(
      d.scheduledDate.toDate().toLocaleDateString("en-CA"), // YYYY-MM-DD format
    );
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDevotional(editingId, {
        title: editTitle,
        scheduledDate: new Date(editDate + "T00:00:00"),
      });
      setEditingId(null);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update.");
    }
  };

  // ── Replace handler ──

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;

    setReplaceProgress(0);
    try {
      await replaceDevotionalPdf(replacingId, file, (p) =>
        setReplaceProgress(p),
      );
      setReplacingId(null);
      await refresh();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to replace PDF.",
      );
      setReplacingId(null);
    }

    if (replaceInputRef.current) replaceInputRef.current.value = "";
  };

  // ── Delete handler ──

  const handleDelete = async () => {
    if (!confirmDeleteId) return;

    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await deleteDevotional(id);
      await refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Helper: format date ──

  const fmtDate = (t: Timestamp) =>
    t.toDate().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const isScheduledFuture = (t: Timestamp) => t.toDate() > new Date();

  const filteredDevotionals = devotionals.filter((d) => {
    const matchesTitle = d.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const date = d.scheduledDate.toDate();

    const start = filterStartDate
      ? new Date(filterStartDate + "T00:00:00")
      : null;
    const end = filterEndDate ? new Date(filterEndDate + "T23:59:59") : null;

    const matchesStart = !start || date >= start;
    const matchesEnd = !end || date <= end;

    return matchesTitle && matchesStart && matchesEnd;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  const isFiltered = searchTerm || filterStartDate || filterEndDate;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStartDate, filterEndDate]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDevotionals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDevotionals = filteredDevotionals.slice(startIndex, endIndex);

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-10 py-6 sm:py-12 overflow-x-hidden">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            Manage Devotionals
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 mb-4 sm:mb-6">
            Upload, edit, and manage daily devotional PDFs
          </p>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0 sm:min-w-[280px]">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 sm:h-11 pl-9 sm:pl-11 pr-3 sm:pr-4 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            {/* Date Range Inputs */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center h-10 sm:h-11 px-3 sm:px-4 rounded-2xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all flex-1 sm:flex-none min-w-0">
                <span className="text-[10px] font-bold text-gray-400 mr-2 uppercase tracking-wider hidden sm:block">
                  From
                </span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm focus:outline-none w-full min-w-0"
                />
              </div>

              <span className="text-gray-400 text-xs font-bold uppercase tracking-widest px-1">
                to
              </span>

              <div className="flex items-center h-10 sm:h-11 px-3 sm:px-4 rounded-2xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary/10 transition-all flex-1 sm:flex-none min-w-0">
                <span className="text-[10px] font-bold text-gray-400 mr-2 uppercase tracking-wider hidden sm:block">
                  To
                </span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm focus:outline-none w-full min-w-0"
                />
              </div>
            </div>

            {/* Clear Button */}
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="h-10 sm:h-11 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-500 transition-all flex items-center gap-2 self-start"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 sm:gap-2 h-10 sm:h-11 px-3 sm:px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-xs sm:text-sm font-semibold text-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowUploadPanel(true)}
            className="inline-flex items-center gap-1.5 sm:gap-2 h-10 sm:h-11 px-4 sm:px-6 rounded-2xl bg-primary text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Error toast */}
      <AnimatePresence>
        {actionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 flex-1">{actionError}</p>
            <button
              onClick={() => setActionError(null)}
              className="w-8 h-8 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────── Upload Panel ────────────── */}
      <AnimatePresence>
        {showUploadPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden">
              <div className="h-1 bg-linear-to-r from-primary via-amber-400 to-primary" />

              <div className="p-4 sm:p-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    Upload Devotionals
                  </h2>
                  <button
                    onClick={() => {
                      setShowUploadPanel(false);
                      setUploadQueue((q) =>
                        q.filter((i) => i.status !== "done"),
                      );
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-colors">
                    <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">
                    Drag & drop PDF files here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Queue List */}
                {uploadQueue.length > 0 && (
                  <div className="mt-4 sm:mt-6 space-y-3">
                    {uploadQueue.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-100"
                      >
                        <FileText className="w-5 h-5 text-primary shrink-0 hidden sm:block" />

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-3 items-center min-w-0">
                          {/* Title input */}
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              updateQueueItem(index, {
                                title: e.target.value,
                              })
                            }
                            placeholder="Devotional Title"
                            disabled={item.status !== "pending"}
                            className="h-9 sm:h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 w-full min-w-0"
                          />

                          {/* Date input */}
                          <div className="flex items-center h-9 sm:h-10 px-3 rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary/30 disabled:opacity-60 min-w-0">
                            <span className="text-[10px] font-bold text-gray-400 mr-2 uppercase hidden lg:block shrink-0">
                              Date:
                            </span>
                            <input
                              type="date"
                              value={item.scheduledDate}
                              onChange={(e) =>
                                updateQueueItem(index, {
                                  scheduledDate: e.target.value,
                                })
                              }
                              disabled={item.status !== "pending"}
                              className="bg-transparent text-sm focus:outline-none w-full min-w-0"
                            />
                          </div>

                          {/* Status */}
                          <div className="flex items-center gap-2">
                            {item.status === "uploading" && (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                <span className="text-xs font-semibold text-primary">
                                  {Math.round(item.progress)}%
                                </span>
                              </div>
                            )}
                            {item.status === "done" && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Check className="w-4 h-4" />
                                <span className="text-xs font-semibold">
                                  Done
                                </span>
                              </div>
                            )}
                            {item.status === "error" && (
                              <div className="flex items-center gap-1 text-red-500">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs font-semibold">
                                  Error
                                </span>
                              </div>
                            )}
                            {item.status === "pending" && (
                              <button
                                onClick={() => removeFromQueue(index)}
                                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors"
                              >
                                <X className="w-4 h-4 text-gray-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Process button */}
                    {uploadQueue.some((i) => i.status === "pending") && (
                      <button
                        onClick={processUploads}
                        disabled={processingUploads}
                        className="w-full h-10 sm:h-12 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {processingUploads ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {processingUploads
                          ? "Uploading..."
                          : `Upload ${uploadQueue.filter((i) => i.status === "pending").length} File(s)`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────── Devotionals Table ────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      ) : filteredDevotionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-gray-200 px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4 sm:mb-6">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-primary/40" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 text-center">
            No devotionals found
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-4 sm:mb-6 text-xs sm:text-base">
            {isFiltered
              ? `No results match your current filters. Try adjusting your search or date range.`
              : "Upload your first devotional PDF to get started."}
          </p>
          {!isFiltered && (
            <button
              onClick={() => setShowUploadPanel(true)}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Upload Devotional
            </button>
          )}
        </div>
      ) : filteredDevotionals.length > 0 ? (
        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white shadow-lg overflow-hidden">
          <div className="h-1 bg-linear-to-r from-primary via-amber-400 to-primary" />

          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-50 flex items-center justify-between gap-2">
            <span className="text-xs sm:text-sm font-bold text-gray-700">
              {filteredDevotionals.length} Devotional(s)
              {isFiltered && (
                <span className="text-muted-foreground font-normal ml-1 sm:ml-2">
                  (Filtered)
                </span>
              )}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground shrink-0">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {/* Table header — desktop only */}
          <div className="hidden lg:grid grid-cols-[1fr_180px_120px_200px] gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Title</span>
            <span>Scheduled Date</span>
            <span>Status</span>
            <span className="text-right">Manage Actions</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-50">
            {paginatedDevotionals.map((d) => {
              const isFuture = isScheduledFuture(d.scheduledDate);

              return (
                <motion.div
                  key={d.id}
                  layout
                  className="grid grid-cols-1 lg:grid-cols-[1fr_180px_120px_200px] gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 items-center hover:bg-gray-50/50 transition-colors"
                >
                  {/* Title */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                    {editingId === d.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 h-9 px-3 rounded-lg border border-primary/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-0"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {d.title}
                      </span>
                    )}
                  </div>

                  {/* Date + Status row on mobile */}
                  <div className="flex items-center gap-3 lg:contents">
                    <div className="flex-1">
                      {editingId === d.id ? (
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="h-9 px-3 rounded-lg border border-primary/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full min-w-0"
                        />
                      ) : (
                        <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {fmtDate(d.scheduledDate)}
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
                      {isFuture ? (
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-bold">
                          Scheduled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-green-50 text-green-700 text-[10px] sm:text-xs font-bold">
                          Published
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-start lg:justify-end gap-1.5 sm:gap-2">
                    {editingId === d.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                          title="Save"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(d)}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4 text-gray-500" />
                        </button>

                        <button
                          onClick={() => {
                            setReplacingId(d.id);
                            replaceInputRef.current?.click();
                          }}
                          disabled={replacingId === d.id}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Replace PDF"
                        >
                          {replacingId === d.id ? (
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-blue-500" />
                          )}
                        </button>

                        <button
                          onClick={() => setConfirmDeleteId(d.id)}
                          disabled={deletingId === d.id}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === d.id ? (
                            <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-50 flex items-center justify-center gap-1.5 sm:gap-3 flex-wrap">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 sm:h-10 px-2.5 sm:px-4 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => {
                    const isCurrentPage = pageNum === currentPage;
                    const isNear = Math.abs(pageNum - currentPage) <= 1;
                    const isEdge = pageNum === 1 || pageNum === totalPages;

                    if (!isCurrentPage && !isNear && !isEdge) {
                      if (pageNum === 2 || pageNum === totalPages - 1) {
                        return (
                          <span key={`ellipsis-${pageNum}`} className="px-1">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg font-semibold text-xs sm:text-sm transition-colors ${
                          isCurrentPage
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 sm:h-10 px-2.5 sm:px-4 rounded-lg border border-gray-200 bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Hidden replace input */}
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf"
        onChange={handleReplace}
        className="hidden"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl sm:rounded-3xl mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold text-gray-900">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-muted-foreground py-2 text-xs sm:text-sm">
              Are you sure you want to delete{" "}
              <span className="font-bold text-gray-900">
                &quot;{devotionals.find((d) => d.id === confirmDeleteId)?.title}
                &quot;
              </span>
              ? This action will permanently remove the PDF file and all
              associated metadata. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-end gap-2 sm:gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteId(null)}
              className="rounded-xl px-4 sm:px-6 h-10 sm:h-11 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="rounded-xl px-4 sm:px-6 h-10 sm:h-11 text-xs sm:text-sm bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
