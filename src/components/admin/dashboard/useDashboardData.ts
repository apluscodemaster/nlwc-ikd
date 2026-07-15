"use client";

/**
 * Aggregates data from every admin section into one dashboard payload:
 *   • Church content  — WordPress (sermons / transcripts / manuals + ministers/series)
 *   • Quiz            — Supabase (players, attempts, category accuracy, sessions)
 *   • Testimonies     — Firestore (realtime; status + submission dates)
 *   • Devotionals     — Firestore (scheduled vs published)
 *   • Schedule        — recurring services + special events
 *
 * Content/quiz/schedule are refetched on demand; testimonies stream in real
 * time via a Firestore subscription.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  subscribeToAllTestimonies,
  type Testimony,
} from "@/lib/testimonyService";
import { getAllDevotionals } from "@/lib/devotionals";
import { getAuthorizationHeader } from "@/lib/authClient";

export interface SpeakerStat {
  name: string;
  messageCount: number;
}
export interface SeriesStat {
  title: string;
  messageCount: number;
}
export interface QuizStats {
  totalPlayers: number;
  totalQuizzesTaken: number;
  totalAttempts: number;
  totalCorrect: number;
  avgScore: number;
  categoryStats: Record<string, { total: number; correct: number }>;
  allSessions: {
    session_id: string;
    username: string;
    total_score: number;
    quizzes_taken: number;
    last_active: string;
    created_at: string;
  }[];
}
export interface ScheduleEntry {
  id?: string;
  label: string;
  active: boolean;
  category?: string;
  dayOfWeek?: number;
  date?: string;
}
export interface DevotionalLite {
  id: string;
  title: string;
  date: number; // scheduledDate in ms
  scheduled: boolean; // future-dated
}

export interface DashboardData {
  content: {
    sermons: number;
    transcripts: number;
    manuals: number;
    speakers: SpeakerStat[];
    series: SeriesStat[];
  };
  quiz: QuizStats | null;
  testimonies: Testimony[];
  devotionals: DevotionalLite[];
  schedule: { recurring: ScheduleEntry[]; special: ScheduleEntry[] };
}

const EMPTY: DashboardData = {
  content: { sermons: 0, transcripts: 0, manuals: 0, speakers: [], series: [] },
  quiz: null,
  testimonies: [],
  devotionals: [],
  schedule: { recurring: [], special: [] },
};

async function fetchContentCount(
  type: "sermon" | "transcript" | "manual",
): Promise<number> {
  try {
    const res = await fetch(`/api/wp/content?type=${type}&page=1&per_page=1`);
    const data = await res.json();
    const p = data?.pagination;
    return (
      p?.total ??
      p?.totalItems ??
      (Array.isArray(data?.items) ? data.items.length : 0)
    );
  } catch {
    return 0;
  }
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const testimoniesRef = useRef<Testimony[]>([]);

  // ── one-shot loaders (content, quiz, schedule, devotionals) ───────────────
  const loadStatic = useCallback(async () => {
    setError(null);
    try {
      // The quiz stats route is admin-authenticated (it exposes player data), so
      // it needs the Firebase ID token — the /admin layout's gate is UI-only.
      const authHeader = await getAuthorizationHeader().catch(() => "");

      const [
        sermons,
        transcripts,
        manuals,
        speakersRes,
        seriesRes,
        quizRes,
        scheduleRes,
        devos,
      ] = await Promise.all([
        fetchContentCount("sermon"),
        fetchContentCount("transcript"),
        fetchContentCount("manual"),
        fetch("/api/wp/speakers")
          .then((r) => r.json())
          .catch(() => ({ speakers: [] })),
        fetch("/api/wp/speakers?type=series")
          .then((r) => r.json())
          .catch(() => ({ series: [] })),
        fetch("/api/quiz/admin/stats", {
          headers: authHeader ? { Authorization: authHeader } : undefined,
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch("/api/schedule", { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => ({ recurring: [], special: [] })),
        getAllDevotionals().catch(() => []),
      ]);

      const devotionals: DevotionalLite[] = devos.map((d) => {
        const ms = d.scheduledDate?.toMillis
          ? d.scheduledDate.toMillis()
          : new Date(
              d.scheduledDate as unknown as string,
            ).getTime();
        return {
          id: d.id,
          title: d.title,
          date: ms,
          scheduled: ms > Date.now(),
        };
      });

      setData((prev) => ({
        ...prev,
        content: {
          sermons,
          transcripts,
          manuals,
          speakers: speakersRes?.speakers ?? [],
          series: seriesRes?.series ?? [],
        },
        quiz: quizRes
          ? {
              totalPlayers: quizRes.totalPlayers ?? 0,
              totalQuizzesTaken: quizRes.totalQuizzesTaken ?? 0,
              totalAttempts: quizRes.totalAttempts ?? 0,
              totalCorrect: quizRes.totalCorrect ?? 0,
              avgScore: quizRes.avgScore ?? 0,
              categoryStats: quizRes.categoryStats ?? {},
              allSessions: quizRes.allSessions ?? quizRes.recentSessions ?? [],
            }
          : null,
        schedule: {
          recurring: scheduleRes?.recurring ?? [],
          special: scheduleRes?.special ?? [],
        },
        devotionals,
      }));
      setLastUpdated(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data");
    }
  }, []);

  // ── testimonies realtime subscription ─────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToAllTestimonies((t) => {
      testimoniesRef.current = t;
      setData((prev) => ({ ...prev, testimonies: t }));
    });
    return unsub;
  }, []);

  // ── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadStatic();
      setLoading(false);
    })();
  }, [loadStatic]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadStatic();
    setRefreshing(false);
  }, [loadStatic]);

  return { data, loading, refreshing, error, lastUpdated, refresh };
}
