-- ══════════════════════════════════════════════
-- NLWC Ikorodu Quiz Schema
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════

-- 1. Sessions (anonymous user tracking)
CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    TEXT UNIQUE NOT NULL,
  username      TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_active   TIMESTAMPTZ DEFAULT now(),
  total_score   INT DEFAULT 0,
  quizzes_taken INT DEFAULT 0
);

CREATE INDEX idx_sessions_session_id ON sessions (session_id);
CREATE INDEX idx_sessions_total_score ON sessions (total_score DESC);

-- 2. Quiz Attempts (individual question results)
CREATE TABLE quiz_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    TEXT NOT NULL REFERENCES sessions(session_id),
  question_id   TEXT NOT NULL,
  category      TEXT NOT NULL,
  is_correct    BOOLEAN NOT NULL,
  answered_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attempts_session ON quiz_attempts (session_id);
CREATE INDEX idx_attempts_category ON quiz_attempts (session_id, category);
CREATE INDEX idx_attempts_date ON quiz_attempts (answered_at DESC);

-- 3. Content Mapping (CMS ↔ Category bridge)
CREATE TABLE content_mapping (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type     TEXT NOT NULL CHECK (source_type IN ('sermon', 'transcript')),
  source_id       INT NOT NULL,
  title           TEXT NOT NULL,
  slug            TEXT,
  category        TEXT NOT NULL,
  keywords        TEXT[] DEFAULT '{}',
  speaker         TEXT,
  wp_category_id  INT,
  analyzed_at     TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (source_type, source_id)
);

CREATE INDEX idx_content_category ON content_mapping (category);
CREATE INDEX idx_content_keywords ON content_mapping USING GIN (keywords);

-- 4. Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_mapping ENABLE ROW LEVEL SECURITY;

-- Sessions: public read for leaderboard, insert for anyone
CREATE POLICY "Public leaderboard view"
  ON sessions FOR SELECT USING (true);

CREATE POLICY "Users insert own session"
  ON sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update own session"
  ON sessions FOR UPDATE USING (true);

-- Quiz attempts: insert for anyone, select own via API (enforced server-side)
CREATE POLICY "Insert attempts"
  ON quiz_attempts FOR INSERT WITH CHECK (true);

CREATE POLICY "Read attempts"
  ON quiz_attempts FOR SELECT USING (true);

-- Content mapping: public read, server-managed writes
CREATE POLICY "Public content mapping read"
  ON content_mapping FOR SELECT USING (true);

CREATE POLICY "Server content mapping write"
  ON content_mapping FOR INSERT WITH CHECK (true);

CREATE POLICY "Server content mapping update"
  ON content_mapping FOR UPDATE USING (true);

-- 5. Views
CREATE OR REPLACE VIEW leaderboard AS
  SELECT session_id, username, total_score, quizzes_taken, last_active
  FROM sessions
  ORDER BY total_score DESC
  LIMIT 100;

-- 6. RPC: Atomic score increment
CREATE OR REPLACE FUNCTION increment_quiz_count(sid TEXT, points INT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE sessions
  SET total_score = total_score + points,
      quizzes_taken = quizzes_taken + 1,
      last_active = now()
  WHERE session_id = sid;
END;
$$;

CREATE OR REPLACE VIEW session_weak_areas AS
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
