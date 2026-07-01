-- Run this in your Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- Adds the table for Growth Readiness Scorecard submissions (scorecard.html)

CREATE TABLE scorecard_submissions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT,
  email            TEXT        NOT NULL,
  business_name    TEXT,
  website          TEXT,
  budget           TEXT,
  score             INTEGER     NOT NULL,
  tier             TEXT,
  category_scores  JSONB,
  answers          JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scorecard_email      ON scorecard_submissions (email);
CREATE INDEX idx_scorecard_created_at ON scorecard_submissions (created_at DESC);
