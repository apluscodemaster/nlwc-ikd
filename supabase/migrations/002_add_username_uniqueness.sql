-- ══════════════════════════════════════════════
-- Add username uniqueness constraint
-- Run this in Supabase SQL Editor to enforce unique usernames
-- ══════════════════════════════════════════════

-- Add UNIQUE constraint to username column
-- This ensures no two users can have the same username
ALTER TABLE sessions
ADD CONSTRAINT sessions_username_unique UNIQUE (username);

-- Create index for faster lookups
CREATE INDEX idx_sessions_username ON sessions (username);
