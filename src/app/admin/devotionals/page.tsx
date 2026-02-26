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
} from "lucide-react";
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the PDF and all metadata."))
      return;

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Manage Devotionals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload, edit, and manage daily devotional PDFs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowUploadPanel(true)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
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
            <div className="rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden">
              <div className="h-1 bg-linear-to-r from-primary via-amber-400 to-primary" />

              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">
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
                  className="border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-2xl p-10 text-center cursor-pointer transition-colors group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-colors">
                    <Upload className="w-7 h-7 text-primary" />
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
                  <div className="mt-6 space-y-3">
                    {uploadQueue.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100"
                      >
                        <FileText className="w-5 h-5 text-primary shrink-0 hidden sm:block" />

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-center">
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
                            className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                          />

                          {/* Date input */}
                          <input
                            type="date"
                            value={item.scheduledDate}
                            onChange={(e) =>
                              updateQueueItem(index, {
                                scheduledDate: e.target.value,
                              })
                            }
                            disabled={item.status !== "pending"}
                            className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                          />

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
                        className="w-full h-12 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
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
      ) : devotionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-primary/40" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No devotionals yet
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Upload your first devotional PDF to get started.
          </p>
          <button
            onClick={() => setShowUploadPanel(true)}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Upload Devotional
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-gray-100 bg-white shadow-lg overflow-hidden">
          <div className="h-1 bg-linear-to-r from-primary via-amber-400 to-primary" />

          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_140px_100px_180px] gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>Title</span>
            <span>Scheduled</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-50">
            {devotionals.map((d) => {
              const isFuture = isScheduledFuture(d.scheduledDate);

              return (
                <motion.div
                  key={d.id}
                  layout
                  className="grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_180px] gap-3 sm:gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors"
                >
                  {/* Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-primary shrink-0" />
                    {editingId === d.id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 h-9 px-3 rounded-lg border border-primary/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {d.title}
                      </span>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    {editingId === d.id ? (
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="h-9 px-3 rounded-lg border border-primary/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    ) : (
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {fmtDate(d.scheduledDate)}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    {isFuture ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
                        Scheduled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                        Published
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2">
                    {editingId === d.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="w-9 h-9 rounded-xl bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                          title="Save"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(d)}
                          className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
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
                          className="w-9 h-9 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          title="Replace PDF"
                        >
                          {replacingId === d.id ? (
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 text-blue-500" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={deletingId === d.id}
                          className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
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
        </div>
      )}

      {/* Hidden replace input */}
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf"
        onChange={handleReplace}
        className="hidden"
      />
    </div>
  );
}
