"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  BarChart3,
  Users,
  Trophy,
  HelpCircle,
  BookOpen,
  BrainCircuit,
  Target,
  Clock,
  Download,
  Upload,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import type { QuizCategory, QuizQuestion } from "@/types/quiz";
import { showConfirm } from "@/components/shared/CustomDialog";
import {
  exportQuizAsJSON,
  exportQuizAsCSV,
  importQuizFromFile,
  downloadFile,
  setValidCategories,
} from "@/lib/quizImportExport";
import { StatCard } from "@/components/shared/StatCard";
import { QuestionModal } from "@/components/quiz/admin/QuestionModal";
import { AdminQuestionCard } from "@/components/quiz/admin/AdminQuestionCard";
import type { AdminStats, ActiveTab, ModalMode } from "@/components/quiz/admin/types";
import { DEFAULT_CATEGORIES } from "@/components/quiz/admin/types";

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
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full h-10 pl-11 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Search questions..."
              />
            </div>
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
                  <div className="space-y-3">
                    {Object.entries(stats.categoryStats).map(([cat, data]) => {
                      const pct =
                        data.total > 0
                          ? Math.round((data.correct / data.total) * 100)
                          : 0;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="font-medium text-gray-700">
                              {cat}
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {data.correct}/{data.total} correct ({pct}%)
                            </span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full ${
                                pct >= 70
                                  ? "bg-green-500"
                                  : pct >= 50
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              }`}
                            />
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
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
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
                        className="hover:bg-gray-50/50 transition-colors"
                      >
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
              className="flex gap-3"
            >
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="Enter category name..."
                maxLength={60}
                required
              />
              <button
                type="submit"
                disabled={creatingCategory || !newCategoryName.trim()}
                className="h-11 px-5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {creatingCategory ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {creatingCategory ? "Creating…" : "Create"}
              </button>
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
