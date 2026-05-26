-- ══════════════════════════════════════════════
-- Quiz Categories Table
-- Stores dynamic quiz categories (admin-managed)
-- ══════════════════════════════════════════════

CREATE TABLE quiz_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_quiz_categories_name ON quiz_categories (name);

-- Row Level Security
ALTER TABLE quiz_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public categories read"
  ON quiz_categories FOR SELECT USING (true);

CREATE POLICY "Server categories insert"
  ON quiz_categories FOR INSERT WITH CHECK (true);

CREATE POLICY "Server categories delete"
  ON quiz_categories FOR DELETE USING (true);

-- Seed with existing categories
INSERT INTO quiz_categories (name) VALUES
  ('Sunday Message'),
  ('Sunday School'),
  ('Bible Study'),
  ('Special Meeting'),
  ('Season of the Spirit')
ON CONFLICT (name) DO NOTHING;
