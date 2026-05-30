-- ══════════════════════════════════════════════
-- Deduplicate quiz_attempts and add UNIQUE constraint
-- Prevents the same question from being scored multiple times per session
-- ══════════════════════════════════════════════

-- 1. Remove duplicate rows, keeping only the latest attempt per (session_id, question_id)
DELETE FROM quiz_attempts a
  USING quiz_attempts b
  WHERE a.session_id = b.session_id
    AND a.question_id = b.question_id
    AND a.answered_at < b.answered_at;

-- 2. Handle exact timestamp ties (keep the one with the smaller id)
DELETE FROM quiz_attempts a
  USING quiz_attempts b
  WHERE a.session_id = b.session_id
    AND a.question_id = b.question_id
    AND a.answered_at = b.answered_at
    AND a.id > b.id;

-- 3. Add the UNIQUE constraint so duplicates can never be inserted again
ALTER TABLE quiz_attempts
  ADD CONSTRAINT uq_session_question UNIQUE (session_id, question_id);

-- 4. Recompute total_score for all sessions from deduplicated quiz_attempts
--    This fixes any inflated scores from historical duplicates
UPDATE sessions s
SET total_score = COALESCE(sub.correct_count, 0)
FROM (
  SELECT session_id, COUNT(*) FILTER (WHERE is_correct = true) AS correct_count
  FROM quiz_attempts
  GROUP BY session_id
) sub
WHERE s.session_id = sub.session_id;

-- Also reset scores for sessions with zero attempts (edge case)
UPDATE sessions
SET total_score = 0
WHERE session_id NOT IN (SELECT DISTINCT session_id FROM quiz_attempts);
