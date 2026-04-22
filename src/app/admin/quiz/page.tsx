"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  BarChart3,
  Users,
  Trophy,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  X,
  Save,
  BrainCircuit,
  Target,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { QuizCategory, QuizQuestion } from "@/types/quiz";

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

type ActiveTab = "questions" | "stats" | "players";
type ModalMode = "create" | "edit" | null;

const CATEGORIES: QuizCategory[] = [
  "Sunday Message",
  "Sunday School",
  "Bible Study",
  "Special Meeting",
];

const DIFFICULTIES = ["easy", "medium", "hard"] as const;

// ──────────────────────────────────────────────
// Stat Card
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
        <p className="text-[9px] sm:text-xs text-muted-foreground font-medium uppercase tracking-tight truncate">
          {label}
        </p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Question Form Modal
// ──────────────────────────────────────────────

function QuestionModal({
  mode,
  question,
  onClose,
  onSave,
  saving,
}: {
  mode: ModalMode;
  question: QuizQuestion | null;
  onClose: () => void;
  onSave: (data: Partial<QuizQuestion>) => void;
  saving: boolean;
}) {
  const [formQuestion, setFormQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [category, setCategory] = useState<QuizCategory>("Sunday Message");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [sermonRef, setSermonRef] = useState("");

  useEffect(() => {
    if (question && mode === "edit") {
      setFormQuestion(question.question);
      setOptions([...question.options]);
      setCorrectAnswer(question.correctAnswer);
      setCategory(question.category);
      setDifficulty(question.difficulty || "medium");
      setSermonRef(question.sermon_ref || "");
    } else {
      setFormQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
      setCategory("Sunday Message");
      setDifficulty("medium");
      setSermonRef("");
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
    if (trimmedOpts.length < 2) {
      toast.error("At least 2 options are required");
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
      difficulty,
    };
    if (sermonRef.trim()) data.sermon_ref = sermonRef.trim();
    if (mode === "edit" && question) data.id = question.id;

    onSave(data);
  };

  const addOption = () => {
    if (options.length < 6) setOptions([...options, ""]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    if (correctAnswer >= updated.length) setCorrectAnswer(0);
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
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100"
      >
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

          {/* Category + Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as QuizCategory)}
                className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as "easy" | "medium" | "hard")
                }
                className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
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
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 text-xs text-primary hover:text-primary/80 font-semibold cursor-pointer"
              >
                + Add another option
              </button>
            )}
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
      </motion.div>
    </div>
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

  const difficultyColor = {
    easy: "bg-green-50 text-green-700",
    medium: "bg-amber-50 text-amber-700",
    hard: "bg-red-50 text-red-700",
  };

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
            {question.difficulty && (
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide ${difficultyColor[question.difficulty]}`}
              >
                {question.difficulty}
              </span>
            )}
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
  }, [fetchQuestions]);

  useEffect(() => {
    if (activeTab === "stats" || activeTab === "players") {
      fetchStats();
    }
  }, [activeTab, fetchStats]);

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
    if (!confirm("Delete this question? This cannot be undone.")) return;
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
        <button
          onClick={() => {
            setModalMode("create");
            setEditingQuestion(null);
          }}
          className="h-10 px-5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
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
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
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
              {CATEGORIES.map((c) => (
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
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Recent Players
                </h3>
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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
