"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  BarChart3,
  Users,
  Trophy,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  X,
  Save,
  BrainCircuit,
  Target,
  Clock,
  Download,
  Upload,
  Tags,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import type { QuizCategory, QuizQuestion } from "@/types/quiz";
import { showConfirm } from "@/components/shared/CustomDialog";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { ModalShell } from "@/components/shared/ModalShell";
import { SearchInput } from "@/components/shared/SearchInput";
import {
  exportQuizAsJSON,
  exportQuizAsCSV,
  importQuizFromFile,
  downloadFile,
  setValidCategories,
} from "@/lib/quizImportExport";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface AdminStats {
  totalPlayers: number;
  totalQuizzesTaken: number;
  totalAttempts: number;
  totalCorrect: number;
  avgScore: number;
  categoryStats: Record<string, { total: number; correct: number }>;
  recentSessions: {
    session_id: string;
    username: string;
    total_score: number;
    quizzes_taken: number;
    last_active: string;
    created_at: string;
  }[];
}

type ActiveTab = "questions" | "stats" | "players" | "categories";
type ModalMode = "create" | "edit" | null;

const DEFAULT_CATEGORIES: QuizCategory[] = [
  "Sunday Message",
  "Sunday School",
  "Bible Study",
  "Special Meeting",
  "Season of the Spirit",
];

// ──────────────────────────────────────────────
// Question Form Modal
// ──────────────────────────────────────────────

function QuestionModal({
  mode,
  question,
  onClose,
  onSave,
  saving,
  categories,
}: {
  mode: ModalMode;
  question: QuizQuestion | null;
  onClose: () => void;
  onSave: (data: Partial<QuizQuestion>) => void;
  saving: boolean;
  categories: QuizCategory[];
}) {
  const [formQuestion, setFormQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [category, setCategory] = useState<QuizCategory>("Sunday Message");
  const [sermonRef, setSermonRef] = useState("");
  const [explain, setExplain] = useState("");

  useEffect(() => {
    if (question && mode === "edit") {
      setFormQuestion(question.question);
      setOptions([...question.options]);
      setCorrectAnswer(question.correctAnswer);
      setCategory(question.category);
      setSermonRef(question.sermon_ref || "");
      setExplain(question.explain || "");
    } else {
      setFormQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
      setCategory("Sunday Message");
      setSermonRef("");
      setExplain("");
    }
  }, [question, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQ = formQuestion.trim();
    const trimmedOpts = options.map((o) => o.trim()).filter(Boolean);

    if (!trimmedQ) {
      toast.error("Question text is required");
      return;
    }
    if (trimmedOpts.length !== 4) {
      toast.error("Exactly 4 options are required");
      return;
    }
    if (correctAnswer >= trimmedOpts.length) {
      toast.error("Please select a valid correct answer");
      return;
    }

    const data: Partial<QuizQuestion> = {
      question: trimmedQ,
      options: trimmedOpts,
      correctAnswer,
      category,
    };
    if (sermonRef.trim()) data.sermon_ref = sermonRef.trim();
    if (explain.trim()) data.explain = explain.trim();
    if (mode === "edit" && question) data.id = question.id;

    onSave(data);
  };

  if (!mode) return null;

  return (
    <ModalShell onClose={onClose} className="max-w-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            {mode === "create" ? "Add Question" : "Edit Question"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Question text */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Question *
            </label>
            <textarea
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              placeholder="Enter the quiz question..."
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as QuizCategory)}
              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Answer Options * (click radio to mark correct)
            </label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectAnswer(idx)}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                      correctAnswer === idx
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                    title={
                      correctAnswer === idx
                        ? "Correct answer"
                        : "Mark as correct"
                    }
                  >
                    {correctAnswer === idx && (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const updated = [...options];
                      updated[idx] = e.target.value;
                      setOptions(updated);
                    }}
                    className="flex-1 h-10 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sermon reference (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sermon/Transcript Ref{" "}
              <span className="text-gray-400 font-normal">(optional slug)</span>
            </label>
            <input
              type="text"
              value={sermonRef}
              onChange={(e) => setSermonRef(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              placeholder="e.g. the-power-of-faith"
            />
          </div>

          {/* Explanation (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Explanation{" "}
              <span className="text-gray-400 font-normal">
                (shown after quiz completion)
              </span>
            </label>
            <textarea
              value={explain}
              onChange={(e) => setExplain(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              placeholder="Explain the correct answer and why other options are incorrect. This helps users learn from their mistakes."
            />
            <p className="mt-1 text-xs text-gray-500">
              {explain.length} characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving
                ? "Saving…"
                : mode === "create"
                  ? "Create Question"
                  : "Update Question"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-6 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </ModalShell>
  );
}

// ──────────────────────────────────────────────
// Question Card
// ──────────────────────────────────────────────

function AdminQuestionCard({
  question,
  onEdit,
  onDelete,
  deleting,
}: {
  question: QuizQuestion;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wide">
              {question.category}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onEdit}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors cursor-pointer"
              title="Edit question"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
              title="Delete question"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <p className="text-sm font-medium text-gray-900 leading-relaxed">
          {question.question}
        </p>

        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
          {expanded ? "Hide options" : "Show options"}
        </button>
      </div>

      {/* Options (collapsible) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-1.5">
              {question.options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                    idx === question.correctAnswer
                      ? "bg-green-50 text-green-800 font-semibold"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border border-current/20">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">{opt}</span>
                  {idx === question.correctAnswer && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  )}
                </div>
              ))}
              {question.sermon_ref && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  <BookOpen className="w-3 h-3 inline mr-1" />
                  Ref: {question.sermon_ref}
                </p>
              )}
              {question.explain && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-[11px] font-semibold text-gray-700 mb-1">
                    Explanation:
                  </p>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {question.explain}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ══════════════════════════════════════════════
// Main Admin Quiz Page
// ══════════════════════════════════════════════

export default function AdminQuizPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("questions");

  // Questions state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [filterCategory, setFilterCategory] = useState<QuizCategory | "all">(
    "all",
  );

  // Stats state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Player management state
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);
  const [resettingSecId, setResettingSecId] = useState<string | null>(null);
  // Bulk-action state (Players tab)
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set(),
  );
  const [bulkActing, setBulkActing] = useState<null | "remove" | "security">(
    null,
  );

  // Import/Export state
  const [importingFile, setImportingFile] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  // Categories state (dynamic from DB)
  const [categories, setCategories] =
    useState<QuizCategory[]>(DEFAULT_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(
    null,
  );
  const [dbCategories, setDbCategories] = useState<
    { id: string; name: string; created_at: string }[]
  >([]);

  // ── Fetch categories from DB ──
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/quiz/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: { id: string; name: string; created_at: string }[] =
        await res.json();
      setDbCategories(data);
      const names = data.map((c) => c.name);
      if (names.length > 0) {
        setCategories(names);
        setValidCategories(names);
      }
    } catch {
      // Fallback to defaults on error
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // ── Fetch questions ──
  const fetchQuestions = useCallback(async () => {
    setLoadingQ(true);
    try {
      const res = await fetch("/api/quiz/admin/questions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuestions(data);
    } catch {
      toast.error("Failed to load questions");
    } finally {
      setLoadingQ(false);
    }
  }, []);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/quiz/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data);
      setSelectedPlayerIds(new Set());
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
    fetchCategories();
  }, [fetchQuestions, fetchCategories]);

  useEffect(() => {
    if (activeTab === "stats" || activeTab === "players") {
      fetchStats();
    }
    if (activeTab === "categories") {
      fetchCategories();
    }
  }, [activeTab, fetchStats, fetchCategories]);

  // ── CRUD handlers ──
  const handleSave = async (data: Partial<QuizQuestion>) => {
    setSaving(true);
    try {
      if (modalMode === "create") {
        const res = await fetch("/api/quiz/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create");
        }
        toast.success("Question created!");
      } else if (modalMode === "edit") {
        const res = await fetch("/api/quiz/admin/questions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update");
        }
        toast.success("Question updated!");
      }
      setModalMode(null);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save question",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm(
      "Delete this question? This cannot be undone.",
      {
        title: "Delete Question",
        variant: "warning",
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
      },
    );
    if (!confirmed) return;
    setDeletingId(id);
    try {
      const res = await fetch(
        `/api/quiz/admin/questions?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Question deleted");
      fetchQuestions();
    } catch {
      toast.error("Failed to delete question");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Bulk player actions (Players tab) ──
  const togglePlayerSelected = (sessionId: string) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const toggleSelectAllPlayers = () => {
    const all = stats?.recentSessions.map((s) => s.session_id) ?? [];
    setSelectedPlayerIds((prev) =>
      prev.size === all.length && all.length > 0 ? new Set() : new Set(all),
    );
  };

  const handleBulkRemovePlayers = async () => {
    const ids = Array.from(selectedPlayerIds);
    if (ids.length === 0) return;
    const confirmed = await showConfirm(
      `Remove ${ids.length} selected player${ids.length !== 1 ? "s" : ""} and all their quiz data? This cannot be undone.`,
      {
        title: "Remove Selected Players",
        variant: "warning",
        confirmLabel: `Remove ${ids.length}`,
        cancelLabel: "Cancel",
      },
    );
    if (!confirmed) return;
    setBulkActing("remove");
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        const res = await fetch(
          `/api/quiz/admin/stats?session_id=${encodeURIComponent(id)}`,
          { method: "DELETE" },
        );
        if (res.ok) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    setBulkActing(null);
    if (ok > 0)
      toast.success(`Removed ${ok} player${ok !== 1 ? "s" : ""}`);
    if (fail > 0)
      toast.error(`Failed to remove ${fail} player${fail !== 1 ? "s" : ""}`);
    fetchStats();
  };

  const handleBulkResetSecurity = async () => {
    const ids = Array.from(selectedPlayerIds);
    if (ids.length === 0) return;
    const confirmed = await showConfirm(
      `Reset the security question for ${ids.length} selected player${ids.length !== 1 ? "s" : ""}? Each will be asked to set a new one, and the 30-day change limit is bypassed.`,
      {
        title: "Reset Security Questions",
        confirmLabel: `Reset ${ids.length}`,
        cancelLabel: "Cancel",
      },
    );
    if (!confirmed) return;
    setBulkActing("security");
    let ok = 0;
    let fail = 0;
    for (const id of ids) {
      try {
        const res = await fetch("/api/quiz/admin/security-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: id }),
        });
        if (res.ok) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    setBulkActing(null);
    setSelectedPlayerIds(new Set());
    if (ok > 0)
      toast.success(
        `Security question reset for ${ok} player${ok !== 1 ? "s" : ""}`,
      );
    if (fail > 0)
      toast.error(`Failed for ${fail} player${fail !== 1 ? "s" : ""}`);
  };

  // ── Export handlers ──
  const handleExport = (format: "json" | "csv") => {
    try {
      setExportingFormat(format);
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        content = exportQuizAsJSON(questions);
        filename = `quiz-questions-${new Date().toISOString().split("T")[0]}.json`;
        mimeType = "application/json";
      } else {
        content = exportQuizAsCSV(questions);
        filename = `quiz-questions-${new Date().toISOString().split("T")[0]}.csv`;
        mimeType = "text/csv";
      }

      downloadFile(content, filename, mimeType);
      toast.success(
        `Exported ${questions.length} questions as ${format.toUpperCase()}`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : `Failed to export as ${format}`,
      );
    } finally {
      setExportingFormat(null);
    }
  };

  // ── Import handler ──
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingFile(true);
    try {
      const importedQuestions = await importQuizFromFile(file);

      if (importedQuestions.length === 0) {
        toast.error("No valid questions found in file");
        return;
      }

      // Check for duplicates by matching question text
      const existingMap = new Map(
        questions.map((q) => [q.question.trim().toLowerCase(), q]),
      );

      const newQuestions = importedQuestions.filter(
        (q) => !existingMap.has(q.question.trim().toLowerCase()),
      );
      const duplicateQuestions = importedQuestions.filter((q) =>
        existingMap.has(q.question.trim().toLowerCase()),
      );

      // Build confirmation message
      const parts: string[] = [];
      if (newQuestions.length > 0)
        parts.push(
          `${newQuestions.length} new question${newQuestions.length !== 1 ? "s" : ""}`,
        );
      if (duplicateQuestions.length > 0)
        parts.push(
          `${duplicateQuestions.length} existing question${duplicateQuestions.length !== 1 ? "s" : ""} to update`,
        );

      const confirmed = await showConfirm(
        `Found ${parts.join(" and ")}. Proceed?`,
        {
          title: "Confirm Import",
          confirmLabel: "Import",
          cancelLabel: "Cancel",
        },
      );

      if (!confirmed) return;

      let addedCount = 0;
      let updatedCount = 0;
      let failedCount = 0;
      const failedErrors: string[] = [];

      // Add new questions
      for (const q of newQuestions) {
        try {
          const res = await fetch("/api/quiz/admin/questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(q),
          });
          if (res.ok) {
            addedCount++;
          } else {
            failedCount++;
            const errData = await res.json().catch(() => null);
            failedErrors.push(
              `"${q.question.slice(0, 30)}…" — ${errData?.error || `HTTP ${res.status}`}`,
            );
          }
        } catch (err) {
          failedCount++;
          failedErrors.push(
            `"${q.question.slice(0, 30)}…" — ${err instanceof Error ? err.message : "Network error"}`,
          );
        }
      }

      // Update existing questions (e.g. fill in missing explain field)
      for (const q of duplicateQuestions) {
        try {
          const existing = existingMap.get(q.question.trim().toLowerCase());
          if (!existing) continue;

          const res = await fetch("/api/quiz/admin/questions", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: existing.id,
              options: q.options,
              correctAnswer: q.correctAnswer,
              category: q.category,
              sermon_ref: q.sermon_ref,
              explain: q.explain,
            }),
          });
          if (res.ok) {
            updatedCount++;
          } else {
            failedCount++;
            const errData = await res.json().catch(() => null);
            failedErrors.push(
              `"${q.question.slice(0, 30)}…" — ${errData?.error || `HTTP ${res.status}`}`,
            );
          }
        } catch (err) {
          failedCount++;
          failedErrors.push(
            `"${q.question.slice(0, 30)}…" — ${err instanceof Error ? err.message : "Network error"}`,
          );
        }
      }

      if (addedCount > 0 || updatedCount > 0) {
        const msgs: string[] = [];
        if (addedCount > 0) msgs.push(`${addedCount} added`);
        if (updatedCount > 0) msgs.push(`${updatedCount} updated`);
        toast.success(`Import complete: ${msgs.join(", ")}`);
        fetchQuestions();
      }

      if (failedCount > 0) {
        const detail =
          failedErrors.length > 0
            ? `\n\n${failedErrors.join("\n")}${failedCount > 3 ? `\n...and ${failedCount - 3} more` : ""}`
            : "";
        toast.error(
          `${failedCount} question${failedCount !== 1 ? "s" : ""} failed to import.${detail}`,
          { duration: 10000 },
        );
      }

      if (addedCount === 0 && updatedCount === 0 && failedCount === 0) {
        toast.error(
          "No questions were processed from the file. Ensure it contains valid data in the expected format.",
          { duration: 8000 },
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to import questions",
        { duration: 8000 },
      );
    } finally {
      setImportingFile(false);
      // Reset file input
      e.target.value = "";
    }
  };

  // ── Filtered questions ──
  const filtered = questions.filter((q) => {
    if (filterCategory !== "all" && q.category !== filterCategory) return false;
    if (searchQ) {
      const s = searchQ.toLowerCase();
      return (
        q.question.toLowerCase().includes(s) ||
        q.options.some((o) => o.toLowerCase().includes(s))
      );
    }
    return true;
  });

  // ── Category counts ──
  const categoryCounts: Record<string, number> = {};
  for (const q of questions) {
    categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
  }

  // ══════════════════════════════════════════════
  // Tabs
  // ══════════════════════════════════════════════

  const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: "questions", label: "Questions", icon: HelpCircle },
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "players", label: "Players", icon: Users },
    { id: "categories", label: "Categories", icon: Tags },
  ];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-10 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Quiz Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, edit and manage quiz questions · View player stats
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Export buttons */}
          <div className="flex gap-1.5">
            <button
              onClick={() => handleExport("json")}
              disabled={questions.length === 0 || exportingFormat !== null}
              title="Export questions as JSON"
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {exportingFormat === "json" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              JSON
            </button>
            <button
              onClick={() => handleExport("csv")}
              disabled={questions.length === 0 || exportingFormat !== null}
              title="Export questions as CSV"
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {exportingFormat === "csv" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              CSV
            </button>
          </div>

          {/* Import button */}
          <label className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            {importingFile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import
              </>
            )}
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImport}
              disabled={importingFile}
              className="hidden"
              title="Import questions from JSON or CSV"
            />
          </label>

          {/* Add question button */}
          <button
            onClick={() => {
              setModalMode("create");
              setEditingQuestion(null);
            }}
            className="h-10 px-5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Questions"
          value={questions.length}
          icon={HelpCircle}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Categories"
          value={Object.keys(categoryCounts).length}
          icon={BookOpen}
          color="bg-purple-50 text-purple-600"
        />
        <StatCard
          label="Players"
          value={stats?.totalPlayers || "–"}
          icon={Users}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Avg Score"
          value={stats?.avgScore !== undefined ? `${stats.avgScore}%` : "–"}
          icon={Target}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Tabs */}
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="inline-flex min-w-full sm:min-w-0 gap-1 bg-gray-100 rounded-xl p-1 sm:w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer min-w-28 sm:min-w-0 ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* TAB: Questions                          */}
      {/* ════════════════════════════════════════ */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput
              value={searchQ}
              onChange={setSearchQ}
              placeholder="Search questions..."
              wrapperClassName="flex-1"
              className="h-10 pl-11 pr-4 focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <select
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(e.target.value as QuizCategory | "all")
              }
              className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
            >
              <option value="all">All Categories ({questions.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c} ({categoryCounts[c] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Questions list */}
          {loadingQ ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading questions…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <HelpCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                {questions.length === 0
                  ? 'No questions yet. Click "Add Question" to create one.'
                  : "No questions match your search."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filtered.map((q) => (
                <AdminQuestionCard
                  key={q.id}
                  question={q}
                  onEdit={() => {
                    setEditingQuestion(q);
                    setModalMode("edit");
                  }}
                  onDelete={() => handleDelete(q.id)}
                  deleting={deletingId === q.id}
                />
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center pt-2">
            Showing {filtered.length} of {questions.length} questions
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* TAB: Stats                              */}
      {/* ════════════════════════════════════════ */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          {loadingStats ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading stats…</span>
            </div>
          ) : stats ? (
            <>
              {/* Overview cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Total Players"
                  value={stats.totalPlayers}
                  icon={Users}
                  color="bg-blue-50 text-blue-600"
                />
                <StatCard
                  label="Quizzes Taken"
                  value={stats.totalQuizzesTaken}
                  icon={BrainCircuit}
                  color="bg-purple-50 text-purple-600"
                />
                <StatCard
                  label="Total Answers"
                  value={stats.totalAttempts}
                  icon={HelpCircle}
                  color="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                  label="Avg Score"
                  value={`${stats.avgScore}%`}
                  icon={Target}
                  color="bg-amber-50 text-amber-600"
                />
              </div>

              {/* Category breakdown */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Performance by Category
                </h3>
                {Object.keys(stats.categoryStats).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(stats.categoryStats)
                      .map(([cat, data]) => ({
                        cat,
                        correct: data.correct,
                        total: data.total,
                        pct:
                          data.total > 0
                            ? Math.round((data.correct / data.total) * 100)
                            : 0,
                      }))
                      .sort((a, b) => b.pct - a.pct)
                      .map(({ cat, correct, total, pct }) => {
                        const tone =
                          pct >= 70
                            ? {
                                ring: "#22c55e",
                                badge: "bg-emerald-50 text-emerald-600",
                                label: "Strong",
                              }
                            : pct >= 50
                              ? {
                                  ring: "#f59e0b",
                                  badge: "bg-amber-50 text-amber-600",
                                  label: "Fair",
                                }
                              : {
                                  ring: "#ef4444",
                                  badge: "bg-red-50 text-red-600",
                                  label: "Needs work",
                                };
                        const radius = 26;
                        const circ = 2 * Math.PI * radius;
                        return (
                          <div
                            key={cat}
                            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-linear-to-br from-white to-gray-50/60 p-4 hover:shadow-md hover:border-gray-200 transition-all"
                          >
                            {/* Circular progress ring */}
                            <div className="relative shrink-0 w-16 h-16">
                              <svg
                                viewBox="0 0 64 64"
                                className="w-16 h-16 -rotate-90"
                              >
                                <circle
                                  cx="32"
                                  cy="32"
                                  r={radius}
                                  fill="none"
                                  stroke="#f1f5f9"
                                  strokeWidth="6"
                                />
                                <motion.circle
                                  cx="32"
                                  cy="32"
                                  r={radius}
                                  fill="none"
                                  stroke={tone.ring}
                                  strokeWidth="6"
                                  strokeLinecap="round"
                                  strokeDasharray={circ}
                                  initial={{ strokeDashoffset: circ }}
                                  animate={{
                                    strokeDashoffset: circ * (1 - pct / 100),
                                  }}
                                  transition={{ duration: 0.9, ease: "easeOut" }}
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                                {pct}%
                              </span>
                            </div>

                            {/* Category info */}
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {cat}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {correct} of {total} correct
                              </p>
                              <span
                                className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${tone.badge}`}
                              >
                                {tone.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Reset Stats */}
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 sm:p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-500" />
                  Reset Stats
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  This will permanently delete all quiz attempt records. Player
                  accounts will remain but their scores will be cleared.
                </p>
                <button
                  onClick={async () => {
                    const confirmed = await showConfirm(
                      "Are you sure you want to reset all quiz stats? This will delete all quiz attempt records and reset scores. This action cannot be undone.",
                      {
                        title: "Reset All Stats",
                        confirmLabel: "Reset Stats",
                        cancelLabel: "Cancel",
                      },
                    );
                    if (!confirmed) return;
                    try {
                      const res = await fetch(
                        "/api/quiz/admin/stats?target=all",
                        { method: "DELETE" },
                      );
                      if (res.ok) {
                        toast.success(
                          "All stats and player data have been reset",
                        );
                        fetchStats();
                      } else {
                        const err = await res.json().catch(() => null);
                        toast.error(err?.error || "Failed to reset stats");
                      }
                    } catch {
                      toast.error("Failed to reset stats");
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset All Stats
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">
              Failed to load stats.
            </p>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* TAB: Players                            */}
      {/* ════════════════════════════════════════ */}
      {activeTab === "players" && (
        <div className="space-y-4">
          {loadingStats ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading players…</span>
            </div>
          ) : stats && stats.recentSessions.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Recent Players
                </h3>
                <button
                  onClick={async () => {
                    const confirmed = await showConfirm(
                      "Are you sure you want to remove all players and their stats? This will delete all player sessions and quiz attempts. This action cannot be undone.",
                      {
                        title: "Remove All Players",
                        confirmLabel: "Remove All",
                        cancelLabel: "Cancel",
                      },
                    );
                    if (!confirmed) return;
                    try {
                      const res = await fetch(
                        "/api/quiz/admin/stats?target=players",
                        { method: "DELETE" },
                      );
                      if (res.ok) {
                        toast.success("All players and stats have been reset");
                        fetchStats();
                      } else {
                        const err = await res.json().catch(() => null);
                        toast.error(err?.error || "Failed to remove players");
                      }
                    } catch {
                      toast.error("Failed to remove players");
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove All
                </button>
              </div>

              {/* Bulk action toolbar — shown when one or more players selected */}
              <AnimatePresence>
                {selectedPlayerIds.size > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-primary/5 border-b border-primary/10"
                  >
                    <div className="px-5 py-3 flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-gray-700">
                        {selectedPlayerIds.size} selected
                      </span>
                      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                        <button
                          onClick={handleBulkResetSecurity}
                          disabled={bulkActing !== null}
                          className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {bulkActing === "security" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <KeyRound className="w-3.5 h-3.5" />
                          )}
                          Reset Security
                        </button>
                        <button
                          onClick={handleBulkRemovePlayers}
                          disabled={bulkActing !== null}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {bulkActing === "remove" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Remove Selected
                        </button>
                        <button
                          onClick={() => setSelectedPlayerIds(new Set())}
                          disabled={bulkActing !== null}
                          className="px-3 py-1.5 rounded-lg text-gray-500 text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label="Select all players"
                          checked={
                            selectedPlayerIds.size > 0 &&
                            selectedPlayerIds.size ===
                              stats.recentSessions.length
                          }
                          onChange={toggleSelectAllPlayers}
                          className="w-4 h-4 accent-primary cursor-pointer align-middle"
                        />
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Player
                      </th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Score
                      </th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Quizzes
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Last Active
                      </th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.recentSessions.map((s, idx) => (
                      <tr
                        key={s.session_id}
                        className={`transition-colors ${
                          selectedPlayerIds.has(s.session_id)
                            ? "bg-primary/5"
                            : "hover:bg-gray-50/50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            aria-label={`Select ${s.username}`}
                            checked={selectedPlayerIds.has(s.session_id)}
                            onChange={() => togglePlayerSelected(s.session_id)}
                            className="w-4 h-4 accent-primary cursor-pointer align-middle"
                          />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                idx === 0
                                  ? "bg-amber-100 text-amber-700"
                                  : idx === 1
                                    ? "bg-gray-100 text-gray-600"
                                    : idx === 2
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-primary/5 text-primary"
                              }`}
                            >
                              {idx < 3 ? (
                                <Trophy className="w-3.5 h-3.5" />
                              ) : (
                                s.username.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="font-medium text-gray-900">
                              {s.username}
                            </span>
                          </div>
                        </td>
                        <td className="text-center px-3 py-3 font-semibold text-gray-900">
                          {s.total_score}
                        </td>
                        <td className="text-center px-3 py-3 text-muted-foreground">
                          {s.quizzes_taken}
                        </td>
                        <td className="text-right px-5 py-3 text-xs text-muted-foreground">
                          <span className="flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(s.last_active).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </td>
                        <td className="text-center px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                          <button
                            disabled={resettingSecId === s.session_id}
                            onClick={async () => {
                              const confirmed = await showConfirm(
                                `Reset the security question for "${s.username}"? They'll be asked to set a new one, and the 30-day change limit is bypassed. Use this when a player is locked out.`,
                                {
                                  title: "Reset Security Question",
                                  confirmLabel: "Reset",
                                  cancelLabel: "Cancel",
                                },
                              );
                              if (!confirmed) return;
                              setResettingSecId(s.session_id);
                              try {
                                const res = await fetch(
                                  "/api/quiz/admin/security-reset",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      session_id: s.session_id,
                                    }),
                                  },
                                );
                                if (res.ok) {
                                  toast.success(
                                    `Security question reset for ${s.username}`,
                                  );
                                } else {
                                  const err = await res.json().catch(() => null);
                                  toast.error(
                                    err?.error || "Failed to reset",
                                  );
                                }
                              } catch {
                                toast.error("Failed to reset security question");
                              } finally {
                                setResettingSecId(null);
                              }
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title={`Reset security question for ${s.username}`}
                          >
                            {resettingSecId === s.session_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            disabled={deletingPlayerId === s.session_id}
                            onClick={async () => {
                              const confirmed = await showConfirm(
                                `Remove player "${s.username}" and all their quiz data? This cannot be undone.`,
                                {
                                  title: "Remove Player",
                                  confirmLabel: "Remove",
                                  cancelLabel: "Cancel",
                                },
                              );
                              if (!confirmed) return;
                              setDeletingPlayerId(s.session_id);
                              try {
                                const res = await fetch(
                                  `/api/quiz/admin/stats?session_id=${encodeURIComponent(s.session_id)}`,
                                  { method: "DELETE" },
                                );
                                if (res.ok) {
                                  toast.success(`Removed ${s.username}`);
                                  fetchStats();
                                } else {
                                  const err = await res
                                    .json()
                                    .catch(() => null);
                                  toast.error(
                                    err?.error || "Failed to remove player",
                                  );
                                }
                              } catch {
                                toast.error("Failed to remove player");
                              } finally {
                                setDeletingPlayerId(null);
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title={`Remove ${s.username}`}
                          >
                            {deletingPlayerId === s.session_id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                No players yet. Share the quiz to get started!
              </p>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* TAB: Categories                         */}
      {/* ════════════════════════════════════════ */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {/* Create new category */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Create New Category
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const name = newCategoryName.trim();
                if (!name) return;
                setCreatingCategory(true);
                try {
                  const res = await fetch("/api/quiz/admin/categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name }),
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to create category");
                  }
                  toast.success(`Category "${name}" created!`);
                  setNewCategoryName("");
                  fetchCategories();
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Failed to create category",
                  );
                } finally {
                  setCreatingCategory(false);
                }
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full sm:flex-1 h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Enter category name..."
                maxLength={60}
                required
              />
              <Button
                type="submit"
                variant="brand"
                size="pill"
                disabled={creatingCategory || !newCategoryName.trim()}
                className="w-full sm:w-auto"
              >
                {creatingCategory ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {creatingCategory ? "Creating…" : "Create"}
              </Button>
            </form>
          </div>

          {/* Existing categories */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Tags className="w-4 h-4 text-primary" />
              Existing Categories ({dbCategories.length})
            </h3>
            {loadingCategories ? (
              <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Loading categories…</span>
              </div>
            ) : dbCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">
                No categories found. Create one above.
              </p>
            ) : (
              <div className="space-y-2">
                {dbCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wide shrink-0">
                        {cat.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {categoryCounts[cat.name] || 0} question
                        {(categoryCounts[cat.name] || 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">
                        Added{" "}
                        {new Date(cat.created_at).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <button
                        disabled={deletingCategoryId === cat.id}
                        onClick={async () => {
                          const qCount = categoryCounts[cat.name] || 0;
                          const msg =
                            qCount > 0
                              ? `Delete category "${cat.name}"? There are ${qCount} question(s) using this category. The questions will remain but may need to be recategorized.`
                              : `Delete category "${cat.name}"? This cannot be undone.`;
                          const confirmed = await showConfirm(msg, {
                            title: "Delete Category",
                            variant: "warning",
                            confirmLabel: "Delete",
                            cancelLabel: "Cancel",
                          });
                          if (!confirmed) return;
                          setDeletingCategoryId(cat.id);
                          try {
                            const res = await fetch(
                              `/api/quiz/admin/categories?id=${encodeURIComponent(cat.id)}`,
                              { method: "DELETE" },
                            );
                            if (!res.ok) throw new Error("Failed to delete");
                            toast.success(`Category "${cat.name}" deleted`);
                            fetchCategories();
                          } catch {
                            toast.error("Failed to delete category");
                          } finally {
                            setDeletingCategoryId(null);
                          }
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
                        title={`Delete ${cat.name}`}
                      >
                        {deletingCategoryId === cat.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Question Modal ── */}
      <AnimatePresence>
        {modalMode && (
          <QuestionModal
            mode={modalMode}
            question={editingQuestion}
            onClose={() => {
              setModalMode(null);
              setEditingQuestion(null);
            }}
            onSave={handleSave}
            saving={saving}
            categories={categories}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
