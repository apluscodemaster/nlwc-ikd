# Church Quiz — Implementation Plan

> **Project**: NLWC Ikorodu Audio Messages Quiz & Recommendation Engine
> **Stack**: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Supabase · Firebase · Gemini LLM
> **Date**: April 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Supabase Schema & Migrations](#2-supabase-schema--migrations)
3. [Anonymous Session Management](#3-anonymous-session-management)
4. [Quiz Data Flow](#4-quiz-data-flow)
5. [Automated Transcript Categorization (LLM)](#5-automated-transcript-categorization-llm)
6. [Recommendation Engine](#6-recommendation-engine)
7. [API Routes](#7-api-routes)
8. [Frontend Components](#8-frontend-components)
9. [Integration Guardrails](#9-integration-guardrails)
10. [Environment Variables](#10-environment-variables)
11. [File Tree (New & Modified)](#11-file-tree-new--modified)
12. [Implementation Phases](#12-implementation-phases)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP                              │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────────┐ │
│  │  Quiz UI     │   │ Leaderboard  │   │ Recommendations     │ │
│  │ (Client)     │   │ (ISR)        │   │ (Server + Client)   │ │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬──────────┘ │
│         │                  │                      │             │
│  ┌──────▼──────────────────▼──────────────────────▼──────────┐ │
│  │              API Routes (src/app/api/quiz/)               │ │
│  └──────┬──────────────────┬──────────────────────┬──────────┘ │
│         │                  │                      │             │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌───────────▼──────────┐ │
│  │  Firebase    │  │  Supabase    │  │  WordPress CMS       │ │
│  │  (Questions) │  │  (Attempts,  │  │  (Sermons,           │ │
│  │              │  │   Sessions,  │  │   Transcripts)       │ │
│  │              │  │   Mapping)   │  │                      │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                            │                                    │
│                    ┌───────▼────────┐                           │
│                    │  Gemini LLM    │                           │
│                    │ (Categorize &  │                           │
│                    │  Extract KWs)  │                           │
│                    └────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Data Ownership

| Data                 | Source        | Notes                                   |
| -------------------- | ------------- | --------------------------------------- |
| Quiz questions       | **Firebase**  | Managed via existing Admin Panel        |
| Quiz attempts        | **Supabase**  | Tracks user answers, scores, categories |
| Sessions/Leaderboard | **Supabase**  | Anonymous session with username         |
| Content mapping      | **Supabase**  | Category + keyword metadata from LLM    |
| Sermons (audio)      | **WordPress** | Fetched via existing `audioSermons.ts`  |
| Transcripts          | **WordPress** | Fetched via existing `wordpress.ts`     |

---

## 2. Supabase Schema & Migrations

### 2.1 SQL Migration

Create file: `supabase/migrations/001_quiz_schema.sql`

```sql
-- ══════════════════════════════════════════════
-- 1. Sessions (anonymous user tracking)
-- ══════════════════════════════════════════════

CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    TEXT UNIQUE NOT NULL,        -- Client-generated, stored in LocalStorage
  username      TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_active   TIMESTAMPTZ DEFAULT now(),
  total_score   INT DEFAULT 0,
  quizzes_taken INT DEFAULT 0
);

CREATE INDEX idx_sessions_session_id ON sessions (session_id);
CREATE INDEX idx_sessions_total_score ON sessions (total_score DESC);

-- ══════════════════════════════════════════════
-- 2. Quiz Attempts (individual question results)
-- ══════════════════════════════════════════════

CREATE TABLE quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    TEXT NOT NULL REFERENCES sessions(session_id),
  question_id   TEXT NOT NULL,               -- Firebase document ID
  category      TEXT NOT NULL,               -- "Sunday Message" | "Sunday School" | "Bible Study" | "Special Meeting"
  is_correct    BOOLEAN NOT NULL,
  answered_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attempts_session ON quiz_attempts (session_id);
CREATE INDEX idx_attempts_category ON quiz_attempts (session_id, category);
CREATE INDEX idx_attempts_date ON quiz_attempts (answered_at DESC);

-- ══════════════════════════════════════════════
-- 3. Content Mapping (CMS ↔ Category bridge)
-- ══════════════════════════════════════════════

CREATE TABLE content_mapping (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type     TEXT NOT NULL CHECK (source_type IN ('sermon', 'transcript')),
  source_id       INT NOT NULL,              -- WordPress post ID
  title           TEXT NOT NULL,
  slug            TEXT,
  category        TEXT NOT NULL,             -- Assigned by LLM
  keywords        TEXT[] DEFAULT '{}',       -- 3-5 keywords extracted by LLM
  speaker         TEXT,
  wp_category_id  INT,                       -- Original WP category ID
  analyzed_at     TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (source_type, source_id)
);

CREATE INDEX idx_content_category ON content_mapping (category);
CREATE INDEX idx_content_keywords ON content_mapping USING GIN (keywords);

-- ══════════════════════════════════════════════
-- 4. Row Level Security (RLS)
-- ══════════════════════════════════════════════

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_mapping ENABLE ROW LEVEL SECURITY;

-- Sessions: users can read their own, everyone can see leaderboard fields
CREATE POLICY "Users read own session"
  ON sessions FOR SELECT
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "Public leaderboard view"
  ON sessions FOR SELECT
  USING (true);  -- Leaderboard is public (username + score only via API)

CREATE POLICY "Users insert own session"
  ON sessions FOR INSERT
  WITH CHECK (true);  -- Anyone can create a session

CREATE POLICY "Users update own session"
  ON sessions FOR UPDATE
  USING (session_id = current_setting('app.session_id', true));

-- Quiz attempts: users manage their own
CREATE POLICY "Users read own attempts"
  ON quiz_attempts FOR SELECT
  USING (session_id = current_setting('app.session_id', true));

CREATE POLICY "Users insert own attempts"
  ON quiz_attempts FOR INSERT
  WITH CHECK (true);

-- Content mapping: read-only for everyone, managed by server
CREATE POLICY "Public content mapping"
  ON content_mapping FOR SELECT
  USING (true);

-- ══════════════════════════════════════════════
-- 5. Views (Leaderboard + Weak Areas)
-- ══════════════════════════════════════════════

CREATE VIEW leaderboard AS
  SELECT
    username,
    total_score,
    quizzes_taken,
    last_active
  FROM sessions
  ORDER BY total_score DESC
  LIMIT 100;

CREATE VIEW session_weak_areas AS
  SELECT
    session_id,
    category,
    COUNT(*) FILTER (WHERE is_correct = false) AS wrong_count,
    COUNT(*) AS total_count,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE is_correct = false) / NULLIF(COUNT(*), 0),
      1
    ) AS fail_rate
  FROM quiz_attempts
  GROUP BY session_id, category
  ORDER BY wrong_count DESC;
```

### 2.2 TypeScript Types

Create file: `src/types/quiz.ts`

```typescript
// ── Session ──
export interface QuizSession {
  id: string;
  session_id: string;
  username: string;
  created_at: string;
  last_active: string;
  total_score: number;
  quizzes_taken: number;
}

// ── Quiz Attempt ──
export interface QuizAttempt {
  id: string;
  session_id: string;
  question_id: string;
  category: QuizCategory;
  is_correct: boolean;
  answered_at: string;
}

// ── Content Mapping ──
export interface ContentMapping {
  id: string;
  source_type: "sermon" | "transcript";
  source_id: number;
  title: string;
  slug: string | null;
  category: QuizCategory;
  keywords: string[];
  speaker: string | null;
  wp_category_id: number | null;
  analyzed_at: string;
  updated_at: string;
}

// ── Categories ──
export type QuizCategory =
  | "Sunday Message"
  | "Sunday School"
  | "Bible Study"
  | "Special Meeting";

export const QUIZ_CATEGORIES: QuizCategory[] = [
  "Sunday Message",
  "Sunday School",
  "Bible Study",
  "Special Meeting",
];

// ── Firebase Question (read-only) ──
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index into options[]
  category: QuizCategory;
  difficulty?: "easy" | "medium" | "hard";
  sermon_ref?: string; // Optional reference to sermon/transcript
}

// ── Leaderboard Entry ──
export interface LeaderboardEntry {
  username: string;
  total_score: number;
  quizzes_taken: number;
  last_active: string;
}

// ── Weak Area ──
export interface WeakArea {
  category: QuizCategory;
  wrong_count: number;
  total_count: number;
  fail_rate: number;
}

// ── Recommendation ──
export interface Recommendation {
  category: QuizCategory;
  content: ContentMapping;
  reason: string;
  listen_url?: string; // Audio sermon URL
  read_url?: string; // Transcript URL
}

// ── Quiz Result (after completing a quiz) ──
export interface QuizResult {
  total_questions: number;
  correct_answers: number;
  score_percent: number;
  by_category: Record<QuizCategory, { correct: number; total: number }>;
  recommendations: Recommendation[];
}
```

---

## 3. Anonymous Session Management

### 3.1 Supabase Client

Create file: `src/lib/supabase.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3.2 Custom Hook: `useQuizSession`

Create file: `src/hooks/useQuizSession.ts`

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { QuizSession } from "@/types/quiz";

const SESSION_KEY = "nlwc_quiz_session";

interface StoredSession {
  session_id: string;
  username: string;
}

export function useQuizSession() {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);

  // ── Load existing session from LocalStorage ──
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed: StoredSession = JSON.parse(stored);
      syncSession(parsed.session_id).then((s) => {
        if (s) {
          setSession(s);
        } else {
          // Session exists locally but not in DB — re-create
          setNeedsUsername(true);
        }
        setLoading(false);
      });
    } else {
      setNeedsUsername(true);
      setLoading(false);
    }
  }, []);

  // ── Sync session with Supabase ──
  async function syncSession(sessionId: string): Promise<QuizSession | null> {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("session_id", sessionId)
      .single();

    if (error || !data) return null;

    // Update last_active
    await supabase
      .from("sessions")
      .update({ last_active: new Date().toISOString() })
      .eq("session_id", sessionId);

    return data as QuizSession;
  }

  // ── Create a new session ──
  const createSession = useCallback(async (username: string) => {
    const sessionId = crypto.randomUUID();

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        session_id: sessionId,
        username: username.trim(),
      })
      .select()
      .single();

    if (error) throw new Error("Failed to create session");

    const stored: StoredSession = {
      session_id: sessionId,
      username: username.trim(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));

    setSession(data as QuizSession);
    setNeedsUsername(false);

    return data as QuizSession;
  }, []);

  // ── Update score after quiz ──
  const updateScore = useCallback(
    async (additionalScore: number) => {
      if (!session) return;

      const { data } = await supabase
        .from("sessions")
        .update({
          total_score: session.total_score + additionalScore,
          quizzes_taken: session.quizzes_taken + 1,
          last_active: new Date().toISOString(),
        })
        .eq("session_id", session.session_id)
        .select()
        .single();

      if (data) setSession(data as QuizSession);
    },
    [session],
  );

  // ── Clear session (logout) ──
  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setNeedsUsername(true);
  }, []);

  return {
    session,
    loading,
    needsUsername,
    createSession,
    updateScore,
    clearSession,
  };
}
```

---

## 4. Quiz Data Flow

### Sequence Diagram

```
User visits /sermons → clicks "Take Quiz"
         │
         ▼
  ┌─ Has session? ──── No ──→ Prompt for username
  │       │                          │
  │      Yes                   createSession()
  │       │                          │
  │       ▼                          ▼
  │  Fetch questions ◄───────────────┘
  │  from Firebase
  │       │
  │       ▼
  │  Display quiz UI
  │  (one question at a time)
  │       │
  │       ▼
  │  User answers all questions
  │       │
  │       ▼
  │  POST /api/quiz/submit
  │  ├── Save each attempt to Supabase (quiz_attempts)
  │  ├── Update session score
  │  ├── Query weak areas
  │  └── Fetch recommendations from content_mapping
  │       │
  │       ▼
  │  Display results page
  │  ├── Score breakdown by category
  │  ├── "Recommended for You" section
  │  └── Leaderboard position
  └───────┘
```

### Firebase Questions Collection

Questions live in Firebase Firestore under a `quiz_questions` collection. Each document:

```typescript
// Firestore: quiz_questions/{docId}
{
  question: "What does Hebrews 11:1 define faith as?",
  options: [
    "The substance of things hoped for",
    "Belief without evidence",
    "A feeling of certainty",
    "Trust in oneself"
  ],
  correctAnswer: 0,
  category: "Sunday Message",
  difficulty: "easy",
  sermon_ref: "faith-the-foundation"  // Optional: links to a sermon slug
}
```

### Fetching Questions (Server Action)

Create file: `src/lib/quizService.ts`

```typescript
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  limit,
  orderBy,
} from "firebase/firestore";
import { supabase } from "@/lib/supabase";
import type {
  QuizQuestion,
  QuizAttempt,
  QuizCategory,
  WeakArea,
  QuizResult,
  Recommendation,
} from "@/types/quiz";

// ── Fetch questions from Firebase ──
export async function fetchQuizQuestions(
  category?: QuizCategory,
  count: number = 10,
): Promise<QuizQuestion[]> {
  const ref = collection(db, "quiz_questions");
  const constraints = [];

  if (category) {
    constraints.push(where("category", "==", category));
  }
  constraints.push(limit(count));

  const q = query(ref, ...constraints);
  const snapshot = await getDocs(q);

  const questions: QuizQuestion[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as QuizQuestion[];

  // Shuffle questions
  return questions.sort(() => Math.random() - 0.5);
}

// ── Save quiz attempts to Supabase ──
export async function saveQuizAttempts(
  sessionId: string,
  attempts: Omit<QuizAttempt, "id" | "answered_at">[],
): Promise<void> {
  const { error } = await supabase.from("quiz_attempts").insert(
    attempts.map((a) => ({
      session_id: sessionId,
      question_id: a.question_id,
      category: a.category,
      is_correct: a.is_correct,
    })),
  );

  if (error) throw new Error("Failed to save quiz attempts");
}

// ── Get weak areas for a session ──
export async function getWeakAreas(sessionId: string): Promise<WeakArea[]> {
  const { data, error } = await supabase
    .from("session_weak_areas")
    .select("*")
    .eq("session_id", sessionId);

  if (error) return [];
  return (data as WeakArea[]).filter((w) => w.fail_rate > 40);
}

// ── Get recommendations based on weak areas ──
export async function getRecommendations(
  weakAreas: WeakArea[],
): Promise<Recommendation[]> {
  if (weakAreas.length === 0) return [];

  const categories = weakAreas.map((w) => w.category);

  const { data: content } = await supabase
    .from("content_mapping")
    .select("*")
    .in("category", categories)
    .order("analyzed_at", { ascending: false })
    .limit(6);

  if (!content) return [];

  return content.map((c) => ({
    category: c.category as QuizCategory,
    content: c,
    reason: `You missed ${weakAreas.find((w) => w.category === c.category)?.wrong_count || 0} questions in "${c.category}"`,
    listen_url: c.source_type === "sermon" ? `/sermons/${c.slug}` : undefined,
    read_url:
      c.source_type === "transcript" ? `/transcripts/${c.slug}` : undefined,
  }));
}

// ── Build quiz result ──
export async function buildQuizResult(
  sessionId: string,
  attempts: Omit<QuizAttempt, "id" | "answered_at">[],
): Promise<QuizResult> {
  // Save attempts
  await saveQuizAttempts(sessionId, attempts);

  // Calculate score
  const correct = attempts.filter((a) => a.is_correct).length;
  const total = attempts.length;

  // Breakdown by category
  const byCategory: QuizResult["by_category"] = {} as QuizResult["by_category"];
  for (const a of attempts) {
    if (!byCategory[a.category]) {
      byCategory[a.category] = { correct: 0, total: 0 };
    }
    byCategory[a.category].total++;
    if (a.is_correct) byCategory[a.category].correct++;
  }

  // Get weak areas & recommendations
  const weakAreas = await getWeakAreas(sessionId);
  const recommendations = await getRecommendations(weakAreas);

  return {
    total_questions: total,
    correct_answers: correct,
    score_percent: Math.round((correct / total) * 100),
    by_category: byCategory,
    recommendations,
  };
}
```

---

## 5. Automated Transcript Categorization (LLM)

### 5.1 Server Action

Create file: `src/app/api/quiz/categorize/route.ts`

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { fetchWPPosts, transformToTranscript } from "@/lib/wordpress";
import type { QuizCategory } from "@/types/quiz";

// ── WP Category IDs → Quiz Categories ──
const WP_CATEGORY_MAP: Record<number, QuizCategory> = {
  20: "Sunday Message", // Sunday Message Transcripts
  31: "Sunday School", // Sunday School Transcripts
  33: "Bible Study", // Bible Study Transcripts
  21: "Special Meeting", // Other Meetings
  22: "Special Meeting", // Season of the Spirit
};

interface LLMAnalysis {
  category: QuizCategory;
  keywords: string[];
}

// ── Analyze a single transcript with Gemini ──
async function analyzeWithLLM(
  title: string,
  content: string,
): Promise<LLMAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  // Truncate content to ~4000 chars to stay within token limits
  const truncated = content.replace(/<[^>]+>/g, "").slice(0, 4000);

  const prompt = `You are a church content categorizer. Analyze this sermon/teaching transcript and respond with ONLY valid JSON.

Title: "${title}"
Content (excerpt): "${truncated}"

Respond with this exact JSON structure:
{
  "category": "<one of: Sunday Message, Sunday School, Bible Study, Special Meeting>",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Rules:
- category MUST be one of the four options listed above.
- keywords should be 3-5 biblical/spiritual themes (e.g. "Faith", "Holiness", "Giving", "Prayer", "Salvation").
- Return ONLY the JSON object, no additional text.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return JSON.parse(text) as LLMAnalysis;
}

// ── POST: Trigger categorization of uncategorized content ──
export async function POST(req: Request) {
  // Verify admin secret
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CATEGORIZE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batchSize = Math.min(body.batch_size || 10, 25);

  try {
    // 1. Fetch transcripts from WordPress
    const wpPosts = await fetchWPPosts({
      perPage: batchSize,
      categories: [20, 31, 33, 21, 22],
    });

    if (!wpPosts || wpPosts.length === 0) {
      return NextResponse.json({ message: "No posts to process" });
    }

    // 2. Check which are already mapped
    const postIds = wpPosts.map((p: { id: number }) => p.id);
    const { data: existing } = await supabase
      .from("content_mapping")
      .select("source_id")
      .eq("source_type", "transcript")
      .in("source_id", postIds);

    const existingIds = new Set(
      (existing || []).map((e: { source_id: number }) => e.source_id),
    );
    const newPosts = wpPosts.filter(
      (p: { id: number }) => !existingIds.has(p.id),
    );

    if (newPosts.length === 0) {
      return NextResponse.json({
        message: "All posts already categorized",
      });
    }

    // 3. Analyze each new post with LLM
    const results = [];
    for (const post of newPosts) {
      const transcript = transformToTranscript(post);

      try {
        // Try WP category mapping first, fall back to LLM
        const wpCatId = post._embedded?.["wp:term"]?.[0]?.[0]?.id;
        let analysis: LLMAnalysis;

        if (wpCatId && WP_CATEGORY_MAP[wpCatId]) {
          // We know the category from WP, just need keywords from LLM
          const llmResult = await analyzeWithLLM(
            transcript.title,
            transcript.content,
          );
          analysis = {
            category: WP_CATEGORY_MAP[wpCatId],
            keywords: llmResult.keywords,
          };
        } else {
          analysis = await analyzeWithLLM(transcript.title, transcript.content);
        }

        const { error } = await supabase.from("content_mapping").upsert(
          {
            source_type: "transcript",
            source_id: post.id,
            title: transcript.title,
            slug: transcript.slug,
            category: analysis.category,
            keywords: analysis.keywords,
            speaker: transcript.speaker || null,
            wp_category_id: wpCatId || null,
          },
          { onConflict: "source_type,source_id" },
        );

        if (!error) {
          results.push({
            id: post.id,
            title: transcript.title,
            category: analysis.category,
            keywords: analysis.keywords,
          });
        }
      } catch (err) {
        console.error(`Failed to categorize post ${post.id}:`, err);
      }
    }

    return NextResponse.json({
      processed: results.length,
      total_new: newPosts.length,
      results,
    });
  } catch (error) {
    console.error("Categorization error:", error);
    return NextResponse.json(
      { error: "Categorization failed" },
      { status: 500 },
    );
  }
}
```

### 5.2 Audio Sermon Mapping

A second route or cron job should also map audio sermons using the same approach:

```typescript
// Inside the same POST handler or a separate route:
// Fetch from getAudioSermons() → match to content_mapping by title/speaker
// This links audio content to the same category system
```

---

## 6. Recommendation Engine

### 6.1 Trigger Logic

```
User fails ≥ 3 questions in a single category
        OR
User's fail_rate in any category > 40%
        │
        ▼
Query content_mapping WHERE category = <weakest category>
        │
        ▼
Return up to 3 content items as "Recommended for You"
```

### 6.2 Recommendation Component

Create file: `src/components/quiz/Recommendations.tsx`

```typescript
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  BookOpen,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { Recommendation } from "@/types/quiz";
import Link from "next/link";

interface Props {
  recommendations: Recommendation[];
}

export function Recommendations({ recommendations }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-gray-900">
          Recommended for You
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Based on your quiz performance, these messages will help
        strengthen your understanding.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, i) => (
          <motion.div
            key={rec.content.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl bg-white border border-gray-100
                       shadow-sm hover:shadow-md transition-all"
          >
            {/* Category badge */}
            <span className="inline-block text-[10px] font-bold uppercase
                             tracking-widest text-primary bg-primary/10
                             px-2.5 py-1 rounded-full mb-3">
              {rec.category}
            </span>

            <h4 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">
              {rec.content.title}
            </h4>

            {/* Keywords */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {rec.content.keywords.slice(0, 3).map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] px-2 py-0.5 rounded-full
                             bg-gray-100 text-gray-600"
                >
                  {kw}
                </span>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              {rec.reason}
            </p>

            {/* Action links */}
            <div className="flex gap-2">
              {rec.listen_url && (
                <Link
                  href={rec.listen_url}
                  className="flex items-center gap-1.5 text-xs font-semibold
                             text-primary hover:underline"
                >
                  <Headphones className="w-3.5 h-3.5" />
                  Listen
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
              {rec.read_url && (
                <Link
                  href={rec.read_url}
                  className="flex items-center gap-1.5 text-xs font-semibold
                             text-primary hover:underline"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Read
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
```

---

## 7. API Routes

### Route Map

```
src/app/api/quiz/
├── questions/
│   └── route.ts          GET    → Fetch questions from Firebase
├── submit/
│   └── route.ts          POST   → Submit answers, return results + recs
├── leaderboard/
│   └── route.ts          GET    → Public leaderboard (ISR-friendly)
├── session/
│   └── route.ts          POST   → Create/sync session
└── categorize/
    └── route.ts          POST   → LLM transcript categorization (admin only)
```

### 7.1 `GET /api/quiz/questions`

```typescript
// Query params: ?category=Sunday+Message&count=10
// Source: Firebase quiz_questions collection
// Returns: QuizQuestion[] (shuffled, correctAnswer omitted for client)
// Cache: no-cache (always fresh, randomized)
```

### 7.2 `POST /api/quiz/submit`

```typescript
// Body: { session_id, answers: [{ question_id, category, selected_answer }] }
// Logic:
//   1. Verify answers against Firebase (server-side correctness check)
//   2. Save attempts to Supabase
//   3. Update session score
//   4. Query weak areas
//   5. Fetch recommendations
// Returns: QuizResult
// Cache: no-cache
```

### 7.3 `GET /api/quiz/leaderboard`

```typescript
// Returns: LeaderboardEntry[] (top 100)
// Cache: 60 seconds (revalidate on-demand after quiz submit)
// Headers: Cache-Control: s-maxage=60, stale-while-revalidate=300
```

### 7.4 `POST /api/quiz/session`

```typescript
// Body: { session_id, username }
// Logic: Upsert session in Supabase
// Returns: QuizSession
```

---

## 8. Frontend Components

### Component Tree

```
src/components/quiz/
├── QuizLauncher.tsx           "Take Quiz" button on sermons page
├── UsernamePrompt.tsx         Modal to enter username (first visit)
├── QuizPlayer.tsx             Full quiz UI (questions, timer, progress)
├── QuestionCard.tsx           Single question with options
├── QuizResults.tsx            Score display + breakdown
├── Recommendations.tsx        Suggested sermons/transcripts
├── Leaderboard.tsx            Top scores table
└── QuizSessionProvider.tsx    Context provider wrapping useQuizSession
```

### 8.1 Integration Points

**Sermons page** (`src/app/sermons/page.tsx` or `SermonsPageContent.tsx`):

- Add a `<QuizLauncher />` button in the hero/header area
- Optionally show quiz prompts after a user finishes listening to a sermon

**New quiz page** (`src/app/sermons/quiz/page.tsx`):

- Dedicated quiz page nested under sermons
- Contains `<QuizPlayer />`, `<QuizResults />`, `<Recommendations />`
- Shows `<Leaderboard />` in a sidebar or below results

### 8.2 Quiz Page Structure

Create file: `src/app/sermons/quiz/page.tsx`

```
┌──────────────────────────────────────────────┐
│  PageHeader: "Bible Knowledge Quiz"          │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─ Before Quiz ──────────────────────────┐  │
│  │  Category selector (tabs)              │  │
│  │  "Start Quiz" button                   │  │
│  │  Leaderboard preview (top 5)           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ During Quiz ──────────────────────────┐  │
│  │  Progress bar (3/10)                   │  │
│  │  Question card with 4 options          │  │
│  │  Timer (optional)                      │  │
│  │  "Next" button                         │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌─ After Quiz ───────────────────────────┐  │
│  │  Score: 7/10 (70%)                     │  │
│  │  Breakdown by category (bar chart)     │  │
│  │  Recommended for You (3 cards)         │  │
│  │  Full Leaderboard                      │  │
│  │  "Try Again" / "Share Score" buttons   │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 9. Integration Guardrails

| Rule                                          | Detail                                                                                                                                    |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Do NOT migrate Firebase**                   | Questions stay in Firestore. Fetch with Firebase SDK client-side or in Server Actions.                                                    |
| **Do NOT expose correct answers client-side** | The `GET /api/quiz/questions` route must strip `correctAnswer` from responses. Validation happens server-side in `POST /api/quiz/submit`. |
| **Supabase RLS**                              | Enforce via policies. API routes use `supabase` service role only for admin operations (categorization). Client-side uses anon key.       |
| **ISR for Leaderboard**                       | Use `revalidateTag("leaderboard")` after each quiz submission. Leaderboard route sets `Cache-Control: s-maxage=60`.                       |
| **Revalidation for Recommendations**          | Use On-Demand Revalidation via `revalidatePath("/sermons/quiz")` after categorization runs.                                               |
| **Categorization is admin-only**              | Protected by `CATEGORIZE_SECRET` env var. Trigger manually or via cron (e.g., Vercel Cron).                                               |
| **No account required**                       | Session is tied to LocalStorage `session_id`. No email, no password. Username is display-only for leaderboard.                            |

---

## 10. Environment Variables

Add to `.env.local`:

```bash
# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...       # Server-side only, never exposed

# ── Gemini LLM ──
GEMINI_API_KEY=AIza...

# ── Admin ──
CATEGORIZE_SECRET=<random-secret>      # Protects the categorization endpoint

# ── Existing (already configured) ──
# NEXT_PUBLIC_FIREBASE_*               # Already in .env.local
# NEXT_PUBLIC_WORDPRESS_URL            # Already in .env.local
```

---

## 11. File Tree (New & Modified)

```
src/
├── app/
│   ├── api/
│   │   └── quiz/
│   │       ├── questions/
│   │       │   └── route.ts           ★ NEW — Fetch quiz questions
│   │       ├── submit/
│   │       │   └── route.ts           ★ NEW — Submit answers & get results
│   │       ├── leaderboard/
│   │       │   └── route.ts           ★ NEW — Public leaderboard
│   │       ├── session/
│   │       │   └── route.ts           ★ NEW — Create/sync session
│   │       └── categorize/
│   │           └── route.ts           ★ NEW — LLM categorization (admin)
│   └── sermons/
│       ├── page.tsx                   ✏️ MODIFIED — Add QuizLauncher
│       └── quiz/
│           └── page.tsx               ★ NEW — Quiz page
│
├── components/
│   └── quiz/
│       ├── QuizLauncher.tsx           ★ NEW
│       ├── UsernamePrompt.tsx         ★ NEW
│       ├── QuizPlayer.tsx             ★ NEW
│       ├── QuestionCard.tsx           ★ NEW
│       ├── QuizResults.tsx            ★ NEW
│       ├── Recommendations.tsx        ★ NEW
│       ├── Leaderboard.tsx            ★ NEW
│       └── QuizSessionProvider.tsx    ★ NEW
│
├── hooks/
│   └── useQuizSession.ts             ★ NEW
│
├── lib/
│   ├── supabase.ts                   ★ NEW
│   └── quizService.ts                ★ NEW
│
├── types/
│   └── quiz.ts                       ★ NEW
│
supabase/
└── migrations/
    └── 001_quiz_schema.sql            ★ NEW
```

**Total: 17 new files, 1 modified file.**

---

## 12. Implementation Phases

### Phase 1 — Foundation (Database + Session)

- [ ] Set up Supabase project and run SQL migration
- [ ] Create `src/lib/supabase.ts` client
- [ ] Create `src/types/quiz.ts` type definitions
- [ ] Build `useQuizSession` hook with LocalStorage + Supabase sync
- [ ] Build `UsernamePrompt` component
- [ ] Create `POST /api/quiz/session` route

### Phase 2 — Quiz Core (Questions + Gameplay)

- [ ] Set up `quiz_questions` collection in Firebase (via existing Admin Panel)
- [ ] Create `GET /api/quiz/questions` route (fetch from Firebase, strip answers)
- [ ] Build `QuestionCard`, `QuizPlayer` components
- [ ] Create `POST /api/quiz/submit` route (validate answers server-side, save attempts)
- [ ] Build `QuizResults` component with category breakdown
- [ ] Create `src/app/sermons/quiz/page.tsx`

### Phase 3 — Intelligence (LLM + Recommendations)

- [ ] Create `POST /api/quiz/categorize` route with Gemini integration
- [ ] Run initial categorization of existing WordPress transcripts
- [ ] Build `quizService.ts` with `getWeakAreas()` and `getRecommendations()`
- [ ] Build `Recommendations` component
- [ ] Wire recommendations into quiz results page

### Phase 4 — Engagement (Leaderboard + Polish)

- [ ] Create `GET /api/quiz/leaderboard` route with ISR
- [ ] Build `Leaderboard` component
- [ ] Build `QuizLauncher` button and integrate into sermons page
- [ ] Add On-Demand Revalidation triggers
- [ ] Mobile-responsive polish and animation passes
- [ ] Testing: end-to-end flow, edge cases (no session, empty questions, LLM failure)

### Phase 5 — Production

- [ ] Install `@supabase/supabase-js` dependency
- [ ] Configure environment variables on Vercel
- [ ] Set up Supabase RLS policies and test access patterns
- [ ] Optional: Vercel Cron for periodic auto-categorization
- [ ] Deploy and monitor

---

## Dependencies to Install

```bash
npm i @supabase/supabase-js
```

No other new dependencies needed — the project already has Firebase, React Query, Framer Motion, Radix UI, Zod, and Tailwind CSS.
