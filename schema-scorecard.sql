-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- Table for Growth Readiness Scorecard submissions (scorecard.html).
-- Safe to re-run: every statement skips anything that already exists.

CREATE TABLE IF NOT EXISTS scorecard_submissions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT,
  email            TEXT        NOT NULL,
  business_name    TEXT,
  website          TEXT,
  budget           TEXT,
  score            INTEGER     NOT NULL,
  tier             TEXT,
  category_scores  JSONB,
  answers          JSONB,
  qualifiers       JSONB,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scorecard_email      ON scorecard_submissions (email);
CREATE INDEX IF NOT EXISTS idx_scorecard_created_at ON scorecard_submissions (created_at DESC);

-- ── Migration (Nov 2026): "About You" qualifier answers ──
-- For tables created before Nov 2026. Stores current situation, 90-day goal,
-- main obstacle, help preference (diy / dwy / dfy) and the optional free-text note.
-- Until it's run, /api/scorecard still saves submissions, just without qualifiers.
ALTER TABLE scorecard_submissions ADD COLUMN IF NOT EXISTS qualifiers JSONB;
