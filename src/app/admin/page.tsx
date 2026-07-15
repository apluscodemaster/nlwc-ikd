"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  RefreshCw,
  Download,
  Church,
  FileText,
  BookOpen,
  MessageCircleHeart,
  BrainCircuit,
  Calendar,
  Users,
  Target,
  Mic2,
  Layers,
  Clock,
  CheckCircle2,
  FileDown,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { downloadFile } from "@/lib/quizImportExport";
import {
  useDashboardData,
  type DashboardData,
} from "@/components/admin/dashboard/useDashboardData";
import {
  Donut,
  HBars,
  Columns,
  LineArea,
  Sparkline,
  MeterRows,
  SERIES,
  STATUS,
  compact,
} from "@/components/admin/dashboard/charts";

// ──────────────────────────────────────────────
// Section + range config
// ──────────────────────────────────────────────
type Section =
  | "overview"
  | "content"
  | "quiz"
  | "testimonies"
  | "devotionals"
  | "schedule";

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "content", label: "Content", icon: Church },
  { id: "quiz", label: "Quiz", icon: BrainCircuit },
  { id: "testimonies", label: "Testimonies", icon: MessageCircleHeart },
  { id: "devotionals", label: "Devotionals", icon: BookOpen },
  { id: "schedule", label: "Schedule", icon: Calendar },
];

type Range = "7d" | "30d" | "90d" | "12mo";
const RANGES: { id: Range; label: string }[] = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "12mo", label: "12 months" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ──────────────────────────────────────────────
// Time-series bucketing
// ──────────────────────────────────────────────
function seriesFor(dates: number[], range: Range) {
  if (range === "12mo") {
    const now = new Date();
    const buckets = Array.from({ length: 12 }, (_, idx) => {
      const i = 11 - idx;
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        key: `${dt.getFullYear()}-${dt.getMonth()}`,
        label: dt.toLocaleDateString(undefined, { month: "short" }),
        value: 0,
      };
    });
    const map = new Map(buckets.map((b) => [b.key, b]));
    for (const t of dates) {
      const dt = new Date(t);
      const b = map.get(`${dt.getFullYear()}-${dt.getMonth()}`);
      if (b) b.value++;
    }
    return buckets;
  }
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, idx) => {
    const i = days - 1 - idx;
    const dt = new Date(start);
    dt.setDate(start.getDate() - i);
    return {
      key: dt.toDateString(),
      label: `${dt.getDate()}/${dt.getMonth() + 1}`,
      value: 0,
    };
  });
  const map = new Map(buckets.map((b) => [b.key, b]));
  for (const t of dates) {
    const dt = new Date(t);
    dt.setHours(0, 0, 0, 0);
    const b = map.get(dt.toDateString());
    if (b) b.value++;
  }
  return buckets;
}

// ──────────────────────────────────────────────
// Downloadable analytics
// ──────────────────────────────────────────────
function buildSummaryRows(d: DashboardData): [string, string | number][] {
  const t = d.testimonies;
  const rows: [string, string | number][] = [
    ["Sermons", d.content.sermons],
    ["Transcripts", d.content.transcripts],
    ["Manuals", d.content.manuals],
    ["Ministers", d.content.speakers.length],
    ["Series", d.content.series.length],
    ["Quiz players", d.quiz?.totalPlayers ?? 0],
    ["Quizzes taken", d.quiz?.totalQuizzesTaken ?? 0],
    ["Quiz answers", d.quiz?.totalAttempts ?? 0],
    ["Quiz avg score %", d.quiz?.avgScore ?? 0],
    ["Testimonies total", t.length],
    ["Testimonies pending", t.filter((x) => x.status === "pending").length],
    ["Testimonies verified", t.filter((x) => x.status === "verified").length],
    ["Testimonies rejected", t.filter((x) => x.status === "rejected").length],
    ["Devotionals total", d.devotionals.length],
    ["Devotionals scheduled", d.devotionals.filter((x) => x.scheduled).length],
    ["Recurring services", d.schedule.recurring.length],
    ["Recurring active", d.schedule.recurring.filter((x) => x.active).length],
    ["Special events", d.schedule.special.length],
  ];
  return rows;
}

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function AdminDashboardPage() {
  const { data, loading, refreshing, error, lastUpdated, refresh } =
    useDashboardData();
  const [section, setSection] = useState<Section>("overview");
  const [range, setRange] = useState<Range>("30d");
  const [exportOpen, setExportOpen] = useState(false);

  // ── derived time series ───────────────────────────────────────────────────
  const testimonySeries = useMemo(
    () => seriesFor(data.testimonies.map((t) => t.createdAt), range),
    [data.testimonies, range],
  );
  const playerSeries = useMemo(
    () =>
      seriesFor(
        (data.quiz?.allSessions ?? []).map((s) =>
          new Date(s.created_at).getTime(),
        ),
        range,
      ),
    [data.quiz, range],
  );
  const devotionalSeries = useMemo(
    () => seriesFor(data.devotionals.map((d) => d.date), range),
    [data.devotionals, range],
  );

  const testimonySpark = useMemo(
    () => seriesFor(data.testimonies.map((t) => t.createdAt), "12mo").map((b) => b.value),
    [data.testimonies],
  );
  const playerSpark = useMemo(
    () =>
      seriesFor(
        (data.quiz?.allSessions ?? []).map((s) => new Date(s.created_at).getTime()),
        "12mo",
      ).map((b) => b.value),
    [data.quiz],
  );

  // ── content ───────────────────────────────────────────────────────────────
  const totalContent =
    data.content.sermons + data.content.transcripts + data.content.manuals;

  const contentMix = [
    { label: "Sermons", value: data.content.sermons, color: SERIES[0] },
    { label: "Transcripts", value: data.content.transcripts, color: SERIES[1] },
    { label: "Manuals", value: data.content.manuals, color: SERIES[2] },
  ];

  const topSpeakers = useMemo(
    () =>
      [...data.content.speakers]
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 8)
        .map((s) => ({ label: s.name, value: s.messageCount })),
    [data.content.speakers],
  );
  const topSeries = useMemo(
    () =>
      [...data.content.series]
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 8)
        .map((s) => ({ label: s.title, value: s.messageCount })),
    [data.content.series],
  );

  // ── testimonies ───────────────────────────────────────────────────────────
  const tStatus = [
    {
      label: "Verified",
      value: data.testimonies.filter((t) => t.status === "verified").length,
      color: STATUS.good,
    },
    {
      label: "Pending",
      value: data.testimonies.filter((t) => t.status === "pending").length,
      color: STATUS.warning,
    },
    {
      label: "Rejected",
      value: data.testimonies.filter((t) => t.status === "rejected").length,
      color: STATUS.critical,
    },
  ];
  const tVisibility = [
    {
      label: "Public",
      value: data.testimonies.filter((t) => t.displayPreference === "public").length,
      color: SERIES[0],
    },
    {
      label: "Private",
      value: data.testimonies.filter((t) => t.displayPreference === "private").length,
      color: SERIES[4],
    },
  ];

  // ── quiz ──────────────────────────────────────────────────────────────────
  const quizCategoryAccuracy = useMemo(() => {
    const cs = data.quiz?.categoryStats ?? {};
    return Object.entries(cs)
      .map(([label, v]) => ({
        label,
        value: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
        sub: `${v.correct}/${v.total}`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data.quiz]);

  const quizCategoryVolume = useMemo(() => {
    const cs = data.quiz?.categoryStats ?? {};
    return Object.entries(cs)
      .map(([label, v], i) => ({
        label,
        value: v.total,
        color: SERIES[i % SERIES.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [data.quiz]);

  const topPlayers = useMemo(
    () =>
      [...(data.quiz?.allSessions ?? [])]
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 8)
        .map((s) => ({ label: s.username, value: s.total_score })),
    [data.quiz],
  );

  // ── devotionals ───────────────────────────────────────────────────────────
  const devoStatus = [
    {
      label: "Published",
      value: data.devotionals.filter((d) => !d.scheduled).length,
      color: STATUS.good,
    },
    {
      label: "Scheduled",
      value: data.devotionals.filter((d) => d.scheduled).length,
      color: STATUS.warning,
    },
  ];

  // ── schedule ──────────────────────────────────────────────────────────────
  const recurringByDay = useMemo(() => {
    const counts = new Array(7).fill(0);
    for (const s of data.schedule.recurring) {
      if (typeof s.dayOfWeek === "number") counts[s.dayOfWeek]++;
    }
    return DAY_NAMES.map((label, i) => ({ label, value: counts[i] }));
  }, [data.schedule.recurring]);

  const scheduleByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of [...data.schedule.recurring, ...data.schedule.special]) {
      const c = s.category || "Uncategorized";
      map[c] = (map[c] || 0) + 1;
    }
    return Object.entries(map)
      .map(([label, value], i) => ({
        label,
        value,
        color: SERIES[i % SERIES.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [data.schedule]);

  // ── exports ───────────────────────────────────────────────────────────────
  const handleExport = (fmt: "csv" | "json") => {
    const stamp = new Date().toISOString().split("T")[0];
    if (fmt === "csv") {
      const rows = buildSummaryRows(data);
      const csv = [
        "Metric,Value",
        ...rows.map(([k, v]) => `${csvEscape(k)},${csvEscape(v)}`),
        "",
        "Top Ministers,Messages",
        ...topSpeakers.map((s) => `${csvEscape(s.label)},${s.value}`),
        "",
        "Quiz Category,Accuracy %,Answers",
        ...quizCategoryAccuracy.map(
          (c) => `${csvEscape(c.label)},${c.value},${c.sub}`,
        ),
      ].join("\n");
      downloadFile(csv, `nlwc-analytics-${stamp}.csv`, "text/csv");
    } else {
      const snapshot = {
        generatedAt: new Date().toISOString(),
        summary: Object.fromEntries(buildSummaryRows(data)),
        content: data.content,
        quiz: data.quiz,
        testimonies: {
          total: data.testimonies.length,
          byStatus: Object.fromEntries(tStatus.map((s) => [s.label, s.value])),
        },
        devotionals: {
          total: data.devotionals.length,
          scheduled: data.devotionals.filter((d) => d.scheduled).length,
        },
        schedule: {
          recurring: data.schedule.recurring.length,
          special: data.schedule.special.length,
        },
      };
      downloadFile(
        JSON.stringify(snapshot, null, 2),
        `nlwc-analytics-${stamp}.json`,
        "application/json",
      );
    }
    setExportOpen(false);
    toast.success(`Analytics exported as ${fmt.toUpperCase()}`);
  };

  const showTimeFilter =
    section === "overview" ||
    section === "testimonies" ||
    section === "quiz" ||
    section === "devotionals";

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const pendingTestimonies = data.testimonies.filter(
    (t) => t.status === "pending",
  ).length;

  return (
    <div className="mx-auto max-w-[1600px] p-3 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-amber-500 shadow-lg shadow-primary/20">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Admin Dashboard
            </h1>
            <p className="text-xs text-gray-500 sm:text-sm">
              Analytics across all sections
              {lastUpdated > 0 && (
                <span className="ml-1 text-gray-400">
                  · updated{" "}
                  {new Date(lastUpdated).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-100 px-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {exportOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl">
                  <button
                    onClick={() => handleExport("csv")}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileDown className="h-4 w-4 text-emerald-500" />
                    Download CSV
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <FileDown className="h-4 w-4 text-blue-500" />
                    Download JSON
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi
          icon={FileText}
          label="Content items"
          value={compact(totalContent)}
          tint="bg-blue-50 text-blue-600"
          loading={loading}
        />
        <Kpi
          icon={Users}
          label="Quiz players"
          value={compact(data.quiz?.totalPlayers ?? 0)}
          tint="bg-emerald-50 text-emerald-600"
          spark={playerSpark}
          sparkColor={SERIES[1]}
          loading={loading}
        />
        <Kpi
          icon={MessageCircleHeart}
          label="Testimonies"
          value={compact(data.testimonies.length)}
          sub={pendingTestimonies > 0 ? `${pendingTestimonies} pending` : undefined}
          tint="bg-amber-50 text-amber-600"
          spark={testimonySpark}
          sparkColor={SERIES[7]}
          loading={loading}
        />
        <Kpi
          icon={BookOpen}
          label="Devotionals"
          value={compact(data.devotionals.length)}
          tint="bg-purple-50 text-purple-600"
          loading={loading}
        />
        <Kpi
          icon={Calendar}
          label="Active services"
          value={compact(data.schedule.recurring.filter((s) => s.active).length)}
          tint="bg-rose-50 text-rose-600"
          loading={loading}
        />
      </div>

      {/* ── Filters row ── */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 min-w-0 overflow-x-auto px-1 pb-1">
          <div className="flex w-max items-center gap-1 rounded-2xl bg-gray-100/80 p-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition-all sm:text-sm ${
                  section === s.id
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {showTimeFilter && (
          <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:shrink-0 lg:overflow-visible lg:px-0 lg:pb-0">
            <div className="flex w-max items-center gap-1 rounded-xl bg-gray-100 p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    range === r.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-gray-100 bg-white"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* ══════════ OVERVIEW ══════════ */}
          {section === "overview" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Content mix" subtitle="Published items by type" icon={Church}>
                <Donut
                  data={contentMix}
                  centerValue={compact(totalContent)}
                  centerLabel="items"
                />
              </Card>
              <Card
                title="Testimony status"
                subtitle="Verification pipeline"
                icon={MessageCircleHeart}
              >
                <Donut
                  data={tStatus}
                  centerValue={data.testimonies.length}
                  centerLabel="total"
                />
              </Card>
              <Card
                title="New players"
                subtitle={`Quiz sign-ups · last ${RANGES.find((r) => r.id === range)?.label}`}
                icon={Users}
              >
                <LineArea data={playerSeries} color={SERIES[1]} unit="players" />
              </Card>
              <Card
                title="Testimony submissions"
                subtitle={`Last ${RANGES.find((r) => r.id === range)?.label}`}
                icon={MessageCircleHeart}
              >
                <LineArea data={testimonySeries} color={SERIES[7]} unit="testimonies" />
              </Card>
              <Card
                title="Quiz accuracy by category"
                subtitle="Correct answer rate"
                icon={Target}
              >
                <MeterRows data={quizCategoryAccuracy} />
              </Card>
              <Card
                title="Top ministers"
                subtitle="By number of messages"
                icon={Mic2}
              >
                <HBars data={topSpeakers} color={SERIES[0]} unit="messages" />
              </Card>
            </div>
          )}

          {/* ══════════ CONTENT ══════════ */}
          {section === "content" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Content library" subtitle="Total items by type" icon={Layers}>
                <Columns
                  data={[
                    { label: "Sermons", value: data.content.sermons, color: SERIES[0] },
                    { label: "Transcripts", value: data.content.transcripts, color: SERIES[1] },
                    { label: "Manuals", value: data.content.manuals, color: SERIES[2] },
                    { label: "Devotionals", value: data.devotionals.length, color: SERIES[4] },
                  ]}
                  unit="items"
                />
              </Card>
              <Card title="Content mix" subtitle="Share by type" icon={Church}>
                <Donut
                  data={contentMix}
                  centerValue={compact(totalContent)}
                  centerLabel="items"
                />
              </Card>
              <Card title="Top ministers" subtitle="By number of messages" icon={Mic2}>
                <HBars data={topSpeakers} color={SERIES[0]} unit="messages" />
              </Card>
              <Card title="Top series" subtitle="Messages per series" icon={Layers}>
                <HBars data={topSeries} color={SERIES[1]} unit="messages" />
              </Card>
            </div>
          )}

          {/* ══════════ QUIZ ══════════ */}
          {section === "quiz" && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Players" value={compact(data.quiz?.totalPlayers ?? 0)} />
                <MiniStat label="Quizzes taken" value={compact(data.quiz?.totalQuizzesTaken ?? 0)} />
                <MiniStat label="Answers" value={compact(data.quiz?.totalAttempts ?? 0)} />
                <MiniStat label="Avg score" value={`${data.quiz?.avgScore ?? 0}%`} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Accuracy by category" subtitle="Correct answer rate" icon={Target}>
                  <MeterRows data={quizCategoryAccuracy} />
                </Card>
                <Card title="Answers by category" subtitle="Question volume" icon={BrainCircuit}>
                  <HBars data={quizCategoryVolume} unit="answers" />
                </Card>
                <Card
                  title="New players"
                  subtitle={`Sign-ups · last ${RANGES.find((r) => r.id === range)?.label}`}
                  icon={Users}
                >
                  <LineArea data={playerSeries} color={SERIES[1]} unit="players" />
                </Card>
                <Card title="Leaderboard" subtitle="Top players by score" icon={CheckCircle2}>
                  <HBars data={topPlayers} color={SERIES[3]} unit="pts" />
                </Card>
              </div>
            </>
          )}

          {/* ══════════ TESTIMONIES ══════════ */}
          {section === "testimonies" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Status breakdown" subtitle="Verification pipeline" icon={MessageCircleHeart}>
                <Donut data={tStatus} centerValue={data.testimonies.length} centerLabel="total" />
              </Card>
              <Card title="Display preference" subtitle="Public vs private" icon={CheckCircle2}>
                <Donut
                  data={tVisibility}
                  centerValue={data.testimonies.length}
                  centerLabel="total"
                />
              </Card>
              <Card
                title="Submissions over time"
                subtitle={`Last ${RANGES.find((r) => r.id === range)?.label}`}
                icon={Clock}
                span
              >
                <LineArea data={testimonySeries} color={SERIES[7]} unit="testimonies" />
              </Card>
            </div>
          )}

          {/* ══════════ DEVOTIONALS ══════════ */}
          {section === "devotionals" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Published vs scheduled" subtitle="Publication status" icon={BookOpen}>
                <Donut
                  data={devoStatus}
                  centerValue={data.devotionals.length}
                  centerLabel="total"
                />
              </Card>
              <Card
                title="Devotionals over time"
                subtitle={`Scheduled dates · last ${RANGES.find((r) => r.id === range)?.label}`}
                icon={Clock}
              >
                <LineArea data={devotionalSeries} color={SERIES[4]} unit="devotionals" />
              </Card>
            </div>
          )}

          {/* ══════════ SCHEDULE ══════════ */}
          {section === "schedule" && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniStat label="Recurring" value={data.schedule.recurring.length} />
                <MiniStat
                  label="Active"
                  value={data.schedule.recurring.filter((s) => s.active).length}
                />
                <MiniStat
                  label="Inactive"
                  value={data.schedule.recurring.filter((s) => !s.active).length}
                />
                <MiniStat label="Special events" value={data.schedule.special.length} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card title="Recurring services by day" subtitle="Weekly distribution" icon={Calendar}>
                  <Columns data={recurringByDay} color={SERIES[0]} unit="services" />
                </Card>
                <Card title="Entries by category" subtitle="Recurring + special" icon={Layers}>
                  <div className="space-y-4">
                    <Donut
                      data={scheduleByCategory}
                      centerValue={
                        data.schedule.recurring.length + data.schedule.special.length
                      }
                      centerLabel="entries"
                    />
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Small presentational pieces
// ──────────────────────────────────────────────
/**
 * `min-w-0` on the card is load-bearing: as a grid child it defaults to
 * min-width:auto, which would let a chart SVG's pixel width become the column's
 * minimum and stop the grid from ever shrinking on narrow screens.
 */
function Card({
  title,
  subtitle,
  icon: Icon,
  children,
  span,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${
        span ? "lg:col-span-2" : ""
      }`}
    >
      <div className="mb-4 flex items-center gap-2.5">
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tint,
  spark,
  sparkColor,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  tint: string;
  spark?: number[];
  sparkColor?: string;
  loading?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tint}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {/* The sparkline has a fixed 96px width — hidden on the narrowest
            (2-column) layout where it would overflow the tile. */}
        {spark && spark.some((v) => v > 0) && !loading && (
          <div className="hidden shrink-0 sm:block">
            <Sparkline data={spark} color={sparkColor} />
          </div>
        )}
      </div>
      <p className="mt-3 truncate text-2xl font-bold leading-none text-gray-900">
        {loading ? "—" : value}
      </p>
      <p className="mt-1 truncate text-xs font-medium uppercase tracking-tight text-gray-400">
        {label}
      </p>
      {sub && (
        <p className="mt-0.5 truncate text-[11px] font-semibold text-amber-600">
          {sub}
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="truncate text-2xl font-bold leading-none text-gray-900">
        {value}
      </p>
      <p className="mt-1 truncate text-xs font-medium uppercase tracking-tight text-gray-400">
        {label}
      </p>
    </div>
  );
}
